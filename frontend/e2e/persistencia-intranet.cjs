// SPEC 039/042: alta y edición desde Vue contra API real; verificación Oracle tras reiniciar backend.
const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { crearItinerarioIntegrado } = require('./persistencia-itinerarios.cjs')

const base = process.env.SIGREC_E2E_URL || 'http://10.101.0.36:9000/sigrec/'
const diario = path.join(process.env.LOCALAPPDATA || os.tmpdir(), 'Temp', 'opencode', 'sigrec-persistencia-intranet-pendiente.json')
const identidad = 'e2e.persistencia.sigrec'
const nombreUsuario = 'Usuario E2E de persistencia SIGREC'
const motivoLimpieza = 'E2E de persistencia SIGREC: limpieza lógica'
const fasesProceso = [
  'reservado', 'creado', 'editado',
  'vehiculo-reservado', 'vehiculo-creado', 'vehiculo-editado',
  'combustible-reservado', 'combustible-creado', 'combustible-editando', 'combustible-editado',
  'combustible-anulando', 'combustible-reactivado',
  'itinerario-reservado', 'itinerario-creado', 'itinerario-editando', 'itinerario-editado',
  'itinerario-ejecutando', 'itinerario-ejecutado', 'consumo-reservado', 'consumo-creado',
  'consumo-editando', 'consumo-editado', 'consumo-anulando', 'consumo-anulado',
  'itinerario-anulando', 'itinerario-anulado', 'itinerario-reactivado', 'consumo-reactivado',
  'servicio-reservado', 'servicio-creado', 'servicio-editado',
  'mantenimiento-reservado', 'mantenimiento-creado', 'mantenimiento-editado',
  'mantenimiento-anulando', 'mantenimiento-reactivado',
  'modulo-reservado', 'modulo-creado', 'modulo-editando', 'modulo-editado',
  'ambiente-reservado', 'ambiente-creado', 'ambiente-editando', 'ambiente-editado',
  'bien-reservado', 'bien-creado', 'bien-editando', 'bien-editado', 'bien-anulando', 'bien-reactivado',
  'incidencia-reservada', 'incidencia-creada', 'incidencia-editando', 'incidencia-editada',
  'incidencia-anulando', 'incidencia-reactivada'
]

function alcanzoFase (faseActual, faseObjetivo) {
  return fasesProceso.indexOf(faseActual) >= fasesProceso.indexOf(faseObjetivo)
}

function tokenIntranet () {
  const payload = Buffer.from(JSON.stringify({
    idUsuario: identidad,
    idSistema: '345',
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64url')
  return `e30.${payload}.firma-simulada`
}

async function iniciarSesion (page) {
  await page.route('**/SPermiso?*', async route => {
    const accion = new URL(route.request().url()).searchParams.get('action')
    const data = accion === 'login'
      ? {
          idUsuario: identidad,
          idPerfil: 1,
          nombresApellidos: nombreUsuario,
          unidadOrganica: 'Pruebas E2E'
        }
      : [{
          descripcion: 'SIGREC',
          subitems: [
            { descripcion: 'Inicio', enlace: 'inicio', orden: 1, subitems: [] },
            { descripcion: 'Centros', enlace: 'centros', orden: 2, subitems: [] },
            { descripcion: 'Vehículos', enlace: 'movilidad/vehiculos', orden: 3, subitems: [] },
            { descripcion: 'Servicios', enlace: 'servicios', orden: 4, subitems: [] },
            { descripcion: 'Combustible', enlace: 'movilidad/combustible', orden: 5, subitems: [] },
            { descripcion: 'Itinerarios', enlace: 'movilidad/itinerarios', orden: 6, subitems: [] }
          ]
        }]
    await route.fulfill({ json: data, headers: { 'access-control-allow-origin': '*' } })
  })

  await page.goto(`${base}#/centros?p=${encodeURIComponent(tokenIntranet())}`)
  await page.getByRole('button', { name: 'Registrar centro' }).waitFor({ timeout: 60000 })
}

async function api (page, method, route, body) {
  return page.evaluate(async ({ method, route, body }) => {
    const dato = nombre => String(localStorage.getItem(`sgr-${nombre}`) || '').replace(/^__q_\w+\|/, '')
    const headers = { Accept: 'application/json' }
    const idUsuario = dato('idUsuario')
    if (idUsuario) {
      headers['X-Usuario-Id'] = idUsuario
      headers['X-Usuario-Nombre'] = encodeURIComponent(dato('nombreCompleto'))
    }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    const response = await fetch(`/api/v1/${route}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    })
    return {
      status: response.status,
      json: await response.json().catch(() => null)
    }
  }, { method, route, body })
}

function guardarDiario (datos) {
  fs.mkdirSync(path.dirname(diario), { recursive: true })
  fs.writeFileSync(diario, JSON.stringify(datos, null, 2), { flag: 'w' })
}

function guardarFase (fase, recurso, cambios = {}) {
  const actual = JSON.parse(fs.readFileSync(diario, 'utf8'))
  guardarDiario({
    ...actual,
    fase,
    ...(recurso ? { [recurso]: { ...actual[recurso], ...cambios } } : {})
  })
}

async function crear (page) {
  assert.ok(!fs.existsSync(diario), `Hay una prueba pendiente registrada en ${diario}; recuperar antes de continuar`)
  // La baja lógica no libera una unidad: usar únicamente una reservada para esta ejecución.
  const unidadId = Number(process.env.SIGREC_E2E_UNIDAD_ID)
  const unidadNombre = process.env.SIGREC_E2E_UNIDAD_NOMBRE?.trim()
  assert.ok(Number.isSafeInteger(unidadId) && unidadId > 0 && unidadNombre?.length >= 3,
    'Configure SIGREC_E2E_UNIDAD_ID y SIGREC_E2E_UNIDAD_NOMBRE con una unidad reservada para pruebas')
  const unidades = await api(page, 'GET', `centros/unidades-organicas?q=${encodeURIComponent(unidadNombre)}`)
  assert.equal(unidades.status, 200)
  const coincidencias = unidades.json.data.items.filter(u => u.nombre === unidadNombre)
  assert.equal(coincidencias.length, 1, 'El nombre de la unidad de prueba debe identificar una fila en la primera página')
  assert.equal(coincidencias[0].id, unidadId)
  assert.equal(coincidencias[0].ocupada, false, 'La unidad reservada ya está vinculada')
  const preexistente = await api(page, 'GET', `usuarios/${identidad}`)
  if (preexistente.status === 200) {
    assert.equal(preexistente.json?.data?.proveedor, 'INTRANET', 'La identidad fija ya existe con otro proveedor')
    assert.equal(preexistente.json?.data?.sujeto, identidad, 'La identidad fija no coincide con el usuario E2E')
    assert.equal(preexistente.json?.data?.activo, true, 'La identidad E2E existente está desactivada')
  } else {
    assert.equal(preexistente.status, 404, 'No se pudo comprobar la identidad E2E antes de escribir')
  }

  const respuesta = await api(page, 'GET', 'centros/jerarquia')
  assert.equal(respuesta.status, 200, 'No se pudo consultar la jerarquía para reservar un código único')
  const ocupados = new Set((respuesta.json?.data?.cars || []).map(centro => centro.id))
  let codigo
  for (let a = 65; a <= 90 && !codigo; a++) {
    for (let b = 65; b <= 90 && !codigo; b++) {
      for (let c = 65; c <= 90 && !codigo; c++) {
        const candidato = String.fromCharCode(a, b, c)
        if (candidato.startsWith('E') && !ocupados.has(candidato)) codigo = candidato
      }
    }
  }
  assert.ok(codigo, 'No hay código libre para el centro E2E')

  const sufijo = crypto.randomUUID().slice(0, 8)
  const tiposRespuesta = await api(page, 'GET', 'catalogos/tipos-bien')
  assert.equal(tiposRespuesta.status, 200, 'No se pudo consultar el catálogo de tipos de bien')
  const tipoBien = tiposRespuesta.json?.data?.find(item => !item.anulacion)
  assert.ok(tipoBien, 'No hay un tipo de bien vigente para el recorrido E2E')
  const registro = {
    version: 1,
    identidad,
    codigo,
    unidadId,
    nombre: `E2E persistencia ${sufijo}`,
    nombreEditado: `E2E persistencia editado ${sufijo}`,
    modulo: {
      nombre: `Módulo E2E ${sufijo}`,
      nombreEditado: `Módulo E2E editado ${sufijo}`
    },
    ambiente: {
      nombre: `Ambiente E2E ${sufijo}`,
      nombreEditado: `Ambiente E2E editado ${sufijo}`
    },
    bien: {
      id: `E2E${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`,
      nombre: `Bien E2E ${sufijo}`,
      nombreEditado: `Bien E2E editado ${sufijo}`,
      tipoId: tipoBien.id,
      tipoNombre: tipoBien.nombre
    },
    incidencia: {
      titulo: `Incidente E2E ${sufijo}`,
      tituloEditado: `Incidente E2E editado ${sufijo}`,
      detalle: `Detalle de incidente E2E ${sufijo}`,
      detalleEditado: `Detalle editado E2E ${sufijo}`
    },
    combustible: {
      fecha: '2020-01-10',
      cantidad: 10.5,
      cantidadEditada: 12.5,
      sustento: `Carga E2E ${sufijo}`,
      sustentoEditado: `Carga E2E editada ${sufijo}`
    },
    itinerario: {
      fecha: '2020-01-10',
      proposito: `Recorrido E2E ${sufijo}`,
      propositoEditado: `Recorrido E2E editado ${sufijo}`,
      destino: `Destino E2E ${sufijo}`,
      salidaPrevista: '08:00',
      llegadaPrevista: '09:00',
      kmPrevistos: 25,
      salidaReal: '08:10',
      llegadaReal: '09:15',
      kmRealizados: 30.5
    },
    consumo: {
      fecha: '2020-01-10',
      cantidad: 4.2,
      cantidadEditada: 4.8,
      sustento: `Consumo E2E ${sufijo}`,
      sustentoEditado: `Consumo E2E editado ${sufijo}`
    },
    fase: 'reservado',
    creado: new Date().toISOString()
  }
  fs.writeFileSync(diario, JSON.stringify(registro, null, 2), { flag: 'wx' })

  await page.getByRole('button', { name: 'Registrar centro' }).click()
  const dialogo = page.locator('.q-dialog:visible').last()
  await dialogo.getByLabel('Nombre del centro *').fill(registro.nombre)
  await dialogo.getByLabel('Código *').fill(registro.codigo)
  await dialogo.getByLabel('Dirección *').fill(`${registro.nombre} dirección`)
  await dialogo.getByRole('button', { name: 'Buscar unidad orgánica' }).click()
  const selector = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Buscar unidad orgánica' }) })
  await selector.getByLabel('Nombre de la unidad orgánica').fill(unidadNombre)
  await selector.getByRole('row').filter({ has: page.getByText(unidadNombre, { exact: true }) })
    .getByRole('button', { name: 'Seleccionar' }).click()
  await dialogo.getByRole('button', { name: 'Registrar centro' }).click()
  await dialogo.waitFor({ state: 'hidden', timeout: 30000 })

  const trasAlta = await api(page, 'GET', 'centros/jerarquia')
  assert.equal(trasAlta.status, 200)
  assert.ok(
    trasAlta.json?.data?.cars?.some(centro => centro.id === registro.codigo && centro.nombre === registro.nombre &&
      centro.unidadOrganica?.id === unidadId),
    'El alta del formulario no aparece en la respuesta persistida'
  )

  guardarDiario({ ...registro, fase: 'creado' })
  await page.reload()
  await page.getByRole('button', { name: 'Registrar centro' }).waitFor({ timeout: 60000 })
  const trasRecarga = await api(page, 'GET', 'centros/jerarquia')
  assert.ok(
    trasRecarga.json?.data?.cars?.some(centro => centro.id === registro.codigo && centro.nombre === registro.nombre),
    'El centro no persistió tras recargar la SPA'
  )

  await page.getByRole('button', { name: `Acciones de ${registro.nombre}` }).click()
  await page.getByText('Actualizar ficha', { exact: true }).click()
  const edicion = page.locator('.q-dialog:visible').last()
  await edicion.getByLabel('Nombre del centro *').fill(registro.nombreEditado)
  await edicion.getByRole('button', { name: 'Guardar cambios' }).click()
  await edicion.waitFor({ state: 'hidden', timeout: 30000 })
  guardarDiario({ ...registro, fase: 'editado' })

  const trasEdicion = await api(page, 'GET', 'centros/jerarquia')
  assert.ok(
    trasEdicion.json?.data?.cars?.some(centro => centro.id === registro.codigo && centro.nombre === registro.nombreEditado),
    'La edición desde Vue no quedó persistida en Oracle'
  )

  const placa = `E2E${crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`
  const vehiculo = {
    placa,
    carId: registro.codigo,
    tipo: `Unidad E2E ${sufijo}`,
    tipoEditado: `Unidad E2E editada ${sufijo}`
  }
  guardarDiario({ ...registro, fase: 'vehiculo-reservado', vehiculo })
  await page.goto(`${base}#/movilidad/vehiculos`)
  await page.getByRole('button', { name: 'Registrar vehículo' }).waitFor({ timeout: 60000 })
  await page.getByRole('button', { name: 'Registrar vehículo' }).click()
  const altaVehiculo = page.locator('.q-dialog:visible').last()
  await altaVehiculo.getByRole('button', { name: 'Registrar vehículo' }).click()
  await altaVehiculo.getByText('Campo obligatorio').first().waitFor({ timeout: 10000 })
  await altaVehiculo.getByLabel('Centro *').click()
  await page.getByRole('option', { name: registro.nombreEditado }).click()
  await altaVehiculo.getByLabel('Tipo *').fill(vehiculo.tipo)
  await altaVehiculo.getByLabel('Placa *').fill(placa)
  await altaVehiculo.getByLabel('Combustible *').fill('Gasohol E2E')
  await altaVehiculo.getByRole('button', { name: 'Registrar vehículo' }).click()
  await altaVehiculo.waitFor({ state: 'hidden', timeout: 30000 })

  const trasAltaVehiculo = await api(page, 'GET', 'vehiculos')
  assert.equal(trasAltaVehiculo.status, 200, 'No se pudo leer la colección de vehículos')
  const guardado = trasAltaVehiculo.json?.data?.find(item => item.placa === placa)
  assert.ok(guardado, 'El vehículo registrado desde la interfaz no aparece en la API')
  assert.equal(guardado.carId, registro.codigo)
  guardarDiario({ ...registro, fase: 'vehiculo-creado', vehiculo: { ...vehiculo, id: guardado.id } })

  await page.getByRole('button', { name: `Acciones del vehículo ${guardado.id}` }).click()
  await page.getByText('Actualizar vehículo', { exact: true }).click()
  const edicionVehiculo = page.locator('.q-dialog:visible').last()
  await edicionVehiculo.getByLabel('Tipo *').fill(vehiculo.tipoEditado)
  await edicionVehiculo.getByRole('button', { name: 'Guardar cambios' }).click()
  await edicionVehiculo.waitFor({ state: 'hidden', timeout: 30000 })

  const trasEdicionVehiculo = await api(page, 'GET', 'vehiculos')
  const vehiculoEditado = trasEdicionVehiculo.json?.data?.find(item => item.id === guardado.id)
  assert.equal(vehiculoEditado?.tipo, vehiculo.tipoEditado, 'La edición del vehículo no quedó persistida en Oracle')
  guardarDiario({ ...registro, fase: 'vehiculo-editado', vehiculo: { ...vehiculo, id: guardado.id } })

  const combustible = { ...registro.combustible, vehiculoId: guardado.id }
  guardarDiario({
    ...registro,
    fase: 'combustible-reservado',
    vehiculo: { ...vehiculo, id: guardado.id },
    combustible
  })
  await page.goto(`${base}#/movilidad/combustible?vehiculo=${encodeURIComponent(guardado.id)}`)
  await page.getByRole('button', { name: 'Informar combustible' }).waitFor({ timeout: 60000 })
  await page.getByRole('button', { name: 'Informar combustible' }).click()
  const altaCombustible = page.locator('.q-dialog:visible').filter({ has: page.getByRole('heading', { name: 'Informar combustible' }) })
  const fechaCombustible = altaCombustible.getByLabel('Fecha *')
  await fechaCombustible.fill('')
  await altaCombustible.getByRole('button', { name: 'Registrar', exact: true }).click()
  await fechaCombustible.locator('xpath=ancestor::label[contains(@class,"q-field")]').getByText('Campo obligatorio').waitFor()
  await fechaCombustible.fill(`${new Date().getFullYear() + 1}-01-01`)
  await altaCombustible.getByLabel('Cantidad *').fill('-1')
  await altaCombustible.getByRole('button', { name: 'Registrar', exact: true }).click()
  await altaCombustible.getByText('No puede ser posterior a hoy', { exact: false }).waitFor()
  await altaCombustible.getByText('Indique un valor mayor que cero', { exact: true }).waitFor()
  await fechaCombustible.fill(combustible.fecha)
  await altaCombustible.getByLabel('Cantidad *').fill(String(combustible.cantidad))
  await altaCombustible.getByLabel('Sustento (vale, declaración…)').fill(combustible.sustento)
  await altaCombustible.getByRole('button', { name: 'Registrar', exact: true }).click()
  await altaCombustible.waitFor({ state: 'hidden', timeout: 30000 })

  const trasAltaCombustible = await api(page, 'GET', 'combustible')
  assert.equal(trasAltaCombustible.status, 200, 'No se pudo leer la colección de combustible')
  const combustibleGuardado = trasAltaCombustible.json?.data?.find(item =>
    item.vehiculoId === guardado.id && item.sustento === combustible.sustento
  )
  assert.ok(combustibleGuardado, 'La carga registrada desde la interfaz no aparece en la API')
  assert.equal(combustibleGuardado.tipo, 'carga')
  assert.equal(Number(combustibleGuardado.cantidad), combustible.cantidad)
  guardarDiario({
    ...registro,
    fase: 'combustible-creado',
    vehiculo: { ...vehiculo, id: guardado.id },
    combustible: { ...combustible, id: combustibleGuardado.id }
  })

  await page.getByRole('button', { name: `Acciones del registro ${combustibleGuardado.id}` }).click()
  await page.getByText('Actualizar registro', { exact: true }).click()
  const edicionCombustible = page.locator('.q-dialog:visible').filter({ has: page.getByRole('heading', { name: 'Actualizar registro de combustible' }) })
  await edicionCombustible.getByLabel('Cantidad *').fill(String(combustible.cantidadEditada))
  await edicionCombustible.getByLabel('Sustento (vale, declaración…)').fill(combustible.sustentoEditado)
  guardarDiario({
    ...registro,
    fase: 'combustible-editando',
    vehiculo: { ...vehiculo, id: guardado.id },
    combustible: { ...combustible, id: combustibleGuardado.id }
  })
  await edicionCombustible.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  await edicionCombustible.waitFor({ state: 'hidden', timeout: 30000 })

  const trasEdicionCombustible = await api(page, 'GET', 'combustible')
  const combustibleEditado = trasEdicionCombustible.json?.data?.find(item => item.id === combustibleGuardado.id)
  assert.equal(combustibleEditado?.sustento, combustible.sustentoEditado, 'La edición de combustible no quedó persistida en Oracle')
  assert.equal(Number(combustibleEditado?.cantidad), combustible.cantidadEditada)
  guardarDiario({
    ...registro,
    fase: 'combustible-editado',
    vehiculo: { ...vehiculo, id: guardado.id },
    combustible: { ...combustible, id: combustibleGuardado.id }
  })

  await page.getByRole('button', { name: `Acciones del registro ${combustibleGuardado.id}` }).click()
  await page.getByText('Anular registro', { exact: true }).click()
  const anulacionCombustible = page.locator('.q-dialog:visible').filter({ has: page.getByRole('heading', { name: 'Anular registro de combustible' }) })
  await anulacionCombustible.getByRole('button', { name: 'Anular', exact: true }).click()
  await anulacionCombustible.getByLabel('Motivo *')
    .locator('xpath=ancestor::label[contains(@class,"q-field")]')
    .getByText('Campo obligatorio').waitFor()
  await anulacionCombustible.getByLabel('Motivo *').fill(motivoLimpieza)
  guardarDiario({
    ...registro,
    fase: 'combustible-anulando',
    vehiculo: { ...vehiculo, id: guardado.id },
    combustible: { ...combustible, id: combustibleGuardado.id }
  })
  await anulacionCombustible.getByRole('button', { name: 'Anular', exact: true }).click()
  await anulacionCombustible.waitFor({ state: 'hidden', timeout: 30000 })
  const trasAnularCombustible = await api(page, 'GET', 'combustible')
  assert.ok(
    trasAnularCombustible.json?.data?.find(item => item.id === combustibleGuardado.id)?.anulacion,
    'La anulación UI de combustible no quedó persistida en Oracle'
  )

  await page.getByText('Mostrar inactivos', { exact: true }).click()
  await page.getByRole('button', { name: `Acciones del registro ${combustibleGuardado.id}` }).click()
  await page.getByText('Reactivar registro', { exact: true }).click()
  await page.getByRole('button', { name: 'Reactivar', exact: true }).click()
  await page.getByText('Registro de combustible reactivado.', { exact: true }).waitFor()
  const trasReactivarCombustible = await api(page, 'GET', 'combustible')
  assert.equal(
    trasReactivarCombustible.json?.data?.find(item => item.id === combustibleGuardado.id)?.anulacion ?? null,
    null,
    'La reactivación UI de combustible no quedó persistida en Oracle'
  )
  guardarDiario({
    ...registro,
    fase: 'combustible-reactivado',
    vehiculo: { ...vehiculo, id: guardado.id },
    combustible: { ...combustible, id: combustibleGuardado.id }
  })

  await crearItinerarioIntegrado(page, base, api, guardarFase, registro, guardado)

  const servicio = {
    carId: registro.codigo,
    tipo: 'agua',
    proveedor: `Proveedor E2E ${sufijo}`,
    proveedorEditado: `Proveedor E2E editado ${sufijo}`
  }
  const datosRecuperacion = {
    ...registro,
    vehiculo: { ...vehiculo, id: guardado.id },
    combustible: { ...combustible, id: combustibleGuardado.id },
    servicio
  }
  guardarDiario({ ...datosRecuperacion, fase: 'servicio-reservado' })
  await page.goto(`${base}#/servicios?car=${encodeURIComponent(registro.codigo)}`)
  await page.getByRole('button', { name: 'Registrar servicio' }).first().waitFor({ timeout: 60000 })
  await page.getByRole('button', { name: 'Registrar servicio' }).first().click()
  const altaServicio = page.locator('.q-dialog:visible').last()
  await altaServicio.getByLabel('Servicio *').click()
  await page.getByRole('option', { name: 'Agua', exact: true }).click()
  await altaServicio.getByRole('button', { name: 'Registrar servicio' }).click()
  await altaServicio.getByLabel('Proveedor *').locator('xpath=ancestor::label[contains(@class,"q-field")]')
    .getByText('Campo obligatorio').waitFor({ timeout: 10000 })
  await altaServicio.getByLabel('Proveedor *').fill(servicio.proveedor)
  await altaServicio.getByLabel('Teléfono del proveedor').fill('inválido')
  await altaServicio.getByRole('button', { name: 'Registrar servicio' }).click()
  await altaServicio.getByText('Use solo dígitos, espacios y + - ( )').waitFor({ timeout: 10000 })
  await altaServicio.getByLabel('Teléfono del proveedor').fill('+51 999 888 777')
  await altaServicio.getByRole('button', { name: 'Registrar servicio' }).click()
  await altaServicio.waitFor({ state: 'hidden', timeout: 30000 })

  const trasAltaServicio = await api(page, 'GET', 'servicios')
  assert.equal(trasAltaServicio.status, 200, 'No se pudo leer la colección de servicios')
  const servicioGuardado = trasAltaServicio.json?.data?.find(item => item.carId === servicio.carId && item.tipo === servicio.tipo)
  assert.ok(servicioGuardado, 'El servicio registrado desde la interfaz no aparece en la API')
  assert.equal(servicioGuardado.proveedor, servicio.proveedor)
  guardarDiario({ ...datosRecuperacion, fase: 'servicio-creado', servicio: { ...servicio, id: servicioGuardado.id } })

  await page.getByRole('button', { name: 'Actualizar ficha' }).click()
  const edicionServicio = page.locator('.q-dialog:visible').last()
  await edicionServicio.getByLabel('Proveedor *').fill(servicio.proveedorEditado)
  await edicionServicio.getByRole('button', { name: 'Guardar cambios' }).click()
  await edicionServicio.waitFor({ state: 'hidden', timeout: 30000 })

  const trasEdicionServicio = await api(page, 'GET', 'servicios')
  const servicioEditado = trasEdicionServicio.json?.data?.find(item => item.id === servicioGuardado.id)
  assert.equal(servicioEditado?.proveedor, servicio.proveedorEditado, 'La edición del servicio no quedó persistida en Oracle')
  guardarDiario({ ...datosRecuperacion, fase: 'servicio-editado', servicio: { ...servicio, id: servicioGuardado.id } })

  const mantenimiento = {
    carId: registro.codigo,
    tipo: 'fumigacion',
    fecha: '2020-01-10',
    proxima: '2020-07-10',
    detalle: `Fumigación E2E ${sufijo}`,
    detalleEditado: `Fumigación E2E editada ${sufijo}`,
    importe: 45.5,
    importeEditado: 50
  }
  const datosConMantenimiento = { ...datosRecuperacion, mantenimiento }
  await page.goto(`${base}#/centros?car=${encodeURIComponent(registro.codigo)}&tab=seguridad`)
  await page.getByRole('button', { name: 'Registrar fumigación' }).waitFor({ timeout: 60000 })
  await page.getByRole('button', { name: 'Registrar fumigación' }).click()
  const altaMantenimiento = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Registrar mantenimiento' }) })
  const fechaMantenimiento = altaMantenimiento.getByLabel('Fecha realizada *')
  await fechaMantenimiento.fill('')
  await altaMantenimiento.getByRole('button', { name: 'Registrar' }).click()
  await fechaMantenimiento.locator('xpath=ancestor::label[contains(@class,"q-field")]').getByText('Campo obligatorio').waitFor()
  await fechaMantenimiento.fill(`${new Date().getFullYear() + 1}-01-01`)
  await altaMantenimiento.getByRole('button', { name: 'Registrar' }).click()
  await altaMantenimiento.getByText('No puede ser posterior a hoy').waitFor()
  await fechaMantenimiento.fill(mantenimiento.fecha)
  await altaMantenimiento.getByLabel('Próxima fecha').fill('2020-01-09')
  await altaMantenimiento.getByLabel('Importe (S/)').fill('-1')
  await altaMantenimiento.getByRole('button', { name: 'Registrar' }).click()
  await altaMantenimiento.getByText('No puede ser anterior a la fecha realizada').waitFor()
  await altaMantenimiento.getByText('Indique un valor mayor que cero').waitFor()
  await altaMantenimiento.getByLabel('Próxima fecha').fill(mantenimiento.proxima)
  await altaMantenimiento.getByLabel('Importe (S/)').fill(String(mantenimiento.importe))
  await altaMantenimiento.getByLabel('Detalle').fill(mantenimiento.detalle)
  guardarDiario({ ...datosConMantenimiento, fase: 'mantenimiento-reservado' })
  await altaMantenimiento.getByRole('button', { name: 'Registrar' }).click()
  await altaMantenimiento.waitFor({ state: 'hidden', timeout: 30000 })

  const trasAltaMantenimiento = await api(page, 'GET', 'mantenimientos')
  assert.equal(trasAltaMantenimiento.status, 200, 'No se pudo leer la colección de mantenimientos')
  const mantenimientoGuardado = trasAltaMantenimiento.json?.data?.find(item =>
    item.carId === mantenimiento.carId && item.tipo === mantenimiento.tipo && item.detalle === mantenimiento.detalle
  )
  assert.ok(mantenimientoGuardado, 'El mantenimiento registrado desde la interfaz no aparece en la API')
  guardarDiario({
    ...datosConMantenimiento,
    fase: 'mantenimiento-creado',
    mantenimiento: { ...mantenimiento, id: mantenimientoGuardado.id }
  })

  const menuMantenimiento = page.getByRole('button', { name: /Acciones del mantenimiento del/ })
  await menuMantenimiento.click()
  await page.getByText('Actualizar mantenimiento', { exact: true }).click()
  const edicionMantenimiento = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Actualizar mantenimiento' }) })
  await edicionMantenimiento.getByLabel('Detalle').fill(mantenimiento.detalleEditado)
  await edicionMantenimiento.getByLabel('Importe (S/)').fill(String(mantenimiento.importeEditado))
  await edicionMantenimiento.getByRole('button', { name: 'Guardar cambios' }).click()
  await edicionMantenimiento.waitFor({ state: 'hidden', timeout: 30000 })

  const trasEdicionMantenimiento = await api(page, 'GET', 'mantenimientos')
  const mantenimientoEditado = trasEdicionMantenimiento.json?.data?.find(item => item.id === mantenimientoGuardado.id)
  assert.equal(mantenimientoEditado?.detalle, mantenimiento.detalleEditado, 'La edición del mantenimiento no quedó persistida en Oracle')
  assert.equal(Number(mantenimientoEditado?.importe), mantenimiento.importeEditado)
  guardarDiario({
    ...datosConMantenimiento,
    fase: 'mantenimiento-editado',
    mantenimiento: { ...mantenimiento, id: mantenimientoGuardado.id }
  })

  await menuMantenimiento.click()
  await page.getByText('Anular mantenimiento', { exact: true }).click()
  const dialogoAnulacion = page.locator('.q-dialog').filter({ has: page.getByRole('heading', { name: 'Anular mantenimiento' }) })
  await dialogoAnulacion.getByLabel('Motivo *').fill(motivoLimpieza)
  guardarDiario({
    ...datosConMantenimiento,
    fase: 'mantenimiento-anulando',
    mantenimiento: { ...mantenimiento, id: mantenimientoGuardado.id }
  })
  await dialogoAnulacion.getByRole('button', { name: 'Anular', exact: true }).click()
  await dialogoAnulacion.waitFor({ state: 'hidden', timeout: 30000 })
  const trasAnularMantenimiento = await api(page, 'GET', 'mantenimientos')
  assert.ok(
    trasAnularMantenimiento.json?.data?.find(item => item.id === mantenimientoGuardado.id)?.anulacion,
    'La anulación desde Vue no quedó persistida en Oracle'
  )

  await page.getByText('Mostrar inactivos', { exact: true }).click()
  await menuMantenimiento.click()
  await page.getByText('Reactivar mantenimiento', { exact: true }).click()
  await page.getByRole('button', { name: 'Reactivar', exact: true }).click()
  await page.getByText('Mantenimiento reactivado.', { exact: true }).waitFor()
  const trasReactivarMantenimiento = await api(page, 'GET', 'mantenimientos')
  assert.equal(
    trasReactivarMantenimiento.json?.data?.find(item => item.id === mantenimientoGuardado.id)?.anulacion,
    null,
    'La reactivación desde Vue no quedó persistida en Oracle'
  )
  guardarDiario({
    ...datosConMantenimiento,
    fase: 'mantenimiento-reactivado',
    mantenimiento: { ...mantenimiento, id: mantenimientoGuardado.id }
  })
  await crearRecursosIntegrados(page, datosConMantenimiento)
  console.log('Persistencia E2E: centro, vehículo, combustible, itinerario, consumo, servicio, mantenimiento, módulo, ambiente, bien e incidencia verificados desde Vue contra API real')
}

async function crearRecursosIntegrados (page, registro) {
  const modulo = registro.modulo
  const ambiente = registro.ambiente
  const bien = registro.bien
  const incidencia = registro.incidencia

  await page.goto(`${base}#/centros?car=${encodeURIComponent(registro.codigo)}&tab=ambientes`)
  await page.getByRole('button', { name: 'Registrar módulo' }).first().waitFor({ timeout: 60000 })
  await page.getByRole('button', { name: 'Registrar módulo' }).first().click()
  const altaModulo = page.locator('.q-dialog:visible').filter({ has: page.getByRole('heading', { name: 'Registrar módulo' }) })
  await altaModulo.getByLabel('Nombre *').fill('')
  await altaModulo.getByRole('button', { name: 'Registrar módulo' }).click()
  await altaModulo.getByText('Campo obligatorio').waitFor()
  await altaModulo.getByLabel('Nombre *').fill(modulo.nombre)
  await altaModulo.getByLabel('N.º de pisos *').fill('0')
  await altaModulo.getByRole('button', { name: 'Registrar módulo' }).click()
  await altaModulo.getByText('Indique al menos 1 piso').waitFor()
  await altaModulo.getByLabel('N.º de pisos *').fill('1')
  guardarFase('modulo-reservado')
  const respuestasModulo = []
  page.on('response', async respuesta => {
    if (new URL(respuesta.url()).pathname.endsWith('/api/v1/modulos')) {
      const resultado = { status: respuesta.status(), method: respuesta.request().method() }
      if (respuesta.status() >= 400) {
        const cuerpo = await respuesta.json().catch(() => null)
        resultado.mensaje = cuerpo?.message
        resultado.campos = cuerpo?.data
      }
      respuestasModulo.push(resultado)
    }
  })
  await altaModulo.getByRole('button', { name: 'Registrar módulo' }).click()
  try {
    await altaModulo.waitFor({ state: 'hidden', timeout: 30000 })
  } catch {
    const errores = await altaModulo.locator('.q-field--error').allInnerTexts().catch(() => [])
    const botonDeshabilitado = await altaModulo.getByRole('button', { name: 'Registrar módulo' }).isDisabled().catch(() => null)
    const avisos = await page.locator('.q-notification').allInnerTexts().catch(() => [])
    const detalle = (await altaModulo.innerText().catch(() => 'sin detalle visible')).replace(/\s+/g, ' ').slice(-500)
    throw new Error(`No se guardó el módulo desde Vue; respuestas=${JSON.stringify(respuestasModulo)}; avisos=${JSON.stringify(avisos)}; errores=${JSON.stringify(errores)}; botónDeshabilitado=${botonDeshabilitado}; diálogo=${detalle}`)
  }

  const jerarquiaModulo = await api(page, 'GET', 'centros/jerarquia')
  assert.equal(jerarquiaModulo.status, 200, 'No se pudo leer la jerarquía después del alta de módulo')
  const moduloCreado = jerarquiaModulo.json?.data?.modulos?.find(item =>
    item.carId === registro.codigo && item.nombre === modulo.nombre
  )
  assert.ok(moduloCreado, 'El módulo creado desde Vue no aparece en la jerarquía Oracle')
  assert.equal(moduloCreado.capacidad ?? null, null, 'La capacidad de la casa debe ser opcional')
  guardarFase('modulo-creado', 'modulo', { id: moduloCreado.id })

  await page.goto(`${base}#/centros?modulo=${encodeURIComponent(moduloCreado.id)}&tab=ambientes`)
  await page.getByRole('button', { name: `Acciones de ${modulo.nombre}` }).click()
  await page.getByText('Actualizar módulo', { exact: true }).click()
  const edicionModulo = page.locator('.q-dialog:visible').filter({ has: page.getByRole('heading', { name: 'Actualizar módulo' }) })
  await edicionModulo.getByLabel('Capacidad de residentes').fill('-1')
  await edicionModulo.getByRole('button', { name: 'Guardar cambios' }).click()
  await edicionModulo.getByText('Indique un número entero, cero o mayor').waitFor()
  await edicionModulo.getByLabel('Capacidad de residentes').fill('0')
  await edicionModulo.getByLabel('Nombre *').fill(modulo.nombreEditado)
  guardarFase('modulo-editando', 'modulo', { id: moduloCreado.id })
  await edicionModulo.getByRole('button', { name: 'Guardar cambios' }).click()
  await edicionModulo.waitFor({ state: 'hidden', timeout: 30000 })
  const jerarquiaModuloEditado = await api(page, 'GET', 'centros/jerarquia')
  assert.equal(
    jerarquiaModuloEditado.json?.data?.modulos?.find(item => item.id === moduloCreado.id)?.nombre,
    modulo.nombreEditado,
    'La edición del módulo no quedó persistida en Oracle'
  )
  assert.equal(jerarquiaModuloEditado.json?.data?.modulos?.find(item => item.id === moduloCreado.id)?.capacidad, 0)
  guardarFase('modulo-editado', 'modulo', { id: moduloCreado.id })

  await page.getByRole('button', { name: 'Registrar ambiente' }).click()
  const altaAmbiente = page.locator('.q-dialog:visible').filter({ has: page.getByRole('heading', { name: 'Registrar ambiente' }) })
  await altaAmbiente.getByLabel('Nombre *').fill('')
  await altaAmbiente.getByRole('button', { name: 'Registrar ambiente' }).click()
  await altaAmbiente.getByText('Campo obligatorio').waitFor()
  await altaAmbiente.getByLabel('Nombre *').fill(ambiente.nombre)
  guardarFase('ambiente-reservado')
  await altaAmbiente.getByRole('button', { name: 'Registrar ambiente' }).click()
  await altaAmbiente.waitFor({ state: 'hidden', timeout: 30000 })

  const jerarquiaAmbiente = await api(page, 'GET', 'centros/jerarquia')
  assert.equal(jerarquiaAmbiente.status, 200, 'No se pudo leer la jerarquía después del alta de ambiente')
  const ambienteCreado = jerarquiaAmbiente.json?.data?.ambientes?.find(item =>
    item.moduloId === moduloCreado.id && item.nombre === ambiente.nombre
  )
  assert.ok(ambienteCreado, 'El ambiente creado desde Vue no aparece en la jerarquía Oracle')
  guardarFase('ambiente-creado', 'ambiente', { id: ambienteCreado.id, moduloId: moduloCreado.id })

  await page.goto(`${base}#/centros?ambiente=${encodeURIComponent(ambienteCreado.id)}`)
  await page.getByRole('button', { name: `Acciones de ${ambiente.nombre}` }).click()
  await page.getByText('Actualizar ambiente', { exact: true }).click()
  const edicionAmbiente = page.locator('.q-dialog:visible').filter({ has: page.getByRole('heading', { name: 'Actualizar ambiente' }) })
  await edicionAmbiente.getByLabel('Nombre *').fill(ambiente.nombreEditado)
  guardarFase('ambiente-editando', 'ambiente', { id: ambienteCreado.id, moduloId: moduloCreado.id })
  await edicionAmbiente.getByRole('button', { name: 'Guardar cambios' }).click()
  await edicionAmbiente.waitFor({ state: 'hidden', timeout: 30000 })
  const jerarquiaAmbienteEditado = await api(page, 'GET', 'centros/jerarquia')
  assert.equal(
    jerarquiaAmbienteEditado.json?.data?.ambientes?.find(item => item.id === ambienteCreado.id)?.nombre,
    ambiente.nombreEditado,
    'La edición del ambiente no quedó persistida en Oracle'
  )
  guardarFase('ambiente-editado', 'ambiente', { id: ambienteCreado.id, moduloId: moduloCreado.id })

  await page.goto(`${base}#/centros?registrar=1&ambiente=${encodeURIComponent(ambienteCreado.id)}`)
  await page.getByRole('heading', { name: `Registrar bien en ${ambiente.nombreEditado}` }).waitFor({ timeout: 60000 })
  const altaBien = page.locator('.sg-registro-bien-dialog')
  await altaBien.getByRole('button', { name: 'Guardar', exact: true }).click()
  await altaBien.getByText('Campo obligatorio').first().waitFor()
  await altaBien.getByLabel('Tipo de bien *').click()
  await page.getByRole('option', { name: bien.tipoNombre, exact: true }).click()
  await altaBien.getByLabel('Nombre *').fill(bien.nombre)
  await altaBien.getByLabel('Rótulo SIGREC *').fill(bien.id)
  await altaBien.getByLabel('Cantidad *').fill('0')
  await altaBien.getByRole('button', { name: 'Guardar', exact: true }).click()
   await altaBien.getByText('Mínimo 1').waitFor()
  await altaBien.getByLabel('Cantidad *').fill('1')
  await altaBien.getByRole('radio', { name: 'Bueno' }).check()
  guardarFase('bien-reservado')
  await altaBien.getByRole('button', { name: 'Guardar', exact: true }).click()
  await altaBien.waitFor({ state: 'hidden', timeout: 30000 })

  const inventarioBien = await api(page, 'GET', 'bienes/datos')
  assert.equal(inventarioBien.status, 200, 'No se pudo leer el inventario después del alta de bien')
  const bienCreado = inventarioBien.json?.data?.bienes?.find(item => item.id === bien.id)
  assert.ok(bienCreado, 'El bien creado desde Vue no aparece en Oracle')
  assert.equal(bienCreado.ambienteId, ambienteCreado.id)
  guardarFase('bien-creado', 'bien', { id: bienCreado.id, ambienteId: ambienteCreado.id })

  await page.goto(`${base}#/centros?bien=${encodeURIComponent(bienCreado.id)}`)
  await page.getByRole('button', { name: 'Actualizar información' }).click()
  const edicionBien = page.locator('.q-dialog:visible').filter({ has: page.getByRole('heading', { name: 'Actualizar información' }) })
  await edicionBien.getByLabel('Nombre *').fill(bien.nombreEditado)
  guardarFase('bien-editando', 'bien', { id: bienCreado.id, ambienteId: ambienteCreado.id })
  await edicionBien.getByRole('button', { name: 'Guardar', exact: true }).click()
  await edicionBien.waitFor({ state: 'hidden', timeout: 30000 })
  const inventarioBienEditado = await api(page, 'GET', 'bienes/datos')
  assert.equal(
    inventarioBienEditado.json?.data?.bienes?.find(item => item.id === bienCreado.id)?.nombre,
    bien.nombreEditado,
    'La edición del bien no quedó persistida en Oracle'
  )
  guardarFase('bien-editado', 'bien', { id: bienCreado.id, ambienteId: ambienteCreado.id })

  await page.getByRole('button', { name: 'Registrar incidente' }).click()
  const altaIncidente = page.locator('.q-dialog:visible').filter({ has: page.getByRole('heading', { name: 'Registrar incidente' }) })
  await altaIncidente.getByLabel('Motivo *').fill('')
  await altaIncidente.getByRole('button', { name: 'Registrar incidente' }).click()
  await altaIncidente.getByText('Campo obligatorio').waitFor()
  await altaIncidente.getByLabel('Fecha del hecho *').fill(`${new Date().getFullYear() + 1}-01-01`)
  await altaIncidente.getByLabel('Motivo *').fill(incidencia.titulo)
  await altaIncidente.getByRole('button', { name: 'Registrar incidente' }).click()
  await altaIncidente.getByText('No puede ser posterior a hoy').waitFor()
  await altaIncidente.getByLabel('Fecha del hecho *').fill('2020-01-10')
  guardarFase('incidencia-reservada')
  await altaIncidente.getByRole('button', { name: 'Registrar incidente' }).click()
  await altaIncidente.getByText('Seleccione Sí o No').waitFor()
  await altaIncidente.getByRole('radio', { name: 'No' }).check()
  await altaIncidente.getByRole('button', { name: 'Registrar incidente' }).click()
  await altaIncidente.waitFor({ state: 'hidden', timeout: 30000 })

  const inventarioIncidente = await api(page, 'GET', 'bienes/datos')
  assert.equal(inventarioIncidente.status, 200, 'No se pudo leer inventario/hechos tras registrar la incidencia')
  const incidenciaCreada = inventarioIncidente.json?.data?.eventos?.find(item => item.titulo === incidencia.titulo)
  assert.ok(incidenciaCreada, 'La incidencia creada desde Vue no aparece en Oracle')
  assert.ok(incidenciaCreada.bienIds?.includes(bienCreado.id), 'La incidencia persistida no está asociada al bien E2E')
  guardarFase('incidencia-creada', 'incidencia', { id: incidenciaCreada.id, bienId: bienCreado.id })

  await page.getByRole('button', { name: `Acciones del hecho ${incidencia.titulo}` }).click()
  await page.getByText('Actualizar incidente', { exact: true }).click()
  const edicionIncidente = page.locator('.q-dialog:visible').filter({ has: page.getByRole('heading', { name: 'Actualizar incidente' }) })
  await edicionIncidente.getByLabel('Motivo *').fill(incidencia.tituloEditado)
  await edicionIncidente.getByLabel('Detalle').fill(incidencia.detalleEditado)
  guardarFase('incidencia-editando', 'incidencia', { id: incidenciaCreada.id, bienId: bienCreado.id })
  await edicionIncidente.getByRole('button', { name: 'Guardar cambios' }).click()
  await edicionIncidente.waitFor({ state: 'hidden', timeout: 30000 })
  const inventarioIncidenteEditado = await api(page, 'GET', 'bienes/datos')
  const incidenciaEditada = inventarioIncidenteEditado.json?.data?.eventos?.find(item => item.id === incidenciaCreada.id)
  assert.equal(incidenciaEditada?.titulo, incidencia.tituloEditado, 'La edición del incidente no quedó persistida en Oracle')
  assert.equal(incidenciaEditada?.detalle, incidencia.detalleEditado)
  guardarFase('incidencia-editada', 'incidencia', { id: incidenciaCreada.id, bienId: bienCreado.id })

  await page.getByRole('button', { name: `Acciones del hecho ${incidencia.tituloEditado}` }).click()
  await page.getByText('Anular incidente', { exact: true }).click()
  const anulacionIncidente = page.locator('.q-dialog:visible').filter({ has: page.getByRole('heading', { name: 'Anular incidente' }) })
  guardarFase('incidencia-anulando', 'incidencia', { id: incidenciaCreada.id, bienId: bienCreado.id })
  await anulacionIncidente.getByLabel('Motivo *').fill(motivoLimpieza)
  await anulacionIncidente.getByRole('button', { name: 'Anular', exact: true }).click()
  await anulacionIncidente.waitFor({ state: 'hidden', timeout: 30000 })
  const inventarioIncidenteAnulado = await api(page, 'GET', 'bienes/datos')
  assert.ok(
    inventarioIncidenteAnulado.json?.data?.eventos?.find(item => item.id === incidenciaCreada.id)?.anulacion,
    'La anulación UI del incidente no quedó persistida en Oracle'
  )

  await page.getByRole('button', { name: `Acciones del hecho ${incidencia.tituloEditado}` }).click()
  await page.getByText('Reactivar incidente', { exact: true }).click()
  await page.getByRole('button', { name: 'Reactivar', exact: true }).click()
  await page.getByText('Incidente reactivado.', { exact: true }).waitFor()
  const inventarioIncidenteReactivado = await api(page, 'GET', 'bienes/datos')
  assert.equal(
    inventarioIncidenteReactivado.json?.data?.eventos?.find(item => item.id === incidenciaCreada.id)?.anulacion ?? null,
    null,
    'La reactivación UI del incidente no quedó persistida en Oracle'
  )
  guardarFase('incidencia-reactivada', 'incidencia', { id: incidenciaCreada.id, bienId: bienCreado.id })

  await page.goto(`${base}#/centros?bien=${encodeURIComponent(bienCreado.id)}`)
  await page.getByRole('button', { name: `Más acciones de ${bien.nombreEditado}` }).click()
  await page.getByText('Anular registro', { exact: true }).click()
  const anulacionBien = page.locator('.q-dialog:visible').filter({ has: page.getByRole('heading', { name: 'Anular registro del bien' }) })
  guardarFase('bien-anulando', 'bien', { id: bienCreado.id, ambienteId: ambienteCreado.id })
  await anulacionBien.getByLabel('Motivo *').fill(motivoLimpieza)
  await anulacionBien.getByRole('button', { name: 'Anular', exact: true }).click()
  await anulacionBien.waitFor({ state: 'hidden', timeout: 30000 })
  const inventarioBienAnulado = await api(page, 'GET', 'bienes/datos')
  assert.ok(inventarioBienAnulado.json?.data?.bienes?.find(item => item.id === bienCreado.id)?.anulacion, 'La anulación UI del bien no quedó persistida en Oracle')
  await page.getByRole('button', { name: `Más acciones de ${bien.nombreEditado}` }).click()
  await page.getByText('Reactivar registro', { exact: true }).click()
  await page.getByRole('button', { name: 'Reactivar', exact: true }).click()
  await page.getByText('Bien reactivado.', { exact: true }).waitFor()
  const inventarioBienReactivado = await api(page, 'GET', 'bienes/datos')
  assert.equal(inventarioBienReactivado.json?.data?.bienes?.find(item => item.id === bienCreado.id)?.anulacion ?? null, null)
  guardarFase('bien-reactivado', 'bien', { id: bienCreado.id, ambienteId: ambienteCreado.id })
}

async function verificarYLimpiar (page) {
  assert.ok(fs.existsSync(diario), `No existe diario de alta para verificar: ${diario}`)
  const registro = JSON.parse(fs.readFileSync(diario, 'utf8'))
  assert.equal(registro.version, 1)
  assert.equal(registro.identidad, identidad, 'El diario no pertenece a esta suite')
  assert.ok(fasesProceso.includes(registro.fase), 'Fase desconocida; conservar diario y no modificar Oracle')

  const consulta = await api(page, 'GET', 'centros/jerarquia')
  assert.equal(consulta.status, 200, 'No se pudo recuperar la jerarquía tras reiniciar el backend')
  const centros = consulta.json?.data?.cars || []
  const centro = centros.find(item => item.id === registro.codigo)
  if (!centro && registro.fase === 'reservado') {
    fs.unlinkSync(diario)
    console.log('Persistencia E2E: diario recuperado; el alta del centro no llegó a persistirse')
    return
  }
  assert.ok(centro, 'El centro E2E no persistió tras reiniciar el backend')
  assert.ok(
    [registro.nombre, registro.nombreEditado].includes(centro.nombre),
    'El nombre del centro no coincide con el diario de recuperación'
  )
  if (alcanzoFase(registro.fase, 'editado')) {
    assert.equal(centro.nombre, registro.nombreEditado, 'La última edición no persistió tras reiniciar el backend')
    if (registro.unidadId != null) assert.equal(centro.unidadOrganica?.id, registro.unidadId)
  }

  const modulos = consulta.json?.data?.modulos || []
  const ambientes = consulta.json?.data?.ambientes || []
  const inventarioRespuesta = await api(page, 'GET', 'bienes/datos')
  assert.equal(inventarioRespuesta.status, 200, 'No se pudo recuperar el inventario tras reiniciar el backend')
  const bienes = inventarioRespuesta.json?.data?.bienes || []
  const eventos = inventarioRespuesta.json?.data?.eventos || []

  const buscarUnico = (coleccion, predicado, descripcion) => {
    const encontrados = coleccion.filter(predicado)
    assert.ok(encontrados.length <= 1, `Hay más de un ${descripcion} coincidente; conservar el diario para investigar`)
    return encontrados[0]
  }
  const modulo = buscarUnico(modulos, item =>
    item.id === registro.modulo?.id ||
    (item.carId === registro.codigo && [registro.modulo?.nombre, registro.modulo?.nombreEditado].includes(item.nombre)),
  'módulo E2E')
  const moduloEsperado = alcanzoFase(registro.fase, 'modulo-creado')
  if (moduloEsperado) assert.ok(modulo, 'El módulo E2E no persistió tras reiniciar el backend')
  if (modulo) {
    assert.equal(modulo.carId, registro.codigo, 'El módulo encontrado no pertenece al centro E2E')
    assert.ok([registro.modulo.nombre, registro.modulo.nombreEditado].includes(modulo.nombre))
    if (alcanzoFase(registro.fase, 'modulo-editado')) {
      assert.equal(modulo.nombre, registro.modulo.nombreEditado, 'La edición del módulo no persistió tras reiniciar el backend')
    }
  }

  const ambiente = buscarUnico(ambientes, item =>
    item.id === registro.ambiente?.id ||
    (item.moduloId === (registro.modulo?.id || modulo?.id) &&
      [registro.ambiente?.nombre, registro.ambiente?.nombreEditado].includes(item.nombre)),
  'ambiente E2E')
  const ambienteEsperado = alcanzoFase(registro.fase, 'ambiente-creado')
  if (ambienteEsperado) assert.ok(ambiente, 'El ambiente E2E no persistió tras reiniciar el backend')
  if (ambiente) {
    assert.equal(ambiente.moduloId, registro.modulo?.id || modulo?.id, 'El ambiente no pertenece al módulo E2E')
    assert.ok([registro.ambiente.nombre, registro.ambiente.nombreEditado].includes(ambiente.nombre))
    if (alcanzoFase(registro.fase, 'ambiente-editado')) {
      assert.equal(ambiente.nombre, registro.ambiente.nombreEditado, 'La edición del ambiente no persistió tras reiniciar el backend')
    }
  }

  const bien = buscarUnico(bienes, item =>
    item.id === registro.bien?.id ||
    (ambiente && item.ambienteId === (registro.ambiente?.id || ambiente.id) &&
      [registro.bien?.nombre, registro.bien?.nombreEditado].includes(item.nombre)),
  'bien E2E')
  const bienEsperado = alcanzoFase(registro.fase, 'bien-creado')
  if (bienEsperado) assert.ok(bien, 'El bien E2E no persistió tras reiniciar el backend')
  if (bien) {
    assert.equal(bien.id, registro.bien.id, 'El rótulo del bien no coincide con el diario')
    assert.equal(bien.ambienteId, registro.ambiente?.id || ambiente?.id, 'El bien no pertenece al ambiente E2E')
    assert.ok([registro.bien.nombre, registro.bien.nombreEditado].includes(bien.nombre))
    if (alcanzoFase(registro.fase, 'bien-editado')) {
      assert.equal(bien.nombre, registro.bien.nombreEditado, 'La edición del bien no persistió tras reiniciar el backend')
    }
  }

  const incidencia = buscarUnico(eventos, item =>
    item.id === registro.incidencia?.id ||
    (registro.bien && (item.bienIds || []).includes(registro.bien.id) &&
      [registro.incidencia?.titulo, registro.incidencia?.tituloEditado].includes(item.titulo)),
  'incidencia E2E')
  const incidenciaEsperada = alcanzoFase(registro.fase, 'incidencia-creada')
  if (incidenciaEsperada) assert.ok(incidencia, 'La incidencia E2E no persistió tras reiniciar el backend')
  if (incidencia) {
    assert.ok((incidencia.bienIds || []).includes(registro.bien.id), 'La incidencia no está asociada al bien E2E')
    assert.ok([registro.incidencia.titulo, registro.incidencia.tituloEditado].includes(incidencia.titulo))
    assert.ok([registro.incidencia.detalle, registro.incidencia.detalleEditado].includes(incidencia.detalle))
    if (alcanzoFase(registro.fase, 'incidencia-editada')) {
      assert.equal(incidencia.titulo, registro.incidencia.tituloEditado, 'La edición de la incidencia no persistió tras reiniciar')
      assert.equal(incidencia.detalle, registro.incidencia.detalleEditado)
    }
  }

  // Guardar IDs descubiertos antes de cualquier baja para que una interrupción sea recuperable.
  guardarDiario({
    ...registro,
    ...(modulo ? { modulo: { ...registro.modulo, id: modulo.id } } : {}),
    ...(ambiente ? { ambiente: { ...registro.ambiente, id: ambiente.id, moduloId: ambiente.moduloId } } : {}),
    ...(bien ? { bien: { ...registro.bien, id: bien.id, ambienteId: bien.ambienteId } } : {}),
    ...(incidencia ? { incidencia: { ...registro.incidencia, id: incidencia.id, bienId: bien?.id || registro.bien?.id } } : {})
  })

  const combustibles = await api(page, 'GET', 'combustible')
  assert.equal(combustibles.status, 200, 'No se pudo recuperar combustible tras reiniciar el backend')
  const combustible = buscarUnico(combustibles.json?.data || [], item =>
    item.id === registro.combustible?.id ||
    (item.vehiculoId === registro.vehiculo?.id &&
      [registro.combustible?.sustento, registro.combustible?.sustentoEditado].includes(item.sustento)),
  'registro de combustible E2E')
  const itinerariosRespuesta = await api(page, 'GET', 'itinerarios')
  assert.equal(itinerariosRespuesta.status, 200, 'No se pudo recuperar itinerarios tras reiniciar el backend')
  const itinerario = buscarUnico(itinerariosRespuesta.json?.data || [], item =>
    item.id === registro.itinerario?.id ||
    (item.vehiculoId === registro.vehiculo?.id &&
      [registro.itinerario?.proposito, registro.itinerario?.propositoEditado].includes(item.proposito)),
  'itinerario E2E')
  const itinerarioEsperado = alcanzoFase(registro.fase, 'itinerario-creado')
  if (itinerarioEsperado) assert.ok(itinerario, 'El itinerario E2E no persistió tras reiniciar el backend')
  if (itinerario) {
    assert.equal(itinerario.vehiculoId, registro.vehiculo.id, 'El itinerario no pertenece al vehículo E2E')
    assert.ok(
      [registro.itinerario.proposito, registro.itinerario.propositoEditado].includes(itinerario.proposito),
      'El propósito del itinerario no coincide con el diario'
    )
    if (alcanzoFase(registro.fase, 'itinerario-editado')) {
      assert.equal(itinerario.proposito, registro.itinerario.propositoEditado, 'La edición del itinerario no persistió tras reiniciar')
    }
    if (alcanzoFase(registro.fase, 'itinerario-ejecutado')) {
      assert.equal(itinerario.realizado?.salida, registro.itinerario.salidaReal)
      assert.equal(itinerario.realizado?.llegada, registro.itinerario.llegadaReal)
      assert.equal(Number(itinerario.realizado?.km), registro.itinerario.kmRealizados)
    }
    if (alcanzoFase(registro.fase, 'itinerario-anulado')) assert.ok(itinerario.anulacion)
    if (alcanzoFase(registro.fase, 'itinerario-reactivado')) assert.equal(itinerario.anulacion ?? null, null)
  }
  const consumo = buscarUnico(combustibles.json?.data || [], item =>
    item.id === registro.consumo?.id ||
    (itinerario && item.itinerarioId === itinerario.id) ||
    [registro.consumo?.sustento, registro.consumo?.sustentoEditado].includes(item.sustento),
  'consumo E2E')
  const consumoEsperado = alcanzoFase(registro.fase, 'consumo-creado')
  if (consumoEsperado) assert.ok(consumo, 'El consumo E2E no persistió tras reiniciar el backend')
  if (consumo) {
    assert.equal(consumo.tipo, 'consumo', 'El registro E2E del recorrido debe ser consumo')
    assert.equal(consumo.itinerarioId, itinerario?.id, 'El consumo no está vinculado al itinerario E2E')
    assert.ok(
      [registro.consumo.cantidad, registro.consumo.cantidadEditada].includes(Number(consumo.cantidad)),
      'La cantidad del consumo no coincide con el diario'
    )
    assert.ok(
      [registro.consumo.sustento, registro.consumo.sustentoEditado].includes(consumo.sustento),
      'El sustento del consumo no coincide con el diario'
    )
    if (alcanzoFase(registro.fase, 'consumo-editado')) {
      assert.equal(consumo.sustento, registro.consumo.sustentoEditado, 'La edición del consumo no persistió tras reiniciar')
      assert.equal(Number(consumo.cantidad), registro.consumo.cantidadEditada)
    }
    if (alcanzoFase(registro.fase, 'consumo-anulado')) assert.ok(consumo.anulacion)
    if (alcanzoFase(registro.fase, 'consumo-reactivado')) assert.equal(consumo.anulacion ?? null, null)
  }
  const combustibleEsperado = alcanzoFase(registro.fase, 'combustible-creado')
  if (combustibleEsperado) assert.ok(combustible, 'El registro de combustible E2E no persistió tras reiniciar el backend')
  if (combustible) {
    assert.equal(combustible.vehiculoId, registro.vehiculo.id, 'El combustible no pertenece al vehículo E2E')
    assert.equal(combustible.tipo, 'carga')
    assert.ok(
      [registro.combustible.cantidad, registro.combustible.cantidadEditada].includes(Number(combustible.cantidad)),
      'La cantidad de combustible no coincide con el diario de recuperación'
    )
    assert.ok(
      [registro.combustible.sustento, registro.combustible.sustentoEditado].includes(combustible.sustento),
      'El sustento de combustible no coincide con el diario de recuperación'
    )
    if (alcanzoFase(registro.fase, 'combustible-editado')) {
      assert.equal(combustible.sustento, registro.combustible.sustentoEditado, 'La edición del combustible no persistió tras reiniciar')
      assert.equal(Number(combustible.cantidad), registro.combustible.cantidadEditada)
    }
    if (alcanzoFase(registro.fase, 'combustible-reactivado')) {
      assert.equal(combustible.anulacion ?? null, null, 'El combustible debía estar vigente al reiniciar')
    }
  }

  const vehiculos = await api(page, 'GET', 'vehiculos')
  assert.equal(vehiculos.status, 200, 'No se pudo recuperar la colección de vehículos tras reiniciar el backend')
  const vehiculo = vehiculos.json?.data?.find(item => item.id === registro.vehiculo?.id || item.placa === registro.vehiculo?.placa)
  const vehiculoEsperado = alcanzoFase(registro.fase, 'vehiculo-creado')
  if (vehiculoEsperado) assert.ok(vehiculo, 'El vehículo E2E no persistió tras reiniciar el backend')
  if (combustible) {
    guardarDiario({
      ...JSON.parse(fs.readFileSync(diario, 'utf8')),
      combustible: { ...registro.combustible, id: combustible.id, vehiculoId: combustible.vehiculoId }
    })
    if (!combustible.anulacion) {
      const anulacionCombustible = await api(page, 'POST', `combustible/${encodeURIComponent(combustible.id)}/anular`, { motivo: motivoLimpieza })
      assert.equal(anulacionCombustible.status, 200, 'No se pudo anular lógicamente el combustible E2E')
    }
    const combustiblesAnulados = await api(page, 'GET', 'combustible')
    const combustibleAnulado = combustiblesAnulados.json?.data?.find(item => item.id === combustible.id)
    assert.ok(combustibleAnulado?.anulacion, 'El combustible E2E debe quedar anulado, nunca eliminado físicamente')
    assert.equal(combustibleAnulado.sustento, combustible.sustento)
  }
  guardarDiario({
    ...JSON.parse(fs.readFileSync(diario, 'utf8')),
    ...(itinerario ? { itinerario: { ...registro.itinerario, id: itinerario.id, vehiculoId: itinerario.vehiculoId } } : {}),
    ...(consumo ? { consumo: { ...registro.consumo, id: consumo.id, itinerarioId: consumo.itinerarioId } } : {})
  })
  if (consumo && !consumo.anulacion) {
    const anularConsumo = await api(page, 'POST', `combustible/${encodeURIComponent(consumo.id)}/anular`, { motivo: motivoLimpieza })
    assert.equal(anularConsumo.status, 200, 'No se pudo anular lógicamente el consumo E2E')
  }
  if (consumo) {
    const listaConsumos = await api(page, 'GET', 'combustible')
    assert.ok(listaConsumos.json?.data?.find(item => item.id === consumo.id)?.anulacion, 'El consumo debe quedar anulado lógicamente')
  }
  if (itinerario && !itinerario.anulacion) {
    const anularItinerario = await api(page, 'POST', `itinerarios/${encodeURIComponent(itinerario.id)}/anular`, { motivo: motivoLimpieza })
    assert.equal(anularItinerario.status, 200, 'No se pudo anular lógicamente el itinerario E2E')
  }
  if (itinerario) {
    const listaItinerarios = await api(page, 'GET', 'itinerarios')
    assert.ok(listaItinerarios.json?.data?.find(item => item.id === itinerario.id)?.anulacion, 'El itinerario debe quedar anulado lógicamente')
  }
  if (vehiculo) {
    assert.equal(vehiculo.carId, registro.codigo, 'El vehículo encontrado no pertenece al centro de prueba')
    assert.equal(vehiculo.placa, registro.vehiculo.placa, 'La placa del vehículo no coincide con el diario')
    assert.ok(
      [registro.vehiculo.tipo, registro.vehiculo.tipoEditado].includes(vehiculo.tipo),
      'El tipo del vehículo no coincide con el diario de recuperación'
    )
    if (alcanzoFase(registro.fase, 'vehiculo-editado')) {
      assert.equal(vehiculo.tipo, registro.vehiculo.tipoEditado, 'La última edición del vehículo no persistió tras reiniciar el backend')
    }
    if (!vehiculo.anulacion) {
      const anulacionVehiculo = await api(page, 'POST', `vehiculos/${encodeURIComponent(vehiculo.id)}/anular`, { motivo: motivoLimpieza })
      assert.equal(anulacionVehiculo.status, 200, 'No se pudo anular lógicamente el vehículo E2E')
    }
    const vehiculosAnulados = await api(page, 'GET', 'vehiculos')
    const vehiculoAnulado = vehiculosAnulados.json?.data?.find(item => item.id === vehiculo.id)
    assert.ok(vehiculoAnulado?.anulacion, 'El vehículo E2E debe quedar anulado, nunca eliminado físicamente')
    assert.equal(vehiculoAnulado.tipo, vehiculo.tipo)
  }

  const servicios = await api(page, 'GET', 'servicios')
  assert.equal(servicios.status, 200, 'No se pudo recuperar la colección de servicios tras reiniciar el backend')
  const servicio = servicios.json?.data?.find(item => item.id === registro.servicio?.id ||
    (item.carId === registro.servicio?.carId && item.tipo === registro.servicio?.tipo))
  const servicioEsperado = alcanzoFase(registro.fase, 'servicio-creado')
  if (servicioEsperado) {
    assert.ok(servicio, 'El servicio E2E no persistió tras reiniciar el backend')
  }
  if (servicio && alcanzoFase(registro.fase, 'servicio-editado')) {
    assert.equal(servicio.proveedor, registro.servicio.proveedorEditado, 'La última edición del servicio no persistió tras reiniciar el backend')
  } else if (servicio) {
    assert.equal(servicio.carId, registro.codigo, 'El servicio encontrado no pertenece al centro de prueba')
    assert.ok(
      [registro.servicio.proveedor, registro.servicio.proveedorEditado].includes(servicio.proveedor),
      'El proveedor del servicio no coincide con el diario de recuperación'
    )
  }
  if (servicio && !servicio.anulacion) {
    const anulacionServicio = await api(page, 'POST', `servicios/${encodeURIComponent(servicio.id)}/anular`, { motivo: motivoLimpieza })
    assert.equal(anulacionServicio.status, 200, 'No se pudo anular lógicamente el servicio E2E')
    const serviciosAnulados = await api(page, 'GET', 'servicios')
    const servicioAnulado = serviciosAnulados.json?.data?.find(item => item.id === servicio.id)
    assert.ok(servicioAnulado?.anulacion, 'El servicio E2E debe quedar anulado, nunca eliminado físicamente')
  }

  const mantenimientos = await api(page, 'GET', 'mantenimientos')
  assert.equal(mantenimientos.status, 200, 'No se pudo recuperar la colección de mantenimientos tras reiniciar el backend')
  const mantenimiento = mantenimientos.json?.data?.find(item =>
    item.id === registro.mantenimiento?.id ||
    (item.carId === registro.mantenimiento?.carId &&
      item.tipo === registro.mantenimiento?.tipo &&
      [registro.mantenimiento?.detalle, registro.mantenimiento?.detalleEditado].includes(item.detalle))
  )
  const mantenimientoEsperado = alcanzoFase(registro.fase, 'mantenimiento-creado')
  if (mantenimientoEsperado) assert.ok(mantenimiento, 'El mantenimiento E2E no persistió tras reiniciar el backend')
  if (mantenimiento) {
    assert.equal(mantenimiento.carId, registro.codigo, 'El mantenimiento encontrado no pertenece al centro de prueba')
    assert.equal(mantenimiento.tipo, registro.mantenimiento.tipo)
    assert.ok(
      [registro.mantenimiento.detalle, registro.mantenimiento.detalleEditado].includes(mantenimiento.detalle),
      'El detalle del mantenimiento no coincide con el diario de recuperación'
    )
    if (alcanzoFase(registro.fase, 'mantenimiento-reactivado')) assert.equal(mantenimiento.anulacion ?? null, null)
    if (!mantenimiento.anulacion) {
      const anulacionMantenimiento = await api(page, 'POST', `mantenimientos/${encodeURIComponent(mantenimiento.id)}/anular`, { motivo: motivoLimpieza })
      assert.equal(anulacionMantenimiento.status, 200, 'No se pudo anular lógicamente el mantenimiento E2E')
    }
    const mantenimientosAnulados = await api(page, 'GET', 'mantenimientos')
    assert.ok(
      mantenimientosAnulados.json?.data?.find(item => item.id === mantenimiento.id)?.anulacion,
      'El mantenimiento E2E debe quedar anulado, nunca eliminado físicamente'
    )
  }

  if (incidencia && !incidencia.anulacion) {
    const anulacionIncidencia = await api(page, 'POST', `incidencias/${encodeURIComponent(incidencia.id)}/anular`, { motivo: motivoLimpieza })
    assert.equal(anulacionIncidencia.status, 200, 'No se pudo anular lógicamente la incidencia E2E')
  }
  const eventosFinales = await api(page, 'GET', 'bienes/datos')
  const incidenciaFinal = eventosFinales.json?.data?.eventos?.find(item => item.id === incidencia?.id)
  if (incidencia) assert.ok(incidenciaFinal?.anulacion, 'La incidencia debe quedar anulada lógicamente')

  if (bien && !bien.anulacion) {
    const anulacionBien = await api(page, 'POST', `bienes/${encodeURIComponent(bien.id)}/anular`, { motivo: motivoLimpieza })
    assert.equal(anulacionBien.status, 200, 'No se pudo anular lógicamente el bien E2E')
  }
  const bienesFinales = await api(page, 'GET', 'bienes/datos')
  const bienFinal = bienesFinales.json?.data?.bienes?.find(item => item.id === bien?.id)
  if (bien) assert.ok(bienFinal?.anulacion, 'El bien debe quedar anulado lógicamente')

  if (ambiente && !ambiente.anulacion) {
    const anulacionAmbiente = await api(page, 'POST', `ambientes/${encodeURIComponent(ambiente.id)}/anular`, { motivo: motivoLimpieza })
    assert.equal(anulacionAmbiente.status, 200, 'No se pudo anular lógicamente el ambiente E2E')
  }
  const jerarquiaTrasAmbiente = await api(page, 'GET', 'centros/jerarquia')
  const ambienteFinal = jerarquiaTrasAmbiente.json?.data?.ambientes?.find(item => item.id === ambiente?.id)
  if (ambiente) assert.ok(ambienteFinal?.anulacion, 'El ambiente debe quedar anulado lógicamente')

  if (modulo && !modulo.anulacion) {
    const anulacionModulo = await api(page, 'POST', `modulos/${encodeURIComponent(modulo.id)}/anular`, { motivo: motivoLimpieza })
    assert.equal(anulacionModulo.status, 200, 'No se pudo anular lógicamente el módulo E2E')
  }
  const jerarquiaFinal = await api(page, 'GET', 'centros/jerarquia')
  const moduloFinal = jerarquiaFinal.json?.data?.modulos?.find(item => item.id === modulo?.id)
  if (modulo) assert.ok(moduloFinal?.anulacion, 'El módulo debe quedar anulado lógicamente')

  if (!centro.anulacion) {
    const anulacion = await api(page, 'POST', `centros/${registro.codigo}/anular`, { motivo: motivoLimpieza })
    assert.equal(anulacion.status, 200, 'No se pudo anular lógicamente el centro de prueba')
  }
  const comprobacion = await api(page, 'GET', 'centros/jerarquia')
  const centroAnulado = comprobacion.json?.data?.cars?.find(item => item.id === registro.codigo)
  assert.ok(centroAnulado?.anulacion, 'El centro de prueba debe quedar anulado, nunca eliminado físicamente')
  if (alcanzoFase(registro.fase, 'editado')) assert.equal(centroAnulado.nombre, registro.nombreEditado)

  fs.unlinkSync(diario)
  console.log('Persistencia E2E: jerarquía, bien, incidencia, centro, vehículo, combustible, servicio y mantenimiento persistidos y anulados lógicamente tras reinicio')
}

async function main () {
  const modo = process.argv[2] || 'crear'
  assert.ok(['crear', 'verificar'].includes(modo), 'Uso: node e2e/persistencia-intranet.cjs [crear|verificar]')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const erroresPagina = []
  page.on('pageerror', error => erroresPagina.push(error.message))
  try {
    await iniciarSesion(page)
    if (modo === 'crear') await crear(page)
    else await verificarYLimpiar(page)
    assert.deepEqual(erroresPagina, [], `Errores de JavaScript: ${erroresPagina.join('; ')}`)
  } finally {
    await context.close()
    await browser.close()
  }
}

main().catch(error => {
  console.error(error.message)
  process.exitCode = 1
})
