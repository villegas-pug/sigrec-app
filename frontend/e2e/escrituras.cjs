// SPEC 038: escrituras aisladas y recuperación mediante un diario sin credenciales.
const { request } = require('playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

const base = process.env.SIGREC_E2E_URL || 'http://127.0.0.1:9000'
const diario = path.resolve(__dirname, '../artifacts/e2e/escrituras-pendientes.json')
const motivo = { motivo: 'E2E: limpieza de registros de prueba' }
let comprobaciones = 0

async function main () {
  assert.ok(process.env.SIGREC_DEMO_CENTRAL_PASSWORD, 'Falta SIGREC_DEMO_CENTRAL_PASSWORD')
  const ctx = await request.newContext({ baseURL: base, timeout: 45000 })
  let csrf
  async function llamar (metodo, ruta, datos, esperado = 200) {
    const response = await ctx.fetch(`/api/v1/${ruta}`, {
      method: metodo,
      ...(metodo !== 'GET' ? { headers: { [csrf.header]: csrf.token } } : {}),
      ...(datos === undefined ? {} : { data: datos })
    })
    const json = await response.json().catch(() => ({}))
    assert.equal(response.status(), esperado, `${metodo} ${ruta}: ${json.message || 'respuesta inesperada'}`)
    comprobaciones++
    return json.data
  }
  async function login () {
    csrf = (await (await ctx.get('/api/v1/auth/csrf')).json()).data
    await llamar('POST', 'auth/login', { usuario: 'demo.central', password: process.env.SIGREC_DEMO_CENTRAL_PASSWORD })
    csrf = (await (await ctx.get('/api/v1/auth/csrf')).json()).data
  }
  async function limpiar (registro) {
    const inventarioGlobal = await llamar('GET', 'bienes/datos')
    const bienCar = inventarioGlobal.bienes.find(b => b.id === `${registro.nombre}-CAR`)
    if (bienCar) {
      assert.equal(bienCar.nombre, `${registro.nombre} bien CAR`, 'Bien CAR ajeno: limpieza interrumpida')
      if (!bienCar.anulacion) await llamar('POST', `bienes/${bienCar.id}/anular`, motivo)
    }
    const itinerarios = await llamar('GET', 'itinerarios')
    const propios = itinerarios.filter(i => i.proposito === `${registro.nombre} recorrido` && i.vehiculoId === 'AMA-V01')
    const combustibles = await llamar('GET', 'combustible')
    for (const item of combustibles.filter(c => c.sustento === `${registro.nombre} consumo` && propios.some(i => i.id === c.itinerarioId))) {
      if (!item.anulacion) await llamar('POST', `combustible/${item.id}/anular`, motivo)
    }
    for (const item of propios.filter(i => !i.anulacion)) await llamar('POST', `itinerarios/${item.id}/anular`, motivo)
    const jerarquia = await llamar('GET', 'centros/jerarquia')
    const centro = jerarquia.cars.find(c => c.id === registro.codigo)
    if (!centro) return
    assert.equal(centro.nombre, registro.nombre, 'Se interrumpió la limpieza: centro no coincide con el diario')
    const modulos = jerarquia.modulos.filter(m => m.carId === registro.codigo)
    const ambientes = jerarquia.ambientes.filter(a => a.carId === registro.codigo)
    assert.ok(modulos.every(m => m.nombre.startsWith(registro.nombre)), 'Módulo ajeno: limpieza interrumpida')
    assert.ok(ambientes.every(a => a.nombre.startsWith(registro.nombre)), 'Ambiente ajeno: limpieza interrumpida')
    const fotos = await llamar('GET', 'fotos')
    for (const foto of fotos.filter(f => f.carId === registro.codigo || ambientes.some(x => x.id === f.ambienteId))) {
      assert.ok(foto.titulo.startsWith(registro.nombre), 'Foto ajena: limpieza interrumpida')
      if (!foto.anulacion) await llamar('POST', `fotos/${foto.id}/anular`, motivo)
    }
    const mantenimientos = await llamar('GET', 'mantenimientos')
    for (const item of mantenimientos.filter(m => m.carId === registro.codigo)) {
      assert.ok(item.detalle?.startsWith(registro.nombre), 'Mantenimiento ajeno: limpieza interrumpida')
      if (!item.anulacion) await llamar('POST', `mantenimientos/${item.id}/anular`, motivo)
    }
    const servicios = await llamar('GET', 'servicios')
    for (const servicio of servicios.filter(s => s.carId === registro.codigo)) {
      assert.ok(servicio.proveedor.startsWith(registro.nombre), 'Servicio ajeno: limpieza interrumpida')
      if (!servicio.anulacion) {
        for (const hecho of servicio.hechos.filter(h => !h.anulacion)) await llamar('POST', `servicios/${servicio.id}/hechos/${hecho.id}/anular`, motivo)
        await llamar('POST', `servicios/${servicio.id}/anular`, motivo)
      }
    }
    const vehiculos = await llamar('GET', 'vehiculos')
    for (const vehiculo of vehiculos.filter(v => v.carId === registro.codigo)) {
      assert.equal(vehiculo.chofer, registro.nombre, 'Vehículo ajeno: limpieza interrumpida')
      if (!vehiculo.anulacion) await llamar('POST', `vehiculos/${vehiculo.id}/anular`, motivo)
    }
    const inventario = await llamar('GET', 'bienes/datos')
    const eventos = inventario.eventos.filter(e => ambientes.some(a => a.id === e.ambienteId) && !e.anulacion)
    for (const evento of eventos.filter(e => e.tipo === 'reposicion')) {
      assert.ok(evento.bienAnteriorId.startsWith(registro.nombre) && evento.bienNuevoId.startsWith(registro.nombre), 'Reposición ajena: limpieza interrumpida')
      await llamar('POST', `incidencias/reposiciones/${evento.id}/anular`, motivo)
    }
    for (const evento of eventos.filter(e => e.tipo === 'baja')) {
      assert.ok(evento.bienIds.every(id => id.startsWith(registro.nombre)), 'Baja ajena: limpieza interrumpida')
      await llamar('POST', `incidencias/bajas/${evento.id}/anular`, motivo)
    }
    for (const evento of eventos.filter(e => e.origen && e.titulo.startsWith(registro.nombre))) {
      await llamar('POST', `incidencias/${evento.id}/anular`, motivo)
    }
    for (const bien of inventario.bienes.filter(b => ambientes.some(a => a.id === b.ambienteId))) {
      assert.ok(bien.id.startsWith(registro.nombre), 'Bien ajeno: limpieza interrumpida')
      if (!bien.anulacion) await llamar('POST', `bienes/${bien.id}/anular`, motivo)
    }
    // Los tipos propios se anulan cuando ya no tienen bienes activos.
    const tipos = await llamar('GET', 'catalogos/tipos-bien')
    for (const tipo of tipos.filter(t => t.nombre === `${registro.nombre} tipo` && !t.anulacion)) {
      await llamar('POST', `catalogos/tipos-bien/${tipo.id}/anular`, motivo)
    }
    const intervenciones = await llamar('GET', 'intervenciones')
    for (const item of intervenciones.filter(i => ambientes.some(a => a.id === i.ambienteId))) {
      assert.ok(item.descripcion.startsWith(registro.nombre), 'Intervención ajena: limpieza interrumpida')
      if (!item.anulacion) await llamar('POST', `intervenciones/${item.id}/anular`, motivo)
    }
    for (const ambiente of ambientes.filter(a => !a.anulacion)) await llamar('POST', `ambientes/${ambiente.id}/anular`, motivo)
    for (const modulo of modulos.filter(m => !m.anulacion)) await llamar('POST', `modulos/${modulo.id}/anular`, motivo)
    if (!centro.anulacion) await llamar('POST', `centros/${registro.codigo}/anular`, motivo)
    const despues = await llamar('GET', 'centros/jerarquia')
    assert.ok(despues.cars.find(c => c.id === registro.codigo)?.anulacion, 'El centro no quedó anulado')
  }
  try {
    await login()
    if (fs.existsSync(diario)) {
      await limpiar(JSON.parse(fs.readFileSync(diario, 'utf8')))
      fs.unlinkSync(diario)
    }
    const actual = await llamar('GET', 'centros/jerarquia')
    const disponibles = []
    for (let a = 65; a <= 90; a++) for (let b = 65; b <= 90; b++) {
      const codigo = `E${String.fromCharCode(a, b)}`
      if (!actual.cars.some(c => c.id === codigo)) disponibles.push(codigo)
    }
    assert.ok(disponibles.length, 'No hay códigos disponibles para el centro E2E')
    const registro = { codigo: disponibles[crypto.randomInt(disponibles.length)], nombre: `E2E-${crypto.randomBytes(8).toString('hex')}` }
    fs.mkdirSync(path.dirname(diario), { recursive: true })
    fs.writeFileSync(diario, JSON.stringify(registro), { flag: 'wx' })
    try {
      const centro = { id: registro.codigo, nombre: registro.nombre, inmueble: { direccion: `${registro.nombre} dirección`, condicion: 'propio' } }
      await llamar('POST', 'centros', centro, 201)
      await llamar('POST', 'centros', centro, 409)
      await llamar('POST', 'centros', { ...centro, id: '1' }, 400)
      await llamar('POST', 'centros/ZZZ/anular', motivo, 404)
      const modulo = (await llamar('POST', 'modulos', { carId: registro.codigo, nombre: `${registro.nombre} módulo`, tipo: 'comun', pisos: 1, condicion: 'bueno' }, 201)).registro
      const ambiente = (await llamar('POST', 'ambientes', { moduloId: modulo.id, nombre: `${registro.nombre} ambiente`, condicion: 'bueno' }, 201)).registro
      const ambienteDestino = (await llamar('POST', 'ambientes', { moduloId: modulo.id, nombre: `${registro.nombre} destino`, condicion: 'bueno' }, 201)).registro
      await llamar('POST', `modulos/${modulo.id}/anular`, motivo, 409)
      const intervencion = (await llamar('POST', 'intervenciones', { ambienteId: ambiente.id, datos: { descripcion: `${registro.nombre} intervención`, fecha: '2026-01', esPintado: true } }, 201)).registro
      assert.ok(intervencion.id)
      const imagen = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aXcAAAAASUVORK5CYII=', 'base64')
      const fotoResponse = await ctx.post('/api/v1/fotos', { headers: { [csrf.header]: csrf.token }, multipart: {
        datos: { name: 'datos.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ carId: registro.codigo, datos: { titulo: `${registro.nombre} foto` } })) },
        archivo: { name: 'e2e.png', mimeType: 'image/png', buffer: imagen }
      } })
      assert.equal(fotoResponse.status(), 201, 'Alta de foto')
      comprobaciones++
      const foto = (await fotoResponse.json()).data
      const contenido = await ctx.get(`/api/v1/fotos/${foto.id}/contenido`)
      assert.equal(contenido.status(), 200)
      assert.deepEqual(await contenido.body(), imagen)
      comprobaciones++
      await llamar('POST', 'mantenimientos', { carId: registro.codigo, tipo: 'fumigacion', objetivos: [], quedaOperativo: false, datos: { fecha: '2026-01-15', detalle: `${registro.nombre} mantenimiento` } }, 201)
      const bien = { id: `${registro.nombre}-BIEN`, ambienteId: ambiente.id, tipoId: 'camarote', nombre: `${registro.nombre} bien`, categoria: 'mobiliario', condicion: 'bueno', cantidad: 1 }
      await llamar('POST', 'bienes', { bien }, 201)
      await llamar('POST', 'bienes', { bien }, 409)
      await llamar('POST', `bienes/${bien.id}/verificacion`, { resultado: 'coincide', nota: registro.nombre, fecha: '2026-01-15' })
      await llamar('POST', `bienes/${bien.id}/traslado`, { ambienteId: ambienteDestino.id, fecha: '2026-01-16' })
      await llamar('PUT', `bienes/${bien.id}`, { bien: { ...bien, ambienteId: ambienteDestino.id, condicion: 'regular', deterioro: `${registro.nombre} desgaste` } })
      await llamar('POST', `bienes/${bien.id}/anular`, motivo)
      await llamar('POST', `bienes/${bien.id}/reactivar`)
      const incidente = await llamar('POST', 'incidencias', { novedad: true, datos: { origen: { tipo: 'ambiente', id: ambienteDestino.id }, tipo: 'humedad', titulo: `${registro.nombre} incidencia`, fecha: '2026-01-15' } }, 201)
      await llamar('POST', `incidencias/${incidente.id}/atender`, { fecha: '2026-01-16', detalle: `${registro.nombre} atención` })
      const baja = await llamar('POST', `incidencias/bajas/${bien.id}`, { motivo: `${registro.nombre} baja`, fecha: '2026-01-17' }, 201)
      await llamar('POST', `incidencias/reposiciones/${bien.id}`, { rotulo: `${registro.nombre}-REPOSICION`, nombre: `${registro.nombre} reposición`, fecha: '2026-01-18' }, 201)
      assert.ok(baja.id)
      const tipo = await llamar('POST', 'catalogos/tipos-bien', { nombre: `${registro.nombre} tipo`, categoria: 'mobiliario' }, 201)
      await llamar('PUT', `precios/${tipo.id}`, { precio: 12.5, fechaPrecio: '2026-01', procedencia: registro.nombre })
      const precio = await llamar('PUT', `precios/${tipo.id}`, { precio: 15, fechaPrecio: '2026-02', procedencia: registro.nombre })
      assert.equal(precio.precio, 15)
      assert.ok(precio.historial.length >= 1)
      comprobaciones++
      const servicio = await llamar('POST', 'servicios', { carId: registro.codigo, tipo: 'agua', periodicidad: 'mensual', datos: { proveedor: `${registro.nombre} proveedor` } }, 201)
      await llamar('POST', 'servicios', { carId: registro.codigo, tipo: 'agua', periodicidad: 'mensual', datos: { proveedor: `${registro.nombre} proveedor` } }, 409)
      await llamar('PUT', `servicios/${servicio.id}/periodos/2026/1`, { estado: 'pagado', pago: { fecha: '2026-01-15', importe: 20, sustento: registro.nombre } })
      await llamar('PUT', `servicios/${servicio.id}/periodos/2026/1`, { estado: 'pendiente', motivo: registro.nombre })
      await llamar('POST', `servicios/${servicio.id}/hechos`, { tipo: 'interrupcion', fecha: '2026-01-16', detalle: registro.nombre })
      const vehiculo = await llamar('POST', 'vehiculos', { carId: registro.codigo, datos: { tipo: 'camioneta', placa: `E2E${registro.nombre.slice(-8)}`, chofer: registro.nombre, combustible: 'gasolina', estadoOperativo: 'operativo' } }, 201)
      await llamar('POST', `vehiculos/${vehiculo.id}/anular`, motivo)
      await llamar('POST', `vehiculos/${vehiculo.id}/reactivar`)
      assert.ok(process.env.SIGREC_DEMO_CHOFER_PASSWORD, 'Falta SIGREC_DEMO_CHOFER_PASSWORD')
      const chofer = await request.newContext({ baseURL: base, timeout: 45000 })
      try {
        let token = (await (await chofer.get('/api/v1/auth/csrf')).json()).data
        let respuesta = await chofer.post('/api/v1/auth/login', { headers: { [token.header]: token.token }, data: { usuario: 'demo.chofer', password: process.env.SIGREC_DEMO_CHOFER_PASSWORD } })
        assert.equal(respuesta.status(), 200, 'Login de chofer')
        token = (await (await chofer.get('/api/v1/auth/csrf')).json()).data
        const enviar = async (metodo, ruta, datos, esperado = 200) => {
          const r = await chofer.fetch(`/api/v1/${ruta}`, { method: metodo, headers: { [token.header]: token.token }, data: datos })
          const contenido = await r.json().catch(() => ({}))
          assert.equal(r.status(), esperado, `${metodo} ${ruta}: ${contenido.message || 'respuesta inesperada'}`)
          comprobaciones++
          return contenido.data
        }
        const itinerario = await enviar('POST', 'itinerarios', { vehiculoId: 'AMA-V01', datos: { fecha: '2026-01-15', proposito: `${registro.nombre} recorrido`, destinos: [`${registro.nombre} destino`], previsto: { km: 12 } } }, 201)
        await enviar('POST', `itinerarios/${itinerario.id}/ejecucion`, { salida: '08:00', llegada: '09:00', km: 12 })
        const datos = { tipo: 'consumo', fecha: '2026-01-15', cantidad: 2, itinerarioId: itinerario.id, sustento: `${registro.nombre} consumo` }
        const consumo = await enviar('POST', 'combustible', { vehiculoId: 'AMA-V01', datos }, 201)
        await enviar('POST', 'combustible', { vehiculoId: 'AMA-V01', datos }, 409)
        await enviar('PUT', `combustible/${consumo.id}`, { datos: { ...datos, cantidad: 2.5 } })
        await enviar('POST', `combustible/${consumo.id}/anular`, motivo, 403)
        await enviar('POST', 'auth/logout')
      } finally {
        await chofer.dispose()
      }
      const almacenado = await llamar('GET', 'centros/jerarquia')
      assert.ok(almacenado.cars.some(c => c.id === registro.codigo && c.nombre === registro.nombre))
      comprobaciones++
      const ambienteCar = almacenado.ambientes.find(a => a.carId === 'AMA' && !a.anulacion && almacenado.modulos.some(m => m.id === a.moduloId && !m.anulacion))
      assert.ok(ambienteCar, 'No hay ambiente vigente en AMA')
      const porPerfil = async (usuario, clave, ejecutar) => {
        assert.ok(process.env[clave], `Falta ${clave}`)
        const sesion = await request.newContext({ baseURL: base, timeout: 45000 })
        let token
        try {
          token = (await (await sesion.get('/api/v1/auth/csrf')).json()).data
          const r = await sesion.post('/api/v1/auth/login', { headers: { [token.header]: token.token }, data: { usuario, password: process.env[clave] } })
          assert.equal(r.status(), 200, `Login de ${usuario}`)
          token = (await (await sesion.get('/api/v1/auth/csrf')).json()).data
          await ejecutar(async (metodo, ruta, datos, esperado = 200) => {
            const respuesta = await sesion.fetch(`/api/v1/${ruta}`, { method: metodo, headers: { [token.header]: token.token }, ...(datos === undefined ? {} : { data: datos }) })
            const resultado = await respuesta.json().catch(() => ({}))
            assert.equal(respuesta.status(), esperado, `${usuario}: ${metodo} ${ruta}: ${resultado.message || 'respuesta inesperada'}`)
            comprobaciones++
            return resultado.data
          })
        } finally {
          if (token) await sesion.post('/api/v1/auth/logout', { headers: { [token.header]: token.token } }).catch(() => {})
          await sesion.dispose()
        }
      }
      const bienCar = { id: `${registro.nombre}-CAR`, ambienteId: ambienteCar.id, tipoId: 'camarote', nombre: `${registro.nombre} bien CAR`, categoria: 'mobiliario', condicion: 'bueno', cantidad: 1 }
      await porPerfil('demo.car', 'SIGREC_DEMO_CAR_PASSWORD', async enviar => {
        await enviar('POST', 'bienes', { bien: bienCar }, 201)
        await enviar('POST', 'modulos', { carId: registro.codigo, nombre: registro.nombre, tipo: 'comun', pisos: 1, condicion: 'bueno' }, 404)
      })
      await porPerfil('demo.verifica', 'SIGREC_DEMO_VERIFICA_PASSWORD', async enviar => {
        await enviar('POST', `bienes/${bienCar.id}/verificacion`, { resultado: 'coincide', nota: registro.nombre, fecha: '2026-01-15' })
        await enviar('POST', `bienes/${bienCar.id}/anular`, motivo, 403)
      })
    } finally {
      await limpiar(registro)
      await limpiar(registro)
      fs.unlinkSync(diario)
    }
    console.log(`Escrituras aisladas: ${comprobaciones} comprobaciones aprobadas`)
  } finally {
    if (csrf) await llamar('POST', 'auth/logout').catch(() => {})
    await ctx.dispose()
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
