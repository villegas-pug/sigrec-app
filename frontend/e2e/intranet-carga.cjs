// SPEC 042: pruebas de navegación y carga con SRH y API simulados; nunca escribe en Oracle.
const { chromium } = require('playwright')
const assert = require('node:assert/strict')

const base = process.env.SIGREC_E2E_URL || 'http://10.101.0.36:9000/sigrec/'
const rutas = ['inicio', 'centros', 'incidencias', 'necesidades', 'necesidades/inventario', 'servicios', 'movilidad/vehiculos', 'movilidad/itinerarios', 'movilidad/combustible', 'manual']
const jerarquia = { cars: [], modulos: [], ambientes: [], elementos: [] }
const inventario = { bienes: [], eventos: [], inventarioPrevio: [] }
const vehiculos = []
const mantenimientos = []
// SPEC 044: Inicio recibe sus indicadores ya calculados; no descarga colecciones.
const resumenInicio = { filas: [], jerarquia: { centros: 0, modulos: 0, ambientes: 0 }, recorridos: { total: 0, noComparables: 0 }, avisos: { ahora: [], proximos: [] } }
const token = ['e30', Buffer.from(JSON.stringify({ idUsuario: 123, idSistema: '345', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'firma'].join('.')

async function main () {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()
  const errores = []
  const llamadas = []
  let liberarInicio
  const esperaInicio = new Promise(resolve => { liberarInicio = resolve })
  let fallarInicio = false
  let rutasPermitidas = rutas
  let crudSimulado = false
  let centroSimulado = null
  let vehiculoSimulado = null
  let rechazarEdicionVehiculo = false
  let servicioSimulado = null
  let rechazarEdicionServicio = false
  const cuerposServicio = []
  let combustibleSimulado = null
  let bienSimulado = null
  let incidenteSimulado = null
  let mantenimientoSimulado = null
  page.on('pageerror', error => errores.push(error.message))
  await context.route('**/SPermiso?*', async route => {
    const accion = new URL(route.request().url()).searchParams.get('action')
    const data = accion === 'login'
      ? { idUsuario: 123, idPerfil: 1, nombresApellidos: 'Usuario E2E' }
      : [{ descripcion: 'SIGREC', subitems: rutasPermitidas.map((enlace, orden) => ({ descripcion: enlace, enlace, orden, subitems: [] })) }]
    await route.fulfill({ json: data, headers: { 'access-control-allow-origin': '*' } })
  })
  await context.route('**/api/v1/**', async route => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/api/v1/', '')
    llamadas.push(`${request.method()} ${path}`)
    if (request.method() !== 'GET') {
      // Solo se admiten estas operaciones ficticias; ninguna solicitud alcanza el backend.
      if (!crudSimulado) throw new Error(`Escritura no permitida en la prueba: ${path}`)
      const body = request.postDataJSON()
      if (request.method() === 'POST' && path === 'centros' && !centroSimulado) {
        centroSimulado = { ...body, inmueble: { ...body.inmueble, fundacion: {}, seguridad: {},
          construccion: {}, actualizado: { fecha: '2026-01-01', por: 'E2E' } }, anulacion: null }
        return route.fulfill({ json: { data: { registro: centroSimulado, elementos: [] } } })
      }
      if (request.method() === 'PUT' && path === 'centros/XYZ' && centroSimulado) {
        centroSimulado = { ...centroSimulado, ...body }
        return route.fulfill({ json: { data: { registro: centroSimulado, elementos: [] } } })
      }
      if (request.method() === 'POST' && path === 'centros/XYZ/anular' && centroSimulado) {
        centroSimulado.anulacion = { fecha: '2026-01-01', por: 'E2E', motivo: body.motivo }
        return route.fulfill({ json: { data: centroSimulado } })
      }
      if (request.method() === 'POST' && path === 'centros/XYZ/reactivar' && centroSimulado) {
        centroSimulado.anulacion = null
        return route.fulfill({ json: { data: centroSimulado } })
      }
      if (request.method() === 'POST' && path === 'vehiculos' && !vehiculoSimulado) {
        vehiculoSimulado = { id: 'XYZ-V01', carId: body.carId, ...body.datos, anulacion: null }
        return route.fulfill({ json: { data: vehiculoSimulado } })
      }
      if (request.method() === 'PUT' && path === 'vehiculos/XYZ-V01' && vehiculoSimulado) {
        if (rechazarEdicionVehiculo) return route.fulfill({ status: 409, json: { message: 'Conflicto simulado' } })
        vehiculoSimulado = { ...vehiculoSimulado, ...body.datos }
        return route.fulfill({ json: { data: vehiculoSimulado } })
      }
      if (request.method() === 'POST' && path === 'vehiculos/XYZ-V01/anular' && vehiculoSimulado) {
        vehiculoSimulado.anulacion = { fecha: '2026-01-01', por: 'E2E', motivo: body.motivo }
        return route.fulfill({ json: { data: vehiculoSimulado } })
      }
      if (request.method() === 'POST' && path === 'vehiculos/XYZ-V01/reactivar' && vehiculoSimulado) {
        vehiculoSimulado.anulacion = null
        return route.fulfill({ json: { data: vehiculoSimulado } })
      }
      if (request.method() === 'POST' && path === 'servicios' && !servicioSimulado) {
        servicioSimulado = { id: 'XYZ-S01', carId: body.carId, tipo: body.tipo,
          periodicidad: body.periodicidad, ...body.datos, periodos: {}, hechos: [], anulacion: null }
        return route.fulfill({ json: { data: servicioSimulado } })
      }
      if (request.method() === 'PUT' && path === 'servicios/XYZ-S01' && servicioSimulado) {
        if (rechazarEdicionServicio) return route.fulfill({ status: 409, json: { message: 'Conflicto de servicio simulado' } })
        servicioSimulado = { ...servicioSimulado, ...body.datos, periodicidad: body.periodicidad ?? servicioSimulado.periodicidad }
        return route.fulfill({ json: { data: servicioSimulado } })
      }
      if (request.method() === 'POST' && path === 'servicios/XYZ-S01/anular' && servicioSimulado) {
        servicioSimulado.anulacion = { fecha: '2026-01-01', por: 'E2E', motivo: body.motivo }
        return route.fulfill({ json: { data: servicioSimulado } })
      }
      if (request.method() === 'POST' && path === 'servicios/XYZ-S01/reactivar' && servicioSimulado) {
        servicioSimulado.anulacion = null
        return route.fulfill({ json: { data: servicioSimulado } })
      }
      const periodo = path.match(/^servicios\/XYZ-S01\/periodos\/(\d{4})\/1$/)
      if (request.method() === 'PUT' && periodo && servicioSimulado && body.estado === 'pagado') {
        cuerposServicio.push({ path, body })
        servicioSimulado.periodos[periodo[1]] = { pagados: [1], pendientes: [], pagos: { 1: body.pago } }
        return route.fulfill({ json: { data: servicioSimulado } })
      }
      if (request.method() === 'POST' && path === 'servicios/XYZ-S01/hechos' && servicioSimulado
        && ['interrupcion', 'restablecimiento'].includes(body.tipo)) {
        cuerposServicio.push({ path, body })
        servicioSimulado.hechos.push({ id: `H${servicioSimulado.hechos.length + 1}`, ...body, autor: 'E2E', anulacion: null })
        return route.fulfill({ json: { data: servicioSimulado } })
      }
      if (request.method() === 'POST' && path === 'combustible' && !combustibleSimulado) {
        combustibleSimulado = { id: 'XYZ-C01', vehiculoId: body.vehiculoId, ...body.datos, informadoPor: 'E2E', anulacion: null }
        return route.fulfill({ json: { data: combustibleSimulado } })
      }
      if (request.method() === 'PUT' && path === 'combustible/XYZ-C01' && combustibleSimulado) {
        combustibleSimulado = { ...combustibleSimulado, ...body.datos }
        return route.fulfill({ json: { data: combustibleSimulado } })
      }
      if (request.method() === 'POST' && path === 'combustible/XYZ-C01/anular' && combustibleSimulado) {
        combustibleSimulado.anulacion = { fecha: '2026-01-01', por: 'E2E', motivo: body.motivo }
        return route.fulfill({ json: { data: combustibleSimulado } })
      }
      if (request.method() === 'POST' && path === 'combustible/XYZ-C01/reactivar' && combustibleSimulado) {
        combustibleSimulado.anulacion = null
        return route.fulfill({ json: { data: combustibleSimulado } })
      }
      if (request.method() === 'POST' && path === 'bienes' && !bienSimulado) {
        bienSimulado = { ...body.bien, anulacion: null }
        inventario.bienes.push(bienSimulado)
        return route.fulfill({ json: { data: bienSimulado } })
      }
      if (request.method() === 'PUT' && path === 'bienes/XYZ-B01' && bienSimulado) {
        bienSimulado = { ...bienSimulado, ...body.bien }
        Object.assign(inventario.bienes.find(b => b.id === 'XYZ-B01'), bienSimulado)
        return route.fulfill({ json: { data: bienSimulado } })
      }
      if (request.method() === 'POST' && path === 'bienes/XYZ-B01/anular' && bienSimulado) {
        bienSimulado.anulacion = { fecha: '2026-01-01', por: 'E2E', motivo: body.motivo }
        Object.assign(inventario.bienes.find(b => b.id === 'XYZ-B01'), bienSimulado)
        return route.fulfill({ json: { data: null } })
      }
      if (request.method() === 'POST' && path === 'bienes/XYZ-B01/reactivar' && bienSimulado) {
        bienSimulado.anulacion = null
        Object.assign(inventario.bienes.find(b => b.id === 'XYZ-B01'), bienSimulado)
        return route.fulfill({ json: { data: null } })
      }
      if (request.method() === 'POST' && path === 'incidencias' && !incidenteSimulado) {
        incidenteSimulado = {
          id: 'XYZ-I01', ...body.datos,
          carId: body.datos.origen?.tipo === 'centro' ? body.datos.origen.id : 'XYZ',
          ambienteId: body.datos.origen?.tipo === 'ambiente' ? body.datos.origen.id : null,
          bienIds: body.datos.bienIds ?? [], informadoPor: 'E2E', anulacion: null
        }
        inventario.eventos.push(incidenteSimulado)
        return route.fulfill({ json: { data: incidenteSimulado } })
      }
      if (request.method() === 'PUT' && path === 'incidencias/XYZ-I01' && incidenteSimulado) {
        incidenteSimulado = { ...incidenteSimulado, ...body.datos }
        Object.assign(inventario.eventos.find(e => e.id === 'XYZ-I01'), incidenteSimulado)
        return route.fulfill({ json: { data: incidenteSimulado } })
      }
      if (request.method() === 'POST' && path === 'incidencias/XYZ-I01/anular' && incidenteSimulado) {
        incidenteSimulado.anulacion = { fecha: '2026-01-01', por: 'E2E', motivo: body.motivo }
        Object.assign(inventario.eventos.find(e => e.id === 'XYZ-I01'), incidenteSimulado)
        return route.fulfill({ json: { data: null } })
      }
      if (request.method() === 'POST' && path === 'incidencias/XYZ-I01/reactivar' && incidenteSimulado) {
        incidenteSimulado.anulacion = null
        Object.assign(inventario.eventos.find(e => e.id === 'XYZ-I01'), incidenteSimulado)
        return route.fulfill({ json: { data: null } })
      }
      if (request.method() === 'POST' && path === 'mantenimientos' && !mantenimientoSimulado) {
        mantenimientoSimulado = {
          id: 'XYZ-M01', carId: body.carId, tipo: body.tipo,
          fecha: body.datos.fecha, proxima: body.datos.proxima, detalle: body.datos.detalle,
          importe: body.datos.importe, informadoPor: 'E2E', anulacion: null
        }
        mantenimientos.push(mantenimientoSimulado)
        return route.fulfill({ json: { data: { registros: [mantenimientoSimulado], vehiculo: null } } })
      }
      if (request.method() === 'PUT' && path === 'mantenimientos/XYZ-M01' && mantenimientoSimulado) {
        Object.assign(mantenimientoSimulado, body.datos)
        return route.fulfill({ json: { data: mantenimientoSimulado } })
      }
      if (request.method() === 'POST' && path === 'mantenimientos/XYZ-M01/anular' && mantenimientoSimulado) {
        mantenimientoSimulado.anulacion = { fecha: '2026-01-01', por: 'E2E', motivo: body.motivo }
        return route.fulfill({ json: { data: mantenimientoSimulado } })
      }
      if (request.method() === 'POST' && path === 'mantenimientos/XYZ-M01/reactivar' && mantenimientoSimulado) {
        mantenimientoSimulado.anulacion = null
        return route.fulfill({ json: { data: mantenimientoSimulado } })
      }
      throw new Error(`Escritura simulada inesperada: ${request.method()} ${path}`)
    }
    if (path === 'inicio/resumen') {
      await esperaInicio
      if (fallarInicio) return route.fulfill({ status: 503, json: { message: 'Error simulado' } })
      return route.fulfill({ json: { data: resumenInicio } })
    }
    if (path === 'inicio/datos') throw new Error('Inicio ya no debe pedir las colecciones completas (SPEC 044).')
    const data = path === 'centros/jerarquia' ? jerarquia : path === 'bienes/datos' ? inventario
      : path === 'vehiculos' ? vehiculos : path === 'mantenimientos' ? mantenimientos
        : path === 'catalogos' ? [{ dominio: 'TIPO_SERVICIO', codigo: 'agua', nombre: 'Agua' }] : []
    await route.fulfill({ json: { data } })
  })
  try {
    await page.goto(`${base}#/inicio?p=${token}`)
    await page.getByText('Cargando indicadores y situación de los centros…').waitFor()
    assert.equal(await page.getByText('Sin avisos para los filtros seleccionados.').count(), 0)
    assert.equal(await page.getByText('SIGREC', { exact: true }).count() > 0, true)
    assert.equal(new URL(page.url()).hash.includes('p='), false)
    assert.equal(await page.locator('.sg-kpi-panel .q-skeleton').count(), 8)
    liberarInicio()
    await page.getByText('Situación por centro', { exact: true }).waitFor()
    await page.getByText('0 módulos · 0 ambientes registrados', { exact: true }).waitFor()
    assert.equal(llamadas.filter(x => x === 'GET inicio/resumen').length, 1)
    assert.equal(llamadas.includes('GET inicio/datos'), false)
    assert.deepEqual(errores, [])

    await page.getByRole('button', { name: 'Buscar (Ctrl + K)' }).click()
    await page.getByPlaceholder(/Rótulo, bien/).waitFor()
    await page.keyboard.press('Escape')
    for (const ruta of rutas) {
      await page.goto(`${base}#/${ruta}`)
      await page.locator('.sg-page').first().waitFor({ timeout: 30000 })
      assert.equal(await page.getByText('Ingrese desde la intranet').count(), 0, ruta)
      assert.equal(await page.getByText('Este módulo no está disponible', { exact: false }).count(), 0, ruta)
    }
    assert.deepEqual(errores, [])

    // Validación del alta de centro y protección de cambios sin guardar; no se envía ninguna escritura.
    await page.goto(`${base}#/centros`)
    await page.getByRole('button', { name: 'Registrar centro' }).first().click()
    const formulario = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Registrar centro' }) })
    await formulario.getByRole('button', { name: 'Registrar centro' }).click()
    await formulario.getByText('Campo obligatorio').first().waitFor()
    assert.ok(await formulario.getByText('Campo obligatorio').count() >= 1)
    await formulario.getByLabel('Nombre del centro *').fill('Centro aislado')
    await formulario.getByLabel('Código *').fill('12')
    await formulario.getByLabel('Dirección *').fill('Dirección de prueba')
    await formulario.getByRole('button', { name: 'Registrar centro' }).click()
    await formulario.getByText('Use 3 letras').waitFor()
    await formulario.getByRole('button', { name: 'Cancelar' }).click()
    await page.getByText('Cambios sin guardar').waitFor()
    await page.getByRole('button', { name: 'Seguir editando' }).click()
    assert.equal(await formulario.isVisible(), true)
    await formulario.getByRole('button', { name: 'Cancelar' }).click()
    await page.getByRole('button', { name: 'Descartar' }).click()
    await formulario.waitFor({ state: 'hidden' })
    assert.equal(llamadas.some(x => !x.startsWith('GET ')), false)
    assert.deepEqual(errores, [])

    // Un fallo no debe producir cifras falsas y debe permitir reintentar.
    await page.evaluate(() => localStorage.clear())
    await page.goto('about:blank')
    fallarInicio = true
    await page.goto(`${base}#/inicio?p=${token}`)
    await page.getByRole('alert').getByText(/No se pudieron cargar los datos de Inicio/).waitFor()
    assert.equal(await page.getByText('Situación por centro', { exact: true }).count(), 0)
    fallarInicio = false
    await page.getByRole('button', { name: 'Reintentar' }).click()
    await page.getByText('Situación por centro', { exact: true }).waitFor()

    // Desde otra ruta Inicio solo pide su resumen: no vuelve a pedir lo ya cargado ni las colecciones completas.
    await page.evaluate(() => localStorage.clear())
    await page.goto('about:blank')
    llamadas.length = 0
    await page.goto(`${base}#/servicios?p=${token}`)
    await page.getByRole('heading', { name: /Servicios básicos y pagos/ }).waitFor()
    assert.ok(llamadas.includes('GET servicios'), `Solicitudes registradas: ${llamadas.join(', ')}`)
    await page.evaluate(() => { window.location.hash = '#/inicio' })
    await page.getByText('Situación por centro', { exact: true }).waitFor()
    assert.equal(llamadas.includes('GET inicio/datos'), false)
    assert.equal(llamadas.filter(x => x === 'GET inicio/resumen').length, 1)
    assert.equal(llamadas.filter(x => x === 'GET servicios').length, 1)

    // Formulario de vehículo con un centro ficticio, sin permitir escrituras.
    await page.evaluate(() => localStorage.clear())
    await page.goto('about:blank')
    jerarquia.cars.push({ id: 'ABC', nombre: 'Centro de prueba', inmueble: {}, anulacion: null })
    await page.goto(`${base}#/movilidad/vehiculos?p=${token}`)
    await page.getByRole('button', { name: 'Registrar vehículo' }).first().click()
    const vehiculo = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Registrar vehículo' }) })
    await vehiculo.getByRole('button', { name: 'Registrar vehículo' }).click()
    await vehiculo.getByText('Campo obligatorio').first().waitFor()
    await vehiculo.getByLabel('Tipo *').fill('Camioneta')
    await vehiculo.getByLabel('Placa *').fill('ABC-123')
    await vehiculo.getByRole('button', { name: 'Registrar vehículo' }).click()
    await vehiculo.getByLabel('Combustible *').locator('xpath=ancestor::label[contains(@class,"q-field")]')
      .getByText('Campo obligatorio').waitFor()
    await vehiculo.getByRole('button', { name: 'Cancelar' }).click()
    await page.getByRole('button', { name: 'Descartar' }).click()
    await vehiculo.waitFor({ state: 'hidden' })
    await page.goto(`${base}#/servicios`)
    await page.getByRole('button', { name: 'Registrar servicio' }).first().click()
    const servicio = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Registrar servicio' }) })
    await servicio.getByRole('button', { name: 'Registrar servicio' }).click()
    await servicio.getByLabel('Proveedor *').locator('xpath=ancestor::label[contains(@class,"q-field")]')
      .getByText('Campo obligatorio').waitFor()
    await servicio.getByLabel('Proveedor *').fill('Proveedor de prueba')
    await servicio.getByLabel('Teléfono del proveedor').fill('abc')
    await servicio.getByRole('button', { name: 'Registrar servicio' }).click()
    await servicio.getByText('Use solo dígitos, espacios y + - ( )').waitFor()
    await servicio.getByRole('button', { name: 'Cancelar' }).click()
    await page.getByRole('button', { name: 'Descartar' }).click()
    await servicio.waitFor({ state: 'hidden' })
    assert.equal(llamadas.some(x => !x.startsWith('GET ')), false)

    // La planificación requiere propósito y destinos y rechaza horarios invertidos.
    vehiculos.push({ id: 'ABC-V01', carId: 'ABC', placa: 'ABC-123', tipo: 'Camioneta', estadoOperativo: 'operativo', anulacion: null })
    await page.evaluate(() => localStorage.clear())
    await page.goto('about:blank')
    await page.goto(`${base}#/movilidad/itinerarios?vehiculo=ABC-V01&p=${token}`)
    await page.getByRole('button', { name: 'Registrar itinerario' }).first().click()
    const itinerario = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Registrar itinerario' }) })
    await itinerario.getByRole('button', { name: 'Guardar' }).click()
    await itinerario.getByLabel('Propósito *').locator('xpath=ancestor::label[contains(@class,"q-field")]')
      .getByText('Campo obligatorio').waitFor()
    await itinerario.getByLabel('Propósito *').fill('Traslado de prueba')
    await itinerario.getByRole('button', { name: 'Guardar' }).click()
    await itinerario.getByLabel('Destinos, separados por comas *').locator('xpath=ancestor::label[contains(@class,"q-field")]')
      .getByText('Campo obligatorio').waitFor()
    await itinerario.getByLabel('Destinos, separados por comas *').fill('Centro, destino')
    await itinerario.getByLabel('Salida', { exact: true }).fill('12:00')
    await itinerario.getByLabel('Llegada', { exact: true }).fill('10:00')
    await itinerario.getByRole('button', { name: 'Guardar' }).click()
    await itinerario.getByText('La llegada no puede ser anterior a la salida').waitFor()
    await itinerario.getByRole('button', { name: 'Cancelar' }).click()
    await page.getByRole('button', { name: 'Descartar' }).click()
    await itinerario.waitFor({ state: 'hidden' })
    assert.equal(llamadas.some(x => !x.startsWith('GET ')), false)
    vehiculos.length = 0
    jerarquia.cars.length = 0

    // Alta desde la interfaz y ciclo posterior mediante acciones reales contra API en memoria.
    await page.evaluate(() => localStorage.clear())
    await page.goto('about:blank')
    crudSimulado = true
    await page.goto(`${base}#/centros?p=${token}`)
    await page.getByRole('button', { name: 'Registrar centro' }).first().click()
    const alta = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Registrar centro' }) })
    await alta.getByLabel('Nombre del centro *').fill('Centro CRUD aislado')
    await alta.getByLabel('Código *').fill('XYZ')
    await alta.getByLabel('Dirección *').fill('Dirección aislada')
    await alta.getByRole('button', { name: 'Registrar centro' }).click()
    await alta.waitFor({ state: 'hidden' })
    await page.getByText('Centro CRUD aislado', { exact: true }).first().waitFor()
    const ciclo = await page.evaluate(async () => {
      const { db, carPorId } = await import('/sigrec/src/services/datos.js')
      const { actualizarCentro, anular, reactivar } = await import('/sigrec/src/services/acciones.js')
      const centro = carPorId('XYZ')
      await actualizarCentro(centro, { nombre: 'Centro actualizado', inmueble: centro.inmueble })
      const actualizado = carPorId('XYZ').nombre
      await anular(centro, { motivo: 'Prueba aislada' })
      const anulado = carPorId('XYZ').anulacion?.motivo
      await reactivar(centro)
      return { actualizado, anulado, reactivado: carPorId('XYZ').anulacion === null, cantidad: db.cars.filter(c => c.id === 'XYZ').length }
    })
    assert.deepEqual(ciclo, { actualizado: 'Centro actualizado', anulado: 'Prueba aislada', reactivado: true, cantidad: 1 })
    assert.deepEqual(llamadas.filter(x => !x.startsWith('GET ')), [
      'POST centros', 'PUT centros/XYZ', 'POST centros/XYZ/anular', 'POST centros/XYZ/reactivar'
    ])

    // Mantenimiento desde la ficha del centro: validaciones y ciclo CRUD con estado persistido solo en memoria.
    await page.goto(`${base}#/centros?car=XYZ&tab=seguridad`)
    await page.getByRole('button', { name: 'Registrar fumigación' }).waitFor()
    await page.getByRole('button', { name: 'Registrar fumigación' }).click()
    const formularioMantenimiento = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Registrar mantenimiento' }) })
    const fechaMantenimiento = formularioMantenimiento.getByLabel('Fecha realizada *')
    await fechaMantenimiento.fill('')
    await formularioMantenimiento.getByRole('button', { name: 'Registrar' }).click()
    await fechaMantenimiento.locator('xpath=ancestor::label[contains(@class,"q-field")]').getByText('Campo obligatorio').waitFor()
    await fechaMantenimiento.fill('2099-01-01')
    await formularioMantenimiento.getByRole('button', { name: 'Registrar' }).click()
    await formularioMantenimiento.getByText('No puede ser posterior a hoy').waitFor()
    await fechaMantenimiento.fill('2020-01-10')
    await formularioMantenimiento.getByLabel('Próxima fecha').fill('2020-01-09')
    await formularioMantenimiento.getByLabel('Importe (S/)').fill('-1')
    await formularioMantenimiento.getByRole('button', { name: 'Registrar' }).click()
    await formularioMantenimiento.getByText('No puede ser anterior a la fecha realizada').waitFor()
    await formularioMantenimiento.getByText('Indique un valor mayor que cero').waitFor()
    await formularioMantenimiento.getByRole('button', { name: 'Cancelar' }).click()
    await page.getByRole('button', { name: 'Descartar' }).click()
    await formularioMantenimiento.waitFor({ state: 'hidden' })
    assert.equal(mantenimientos.length, 0)

    await page.getByRole('button', { name: 'Registrar fumigación' }).click()
    const altaMantenimiento = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Registrar mantenimiento' }) })
    await altaMantenimiento.getByLabel('Fecha realizada *').fill('2020-01-10')
    await altaMantenimiento.getByLabel('Próxima fecha').fill('2020-07-10')
    await altaMantenimiento.getByLabel('Detalle').fill('Fumigación CRUD aislada')
    await altaMantenimiento.getByLabel('Importe (S/)').fill('45.5')
    await altaMantenimiento.getByRole('button', { name: 'Registrar' }).click()
    await altaMantenimiento.waitFor({ state: 'hidden' })
    assert.equal(mantenimientoSimulado.id, 'XYZ-M01')
    assert.equal(mantenimientoSimulado.detalle, 'Fumigación CRUD aislada')

    const menuMantenimiento = page.getByRole('button', { name: /Acciones del mantenimiento del/ })
    await menuMantenimiento.click()
    await page.getByText('Actualizar mantenimiento', { exact: true }).click()
    const edicionMantenimiento = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Actualizar mantenimiento' }) })
    await edicionMantenimiento.getByLabel('Detalle').fill('Fumigación actualizada')
    await edicionMantenimiento.getByLabel('Importe (S/)').fill('50')
    await edicionMantenimiento.getByRole('button', { name: 'Guardar cambios' }).click()
    await edicionMantenimiento.waitFor({ state: 'hidden' })
    assert.equal(mantenimientoSimulado.detalle, 'Fumigación actualizada')

    await menuMantenimiento.click()
    await page.getByText('Anular mantenimiento', { exact: true }).click()
    const anularMantenimiento = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Anular mantenimiento' }) })
    await anularMantenimiento.getByLabel('Motivo *').fill('Anulación aislada de mantenimiento')
    await anularMantenimiento.getByRole('button', { name: 'Anular', exact: true }).click()
    await anularMantenimiento.waitFor({ state: 'hidden' })
    assert.equal(mantenimientoSimulado.anulacion.motivo, 'Anulación aislada de mantenimiento')
    await page.getByText('Mostrar inactivos', { exact: true }).click()
    await menuMantenimiento.click()
    await page.getByText('Reactivar mantenimiento', { exact: true }).click()
    await page.getByRole('button', { name: 'Reactivar', exact: true }).click()
    await page.getByText('Mantenimiento reactivado.', { exact: true }).waitFor()
    assert.equal(mantenimientoSimulado.anulacion, null)
    assert.deepEqual(llamadas.filter(x => /^(POST|PUT) mantenimientos/.test(x)), [
      'POST mantenimientos', 'PUT mantenimientos/XYZ-M01',
      'POST mantenimientos/XYZ-M01/anular', 'POST mantenimientos/XYZ-M01/reactivar'
    ])

    // Alta desde el formulario de movilidad; el resto usa las acciones reales contra memoria.
    await page.goto(`${base}#/movilidad/vehiculos`)
    await page.getByRole('button', { name: 'Registrar vehículo' }).first().click()
    const altaVehiculo = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Registrar vehículo' }) })
    await altaVehiculo.getByLabel('Tipo *').fill('Camioneta')
    await altaVehiculo.getByLabel('Placa *').fill('xyz-123')
    await altaVehiculo.getByLabel('Combustible *').fill('Diésel')
    await altaVehiculo.getByRole('button', { name: 'Registrar vehículo' }).click()
    await altaVehiculo.waitFor({ state: 'hidden' })
    await page.getByText('XYZ-123', { exact: false }).first().waitFor()
    assert.equal(vehiculoSimulado.carId, 'XYZ')
    assert.equal(vehiculoSimulado.placa, 'XYZ-123')
    rechazarEdicionVehiculo = true
    const fallo = await page.evaluate(async () => {
      const { vehiculoPorId } = await import('/sigrec/src/services/datos.js')
      const { actualizarVehiculo } = await import('/sigrec/src/services/acciones.js')
      const vehiculo = vehiculoPorId('XYZ-V01')
      try {
        await actualizarVehiculo(vehiculo, { tipo: 'No debe guardarse' })
        return null
      } catch (error) {
        return { mensaje: error.message, tipo: vehiculoPorId('XYZ-V01').tipo }
      }
    })
    assert.deepEqual(fallo, { mensaje: 'Conflicto simulado', tipo: 'Camioneta' })
    rechazarEdicionVehiculo = false
    const cicloVehiculo = await page.evaluate(async () => {
      const { db, vehiculoPorId } = await import('/sigrec/src/services/datos.js')
      const { actualizarVehiculo, anular, reactivar } = await import('/sigrec/src/services/acciones.js')
      const vehiculo = vehiculoPorId('XYZ-V01')
      await actualizarVehiculo(vehiculo, { tipo: 'Minivan' })
      const actualizado = vehiculoPorId('XYZ-V01').tipo
      await anular(vehiculo, { motivo: 'Prueba de movilidad' })
      const anulado = vehiculoPorId('XYZ-V01').anulacion?.motivo
      await reactivar(vehiculo)
      return { actualizado, anulado, reactivado: vehiculoPorId('XYZ-V01').anulacion === null,
        cantidad: db.vehiculos.filter(v => v.id === 'XYZ-V01').length }
    })
    assert.deepEqual(cicloVehiculo, { actualizado: 'Minivan', anulado: 'Prueba de movilidad', reactivado: true, cantidad: 1 })
    assert.deepEqual(llamadas.filter(x => /^(POST|PUT) vehiculos/.test(x)), [
      'POST vehiculos', 'PUT vehiculos/XYZ-V01', 'PUT vehiculos/XYZ-V01',
      'POST vehiculos/XYZ-V01/anular', 'POST vehiculos/XYZ-V01/reactivar'
    ])

    // Registro de servicio desde la interfaz y transición del registro en la colección reactiva.
    await page.goto(`${base}#/servicios`)
    await page.getByRole('button', { name: 'Registrar servicio' }).first().click()
    const altaServicio = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Registrar servicio' }) })
    await altaServicio.getByLabel('Proveedor *').fill('Proveedor aislado')
    await altaServicio.getByRole('button', { name: 'Registrar servicio' }).click()
    await altaServicio.waitFor({ state: 'hidden' })
    await page.getByText('Proveedor aislado', { exact: true }).first().waitFor()
    assert.equal(servicioSimulado.carId, 'XYZ')
    assert.equal(servicioSimulado.tipo, 'agua')
    rechazarEdicionServicio = true
    const falloServicio = await page.evaluate(async () => {
      const { servicioPorId } = await import('/sigrec/src/services/datos.js')
      const { actualizarServicio } = await import('/sigrec/src/services/acciones.js')
      const servicio = servicioPorId('XYZ-S01')
      try {
        await actualizarServicio(servicio, { proveedor: 'No guardado', periodicidad: 'mensual' })
        return null
      } catch (error) {
        return { mensaje: error.message, proveedor: servicioPorId('XYZ-S01').proveedor }
      }
    })
    assert.deepEqual(falloServicio, { mensaje: 'Conflicto de servicio simulado', proveedor: 'Proveedor aislado' })
    rechazarEdicionServicio = false
    const cicloServicio = await page.evaluate(async () => {
      const { db, servicioPorId } = await import('/sigrec/src/services/datos.js')
      const { actualizarServicio, anular, reactivar } = await import('/sigrec/src/services/acciones.js')
      const servicio = servicioPorId('XYZ-S01')
      await actualizarServicio(servicio, { proveedor: 'Proveedor actualizado', periodicidad: 'mensual' })
      const actualizado = servicioPorId('XYZ-S01').proveedor
      await anular(servicio, { motivo: 'Prueba de servicio' })
      const anulado = servicioPorId('XYZ-S01').anulacion?.motivo
      await reactivar(servicio)
      return { actualizado, anulado, reactivado: servicioPorId('XYZ-S01').anulacion === null,
        cantidad: db.servicios.filter(s => s.id === 'XYZ-S01').length }
    })
    assert.deepEqual(cicloServicio, { actualizado: 'Proveedor actualizado', anulado: 'Prueba de servicio', reactivado: true, cantidad: 1 })
    await page.getByText('Proveedor actualizado', { exact: true }).first().waitFor()
    assert.deepEqual(llamadas.filter(x => /^(POST|PUT) servicios/.test(x)), [
      'POST servicios', 'PUT servicios/XYZ-S01', 'PUT servicios/XYZ-S01',
      'POST servicios/XYZ-S01/anular', 'POST servicios/XYZ-S01/reactivar'
    ])

    // Un pago se informa en la celda, con validaciones y detalle consultable.
    const celdaEnero = page.getByRole('button', { name: /^Agua, Ene:/ })
    await celdaEnero.click()
    const periodo = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Informar situación del período' }) })
    await periodo.getByText('Pagado', { exact: true }).click()
    await periodo.getByRole('button', { name: 'Guardar' }).click()
    await periodo.getByLabel('Fecha de pago').locator('xpath=ancestor::label[contains(@class,"q-field")]')
      .getByText('Campo obligatorio').waitFor()
    assert.equal(cuerposServicio.length, 0)
    await periodo.getByLabel('Fecha de pago').fill('2020-01-01')
    await periodo.getByLabel('Importe (S/) *').fill('125.50')
    await periodo.getByLabel('Sustento *').fill('Recibo aislado')
    await periodo.getByRole('button', { name: 'Guardar' }).click()
    await periodo.waitFor({ state: 'hidden' })
    await page.getByRole('button', { name: 'Agua, Ene: Pagado' }).waitFor()
    await page.getByRole('button', { name: 'Agua, Ene: Pagado' }).click()
    const consultaPeriodo = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Detalle del período' }) })
    await consultaPeriodo.getByText('Recibo aislado', { exact: false }).waitFor()
    await consultaPeriodo.getByText('01/01/2020', { exact: false }).waitFor()
    await consultaPeriodo.getByText('S/ 125,5', { exact: false }).waitFor()
    await consultaPeriodo.getByRole('button', { name: 'Cerrar' }).click()
    assert.equal(cuerposServicio[0].body.pago.importe, 125.5)
    assert.equal(cuerposServicio[0].body.pago.sustento, 'Recibo aislado')

    // La interrupción abre un aviso y el restablecimiento posterior lo cierra.
    for (const [tipo, fecha, detalle] of [
      ['interrupción', '2020-01-01', 'Corte aislado'],
      ['restablecimiento', '2020-01-02', 'Servicio repuesto']
    ]) {
      await page.getByRole('button', { name: `Informar ${tipo}` }).click()
      const hecho = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: `Informar ${tipo}` }) })
      await hecho.getByLabel('Fecha *').fill(fecha)
      await hecho.getByLabel('Detalle').fill(detalle)
      await hecho.getByRole('button', { name: 'Registrar', exact: true }).click()
      await hecho.waitFor({ state: 'hidden' })
      await page.getByText(detalle, { exact: false }).first().waitFor()
      await page.getByText(tipo === 'interrupción' ? 'Interrumpido · restablecimiento no informado' : 'Sin interrupción abierta', { exact: true }).waitFor()
    }
    assert.deepEqual(cuerposServicio.slice(1).map(({ body }) => body.tipo), ['interrupcion', 'restablecimiento'])
    assert.equal(cuerposServicio.length, 3)

    // Combustible: validación, alta y edición en pantalla; baja y reactivación en memoria.
    await page.goto(`${base}#/movilidad/combustible?vehiculo=XYZ-V01`)
    await page.getByRole('button', { name: 'Informar combustible' }).click()
    const altaCombustible = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Informar combustible' }) })
    await altaCombustible.getByText('No hay recorridos realizados sin consumo declarado', { exact: false }).waitFor()
    await altaCombustible.getByRole('button', { name: 'Registrar', exact: true }).click()
    await altaCombustible.getByLabel('Cantidad *').locator('xpath=ancestor::label[contains(@class,"q-field")]')
      .getByText(/mayor que cero/i).waitFor()
    assert.equal(combustibleSimulado, null)
    await altaCombustible.getByLabel('Cantidad *').fill('12.5')
    await altaCombustible.getByLabel('Sustento (vale, declaración…)').fill('Vale aislado')
    await altaCombustible.getByRole('button', { name: 'Registrar', exact: true }).click()
    await altaCombustible.waitFor({ state: 'hidden' })
    await page.getByText('Vale aislado', { exact: true }).waitFor()
    assert.equal(combustibleSimulado.vehiculoId, 'XYZ-V01')
    assert.equal(combustibleSimulado.tipo, 'carga')
    assert.equal(combustibleSimulado.cantidad, 12.5)
    await page.getByRole('button', { name: 'Acciones del registro XYZ-C01' }).click()
    await page.getByText('Actualizar registro', { exact: true }).click()
    const edicionCombustible = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Actualizar registro de combustible' }) })
    await edicionCombustible.getByLabel('Cantidad *').fill('15')
    await edicionCombustible.getByRole('button', { name: 'Guardar cambios' }).click()
    await edicionCombustible.waitFor({ state: 'hidden' })
    assert.equal(combustibleSimulado.cantidad, 15)
    const cicloCombustible = await page.evaluate(async () => {
      const { db } = await import('/sigrec/src/services/datos.js')
      const { anularCombustible, reactivarCombustible } = await import('/sigrec/src/services/acciones.js')
      const registro = db.combustible.find(r => r.id === 'XYZ-C01')
      await anularCombustible(registro, { motivo: 'Corrección aislada' })
      const motivo = registro.anulacion?.motivo
      await reactivarCombustible(registro)
      return { motivo, reactivado: registro.anulacion === null, cantidad: db.combustible.filter(r => r.id === 'XYZ-C01').length }
    })
    assert.deepEqual(cicloCombustible, { motivo: 'Corrección aislada', reactivado: true, cantidad: 1 })
    assert.deepEqual(llamadas.filter(x => /^(POST|PUT) combustible/.test(x)), [
      'POST combustible', 'PUT combustible/XYZ-C01', 'POST combustible/XYZ-C01/anular', 'POST combustible/XYZ-C01/reactivar'
    ])
    crudSimulado = false

    // Inventario e incidencias: fixtures exclusivamente en el almacén del navegador.
    // Una baja del principal no retira el componente; una baja anulada tampoco retira el bien.
    const indicadores = await page.evaluate(async () => {
      const { db } = await import('/sigrec/src/services/datos.js')
      const { resumenInventario, totalizarInventario } = await import('/sigrec/src/services/inventario.js')
      const { resumenPorCentro, totalizarSituacion } = await import('/sigrec/src/services/situacion.js')
      db.modulos.push({ id: 'XYZ-M01', carId: 'XYZ', nombre: 'Módulo aislado', tipo: 'casa' })
      db.ambientes.push({ id: 'XYZ-A01', carId: 'XYZ', moduloId: 'XYZ-M01', nombre: 'Ambiente aislado' })
      db.tiposBien.push({ id: 'tipo-aislado', nombre: 'Equipo aislado', categoria: 'equipo', precio: 10 })
      const bien = (id, cantidad, condicion, extra = {}) => ({
        id, ambienteId: 'XYZ-A01', tipoId: 'tipo-aislado', nombre: id,
        categoria: 'equipo', cantidad, condicion, adquisicion: {}, ...extra
      })
      db.bienes.push(
        bien('principal-baja', 9, 'malo'),
        bien('componente-activo', 3, 'malo', { asociadoA: { bienId: 'principal-baja' } }),
        bien('baja-anulada', 1, 'bueno'),
        bien('bien-anulado', 7, 'malo', { anulacion: { motivo: 'Prueba' } })
      )
      const hecho = (id, tipo, bienId, extra = {}) => ({
        id, tipo, fecha: '2020-01-01', titulo: id, informadoPor: 'E2E',
        carId: 'XYZ', ambienteId: 'XYZ-A01', bienIds: [bienId], ...extra
      })
      db.eventos.push(
        hecho('baja-vigente', 'baja', 'principal-baja'),
        hecho('baja-inactiva', 'baja', 'baja-anulada', { anulacion: { fecha: '2020-01-02', por: 'E2E', motivo: 'Prueba' } }),
        hecho('incidente-visible', 'dano', 'componente-activo', {
          origen: { tipo: 'ambiente', id: 'XYZ-A01' },
          evaluaciones: { 'componente-activo': { requiereReposicion: false } }
        }),
        hecho('incidente-anulado', 'dano', 'baja-anulada', {
          origen: { tipo: 'ambiente', id: 'XYZ-A01' },
          anulacion: { fecha: '2020-01-02', por: 'E2E', motivo: 'Prueba' }
        })
      )
      const opciones = { anio: 2030, fechaCorte: '2026-01-01', anioServicios: 2026 }
      const inventario = totalizarInventario(resumenInventario({ carIds: ['XYZ'], anio: opciones.anio }))
      const inicio = totalizarSituacion(resumenPorCentro([db.cars.find(c => c.id === 'XYZ')], opciones))
      return {
        inventario: { unidades: inventario.cantidad, malos: inventario.porCondicion.malo + inventario.porCondicion.inservible },
        inicio: { unidades: inicio.bienesActivos, malos: inicio.bienesMalos, registros: inicio.registrosActivos },
        fixtures: {
          bienes: JSON.parse(JSON.stringify(db.bienes)),
          eventos: JSON.parse(JSON.stringify(db.eventos))
        }
      }
    })
    assert.deepEqual({ inventario: indicadores.inventario, inicio: indicadores.inicio }, {
      inventario: { unidades: 4, malos: 3 },
      inicio: { unidades: 4, malos: 3, registros: 2 }
    })
    await page.goto(`${base}#/necesidades/inventario`)
    await page.locator('.sg-kpi').filter({ hasText: 'Unidades activas' }).getByText('4', { exact: true }).waitFor()
    await page.locator('.sg-kpi').filter({ hasText: 'En mal estado' }).getByText('3', { exact: true }).waitFor()
    await page.getByRole('tab', { name: 'Bienes en mal estado' }).click()
    await page.getByText('componente-activo', { exact: false }).first().waitFor()
    assert.equal(await page.getByText('bien-anulado', { exact: false }).count(), 0)
    assert.equal(await page.getByText('principal-baja', { exact: false }).count() > 0, true) // nombre del principal en la ficha del componente

    await page.goto(`${base}#/incidencias`)
    const listaHechos = page.getByLabel('Hechos registrados')
    await listaHechos.getByRole('button', { name: 'incidente-visible' }).waitFor()
    assert.equal(await listaHechos.getByRole('button', { name: 'incidente-anulado' }).count(), 0)
    await page.getByLabel('Recurso (bien, rótulo o ambiente)').fill('sin coincidencias aisladas')
    await page.getByText('Sin hechos para los filtros seleccionados.').waitFor()
    await page.getByRole('button', { name: 'Limpiar filtros' }).click()
    await listaHechos.getByRole('button', { name: 'incidente-visible' }).waitFor()

    await page.goto(`${base}#/centros?car=XYZ`)
    await page.getByRole('button', { name: 'Registrar incidente' }).click()
    const incidente = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Registrar incidente' }) })
    await incidente.getByRole('button', { name: 'Registrar incidente' }).click()
    await incidente.getByLabel('Motivo *').locator('xpath=ancestor::label[contains(@class,"q-field")]')
      .getByText(/obligatorio/i).waitFor()
    await incidente.getByLabel('Motivo *').fill('Incidente aislado')
    await incidente.getByLabel('Fecha del hecho *').fill('2099-01-01')
    await incidente.getByRole('button', { name: 'Registrar incidente' }).click()
    await incidente.getByLabel('Fecha del hecho *').locator('xpath=ancestor::label[contains(@class,"q-field")]')
      .getByText(/No puede ser posterior a hoy/).waitFor()
    await incidente.getByRole('button', { name: 'Cancelar' }).click()
    await page.getByRole('button', { name: 'Descartar' }).click()
    await incidente.waitFor({ state: 'hidden' })

    // CRUD de bienes e incidencias contra la API interceptada; la carga posterior conserva el mismo estado en memoria.
    inventario.bienes.splice(0, inventario.bienes.length, ...indicadores.fixtures.bienes)
    inventario.eventos.splice(0, inventario.eventos.length, ...indicadores.fixtures.eventos)
    crudSimulado = true
    await page.goto(`${base}#/centros?registrar=1&ambiente=XYZ-A01`)
    const registroBien = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: /Registrar bien en Ambiente aislado/ }) })
    await registroBien.getByRole('button', { name: 'Guardar', exact: true }).click()
    await registroBien.getByText('Campo obligatorio').first().waitFor()
    await registroBien.getByLabel('Tipo de bien *').click()
    await page.getByRole('option', { name: 'Equipo aislado' }).click()
    await registroBien.getByLabel('Rótulo SIGREC *').fill('XYZ-B01')
    await registroBien.getByLabel('Nombre *').fill('Bien CRUD aislado')
    await registroBien.getByRole('radio', { name: 'Bueno' }).click()
    await registroBien.getByRole('button', { name: 'Guardar', exact: true }).click()
    await registroBien.waitFor({ state: 'hidden' })
    assert.equal(bienSimulado.id, 'XYZ-B01')
    await page.getByRole('button', { name: 'Actualizar información' }).click()
    const edicionBien = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Actualizar información' }) })
    await edicionBien.getByLabel('Nombre *').fill('Bien actualizado')
    await edicionBien.getByRole('button', { name: 'Guardar', exact: true }).click()
    await edicionBien.waitFor({ state: 'hidden' })
    assert.equal(bienSimulado.nombre, 'Bien actualizado')

    await page.getByRole('button', { name: 'Más acciones de Bien actualizado' }).click()
    await page.getByText('Anular registro', { exact: true }).click()
    const anularBienDialog = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Anular registro del bien' }) })
    await anularBienDialog.getByLabel('Motivo *').fill('Anulación aislada de bien')
    await anularBienDialog.getByRole('button', { name: 'Anular', exact: true }).click()
    await anularBienDialog.waitFor({ state: 'hidden' })
    assert.equal(bienSimulado.anulacion.motivo, 'Anulación aislada de bien')
    await page.getByRole('button', { name: 'Más acciones de Bien actualizado' }).click()
    await page.getByText('Reactivar registro', { exact: true }).click()
    await page.getByRole('button', { name: 'Reactivar', exact: true }).click()
    await page.getByText('Bien reactivado.', { exact: true }).waitFor()
    assert.equal(bienSimulado.anulacion, null)

    await page.goto(`${base}#/centros?car=XYZ`)
    await page.getByRole('button', { name: 'Registrar incidente' }).click()
    const altaIncidente = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Registrar incidente' }) })
    await altaIncidente.getByLabel('Fecha del hecho *').fill('2020-01-03')
    await altaIncidente.getByLabel('Motivo *').fill('Incidente CRUD aislado')
    await altaIncidente.getByLabel('Detalle').fill('Detalle inicial')
    await altaIncidente.getByRole('button', { name: 'Registrar incidente' }).click()
    await altaIncidente.waitFor({ state: 'hidden' })
    assert.equal(incidenteSimulado.titulo, 'Incidente CRUD aislado')

    await page.getByRole('button', { name: 'Acciones del hecho Incidente CRUD aislado' }).click()
    await page.getByText('Actualizar incidente', { exact: true }).click()
    const edicionIncidente = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Actualizar incidente' }) })
    await edicionIncidente.getByLabel('Motivo *').fill('Incidente actualizado')
    await edicionIncidente.getByLabel('Detalle').fill('Detalle actualizado')
    await edicionIncidente.getByRole('button', { name: 'Guardar cambios' }).click()
    await edicionIncidente.waitFor({ state: 'hidden' })
    assert.equal(incidenteSimulado.titulo, 'Incidente actualizado')

    await page.getByRole('button', { name: 'Acciones del hecho Incidente actualizado' }).click()
    await page.getByText('Anular incidente', { exact: true }).click()
    const anularIncidenteDialog = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Anular incidente' }) })
    await anularIncidenteDialog.getByLabel('Motivo *').fill('Anulación aislada de incidente')
    await anularIncidenteDialog.getByRole('button', { name: 'Anular', exact: true }).click()
    await anularIncidenteDialog.waitFor({ state: 'hidden' })
    assert.equal(incidenteSimulado.anulacion.motivo, 'Anulación aislada de incidente')

    await page.getByRole('button', { name: 'Acciones del hecho Incidente actualizado' }).click()
    await page.getByText('Reactivar incidente', { exact: true }).click()
    await page.getByRole('button', { name: 'Reactivar', exact: true }).click()
    await page.getByText('Incidente reactivado.', { exact: true }).waitFor()

    const ciclosInventario = await page.evaluate(async () => {
      const { db, bienPorId } = await import('/sigrec/src/services/datos.js')
      return {
        nombreBien: bienPorId('XYZ-B01').nombre,
        bienReactivado: bienPorId('XYZ-B01').anulacion === null,
        cantidadBienes: db.bienes.filter(b => b.id === 'XYZ-B01').length,
        tituloIncidente: db.eventos.find(e => e.id === 'XYZ-I01').titulo,
        incidenteReactivado: db.eventos.find(e => e.id === 'XYZ-I01').anulacion === null,
        cantidadIncidentes: db.eventos.filter(e => e.id === 'XYZ-I01').length
      }
    })
    assert.deepEqual(ciclosInventario, {
      nombreBien: 'Bien actualizado', bienReactivado: true, cantidadBienes: 1,
      tituloIncidente: 'Incidente actualizado', incidenteReactivado: true, cantidadIncidentes: 1
    })
    assert.deepEqual(llamadas.filter(x => /^(POST|PUT) (bienes|incidencias)/.test(x)), [
      'POST bienes', 'PUT bienes/XYZ-B01',
      'POST bienes/XYZ-B01/anular', 'POST bienes/XYZ-B01/reactivar',
      'POST incidencias', 'PUT incidencias/XYZ-I01',
      'POST incidencias/XYZ-I01/anular', 'POST incidencias/XYZ-I01/reactivar'
    ])
    assert.equal(bienSimulado.anulacion, null)
    assert.equal(incidenteSimulado.anulacion, null)
    crudSimulado = false

    // Una ruta ajena al menú no debe iniciar la carga de sus datos.
    await page.evaluate(() => localStorage.clear())
    await page.goto('about:blank')
    rutasPermitidas = ['servicios']
    llamadas.length = 0
    await page.goto(`${base}#/centros?p=${token}`)
    await page.getByText('Este módulo no está disponible', { exact: false }).waitFor()
    assert.equal(llamadas.some(x => x.startsWith('GET ')), false)
    assert.deepEqual(errores, [])
    console.log(`E2E simulado: ${rutas.length} rutas, ciclos CRUD aislados, servicios, mantenimiento, combustible, inventario e incidencias aprobados`)
  } finally {
    liberarInicio()
    await context.close()
    await browser.close()
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
