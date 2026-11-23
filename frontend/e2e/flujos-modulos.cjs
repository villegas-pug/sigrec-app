// SPEC 038: altas y acciones desde los formularios de Vue de servicios, movilidad, incidencias, precios e inventario.
// Los datos llevan el prefijo del diario E2E; la limpieza la ejecuta `escrituras.cjs` (recuperación del diario).
const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const { spawnSync } = require('node:child_process')
const path = require('node:path')
const { base, diario, iniciarSesion, crearApi, prepararEscenario } = require('./apoyo-ui.cjs')

const filtro = process.argv[2] || ''
let comprobaciones = 0
const ok = (cond, msg) => { assert.ok(cond, msg); comprobaciones++ }
const dialogo = page => page.locator('.q-dialog:visible').last()
const pagina = page => page.locator('#q-app')
const elegir = async (d, etiqueta, texto) => {
  await d.getByLabel(etiqueta).click()
  await d.page().getByRole('option', { name: texto }).first().click()
}

async function main () {
  const browser = await chromium.launch({ headless: true })
  const contexto = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await contexto.newPage()
  const api = crearApi(page)
  let escenario
  try {
    await iniciarSesion(page, 'demo.central', 'SIGREC_DEMO_CENTRAL_PASSWORD')
    escenario = await prepararEscenario(api)
    const { registro, ambiente, destino } = escenario
    const nombre = registro.nombre
    await page.reload()
    await page.getByRole('button', { name: /Cerrar sesión/ }).waitFor({ timeout: 60000 })
    const secciones = {
      async servicios () {
        await page.goto(`${base}/#/servicios?car=${registro.codigo}`)
        await pagina(page).getByRole('button', { name: /Registrar servicio/i }).first().click()
        const d = dialogo(page)
        await d.getByLabel('Proveedor *').fill(`${nombre} proveedor`)
        await d.getByRole('button', { name: /Registrar servicio/i }).click()
        await d.waitFor({ state: 'hidden', timeout: 20000 })
        const servicios = await api('GET', 'servicios')
        ok(servicios.some(s => s.proveedor === `${nombre} proveedor` && s.carId === registro.codigo), 'servicio registrado desde la interfaz')
        await pagina(page).getByRole('button', { name: /Informar interrupción/i }).first().click()
        const hecho = dialogo(page)
        await hecho.getByLabel('Detalle').fill(`${nombre} interrupción`)
        await hecho.getByRole('button', { name: /Registrar/i }).last().click()
        await hecho.waitFor({ state: 'hidden', timeout: 20000 })
        const propio = (await api('GET', 'servicios')).find(x => x.proveedor === `${nombre} proveedor`)
        ok(propio.hechos.some(h => h.detalle === `${nombre} interrupción` && !h.anulacion), 'hecho de servicio informado desde la interfaz')
      },
      async vehiculos () {
        await page.goto(`${base}/#/movilidad/vehiculos`)
        await pagina(page).getByRole('button', { name: /Registrar vehículo/i }).click()
        const d = dialogo(page)
        await elegir(d, 'Centro *', new RegExp(nombre))
        await d.getByLabel('Tipo *').fill('camioneta')
        await d.getByLabel('Combustible *').fill('gasolina')
        await d.getByLabel('Placa *').fill(`E2E${nombre.slice(-8)}`)
        await d.getByLabel('Chofer relacionado').fill(nombre)
        await d.getByRole('button', { name: /Registrar vehículo/i }).click()
        await d.waitFor({ state: 'hidden', timeout: 20000 })
        const vehiculos = await api('GET', 'vehiculos')
        ok(vehiculos.some(v => v.carId === registro.codigo && v.chofer === nombre), 'vehículo registrado desde la interfaz')
      },
      async itinerarios () {
        // El itinerario lo registra el chofer del vehículo AMA-V01 desde su propia sesión.
        const ctxChofer = await browser.newContext({ viewport: { width: 1440, height: 900 } })
        try {
          const chofer = await ctxChofer.newPage()
          await iniciarSesion(chofer, 'demo.chofer', 'SIGREC_DEMO_CHOFER_PASSWORD')
          await chofer.goto(`${base}/#/movilidad/itinerarios`)
          await pagina(chofer).getByRole('button', { name: /Registrar itinerario/i }).first().click()
          const d = dialogo(chofer)
          await d.getByLabel('Propósito *').fill(`${nombre} recorrido`)
          await d.getByLabel(/Destinos, separados por comas/).fill(`${nombre} destino`)
          await d.getByRole('button', { name: /Guardar/i }).click()
          await d.waitFor({ state: 'hidden', timeout: 20000 })
          const itinerarios = await crearApi(chofer)('GET', 'itinerarios')
          ok(itinerarios.some(i => i.proposito === `${nombre} recorrido` && i.vehiculoId === 'AMA-V01'), 'itinerario registrado por el chofer desde la interfaz')
          await chofer.goto(`${base}/#/centros`)
          await chofer.getByText(/Este módulo no está disponible para el perfil/).first().waitFor({ timeout: 15000 })
          ok(true, 'el chofer no accede a Gestión de centros')
        } finally {
          await ctxChofer.close()
        }
      },
      async combustible () {
        await page.goto(`${base}/#/movilidad/combustible`)
        await pagina(page).getByRole('button', { name: /Informar combustible/i }).click()
        const d = dialogo(page)
        await d.getByLabel('Cantidad *').fill('3')
        await d.getByLabel(/Sustento/).fill(`${nombre} consumo`)
        await d.getByRole('button', { name: /Registrar/i }).click()
        await page.waitForTimeout(3000)
        await d.waitFor({ state: 'hidden', timeout: 20000 })
        const consumos = await api('GET', 'combustible')
        const propios = consumos.filter(c => c.sustento === `${nombre} consumo`)
        ok(propios.length === 1, 'combustible informado desde la interfaz')
        for (const c of propios) await api('POST', `combustible/${c.id}/anular`, { motivo: `${nombre} limpieza` })
      },
      async incidencias () {
        await page.goto(`${base}/#/centros?ambiente=${ambiente.id}`)
        await page.waitForTimeout(2500)
        await pagina(page).getByRole('button', { name: /Registrar incidente/i }).first().click()
        const d = dialogo(page)
        await d.getByLabel('Motivo *').fill(`${nombre} incidencia`)
        await d.getByRole('button', { name: /Registrar incidente/i }).click()
        await d.waitFor({ state: 'hidden', timeout: 20000 })
        const inv = await api('GET', 'bienes/datos')
        ok(inv.eventos.some(e => e.titulo === `${nombre} incidencia`), 'incidencia registrada desde la interfaz')
      },
      async precios () {
        await page.goto(`${base}/#/necesidades`)
        await page.waitForTimeout(2500)
        await pagina(page).getByRole('button', { name: /Tipos de bien y precios/i }).click()
        const catalogo = dialogo(page)
        await catalogo.getByRole('button', { name: /Registrar tipo de bien/i }).click()
        const alta = page.locator('.q-dialog').filter({ has: page.getByLabel('Nombre *') })
        await alta.getByLabel('Nombre *').fill(`${nombre} tipo`)
        await elegir(alta, 'Categoría *', /./)
        await alta.getByRole('button', { name: /Registrar tipo/i }).click()
        await alta.waitFor({ state: 'hidden', timeout: 20000 })
        const tipos = await api('GET', 'catalogos/tipos-bien')
        ok(tipos.some(t => t.nombre === `${nombre} tipo`), 'tipo de bien registrado desde la interfaz')
        await catalogo.getByLabel('Buscar tipo de bien').fill(nombre)
        await catalogo.getByRole('button', { name: new RegExp('Informar precio de ' + nombre) }).first().click()
        const precio = page.locator('.q-dialog').filter({ has: page.getByLabel('Precio (S/) *') })
        await precio.getByLabel('Precio (S/) *').fill('18.5')
        await precio.getByLabel(/Procedencia/).fill(nombre)
        await precio.getByRole('button', { name: /Guardar precio/i }).click()
        await precio.waitFor({ state: 'hidden', timeout: 20000 })
        const precios = await api('GET', 'precios')
        ok(JSON.stringify(precios).includes(nombre), 'precio guardado desde la interfaz')
      },
      async inventario () {
        const bienId = `${nombre}-BIEN`
        const nombreBien = `${nombre} bien`
        await api('POST', 'bienes', { bien: { id: bienId, ambienteId: ambiente.id, tipoId: 'camarote', nombre: nombreBien, categoria: 'mobiliario', condicion: 'bueno', cantidad: 1 } }, 201)
        await page.reload()
        await page.getByRole('button', { name: /Cerrar sesión/ }).waitFor({ timeout: 60000 })
        await page.waitForTimeout(4000)
        const accion = async (opcion) => {
          await pagina(page).getByRole('button', { name: `Más acciones de ${nombreBien}`, exact: true }).first().click()
          await page.getByRole('menuitem', { name: opcion }).or(page.getByRole('button', { name: opcion })).last().click()
        }
        const bien = async () => (await api('GET', 'bienes/datos')).bienes.find(b => b.id === bienId)
        await page.goto(`${base}/#/centros?bien=${bienId}`)
        await page.waitForTimeout(2500)
        if (process.env.E2E_DEBUG) {
          console.log('DBG', page.url(), await pagina(page).getByRole('button').evaluateAll(l => l.map(x => (x.getAttribute('aria-label') || x.innerText).trim().replace(/\s+/g, ' ')).filter(Boolean)))
          console.log('TXT', (await page.locator('.q-page-container').innerText()).replace(/\n+/g, ' / ').slice(0, 400))
        }
        await accion('Informar verificación')
        let d = dialogo(page)
        await d.getByRole('radio', { name: 'Se encontraron diferencias' }).click()
        await d.getByRole('textbox', { name: 'Observación de la verificación' }).fill(`${nombre} diferencias`)
        await d.getByRole('button', { name: 'Informar verificación', exact: true }).last().click()
        await d.waitFor({ state: 'hidden', timeout: 20000 })
        const eventos = (await api('GET', 'bienes/datos')).eventos
        ok(eventos.some(e => e.tipo === 'verificacion' && e.bienIds?.includes(bienId)), 'verificación informada desde la interfaz')
        await accion('Trasladar a otro ambiente')
        d = dialogo(page)
        await d.getByRole('combobox', { name: /Ambiente de destino/ }).click()
        await page.getByRole('option', { name: new RegExp(`${nombre} destino`) }).first().click()
        await d.getByRole('button', { name: /^(Guardar|Trasladar.*)$/ }).last().click()
        await d.waitFor({ state: 'hidden', timeout: 20000 })
        ok((await bien()).ambienteId === destino.id, 'traslado aplicado desde la interfaz')
        await accion('Dar de baja')
        d = dialogo(page)
        await d.getByRole('textbox', { name: 'Motivo de la baja *' }).fill(`${nombre} baja`)
        await d.getByRole('button', { name: 'Dar de baja', exact: true }).last().click()
        await d.waitFor({ state: 'hidden', timeout: 20000 })
        const bajas = (await api('GET', 'bienes/datos')).eventos.filter(e => e.tipo === 'baja' && e.bienIds?.includes(bienId) && !e.anulacion)
        ok(bajas.length === 1, 'baja registrada desde la interfaz')
      }
,
      async ambiente () {
        await page.goto(`${base}/#/centros?ambiente=${ambiente.id}`)
        await page.waitForTimeout(3000)
        await pagina(page).getByRole('button', { name: `Acciones de ${nombre} ambiente` }).click()
        await page.getByText('Actualizar ambiente').click()
        const d = dialogo(page)
        const campo = d.getByLabel(/Nombre/).first()
        await campo.fill(`${nombre} ambiente editado`)
        await d.getByRole('button', { name: /Guardar|Actualizar/i }).last().click()
        await d.waitFor({ state: 'hidden', timeout: 20000 })
        const jerarquia = await api('GET', 'centros/jerarquia')
        ok(jerarquia.ambientes.some(a => a.id === ambiente.id && a.nombre === `${nombre} ambiente editado`), 'ambiente actualizado desde la interfaz')
      },
      async intervenciones () {
        await page.goto(`${base}/#/centros?ambiente=${ambiente.id}`)
        await page.waitForTimeout(3000)
        await pagina(page).getByRole('tab', { name: /Intervenciones/ }).click()
        await pagina(page).getByRole('button', { name: /Registrar intervención/i }).click()
        const d = dialogo(page)
        await d.getByLabel('Intervención *').fill(`${nombre} intervención`)
        await d.getByRole('button', { name: /Registrar/i }).last().click()
        await d.waitFor({ state: 'hidden', timeout: 20000 })
        const lista = await api('GET', 'intervenciones')
        ok(lista.some(i => i.ambienteId === ambiente.id && i.descripcion === `${nombre} intervención`), 'intervención registrada desde la interfaz')
      },
      async fotos () {
        await page.goto(`${base}/#/centros?ambiente=${ambiente.id}`)
        await page.waitForTimeout(3000)
        await pagina(page).getByRole('tab', { name: /Fotografías/ }).click()
        await pagina(page).getByRole('button', { name: /Incorporar fotografía/i }).click()
        const d = dialogo(page)
        const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aXcAAAAASUVORK5CYII=', 'base64')
        await d.locator('input[type=file]').setInputFiles({ name: 'e2e.png', mimeType: 'image/png', buffer: png })
        if (process.env.E2E_DEBUG) console.log('FOTO', await d.locator('input,textarea').evaluateAll(l => l.map(x => (x.getAttribute('aria-label') || x.name || x.type) + (x.value ? '=' + x.value : ''))), await d.getByRole('button').allInnerTexts())
        await d.getByLabel(/Título/).fill(`${nombre} foto`)
        await d.getByRole('button', { name: /Incorporar|Guardar|Registrar/i }).last().click()
        await d.waitFor({ state: 'hidden', timeout: 20000 })
        const lista = await api('GET', 'fotos')
        if (process.env.E2E_DEBUG) console.log('FOTOS', JSON.stringify(lista.filter(f => JSON.stringify(f).includes(nombre))))
        ok(lista.some(f => f.ambienteId === ambiente.id && f.titulo === `${nombre} foto`), 'fotografía incorporada desde la interfaz')
      },
      async bienes () {
        const bienId = `${nombre}-B2`
        const nombreBien = `${nombre} bien dos`
        await api('POST', 'bienes', { bien: { id: bienId, ambienteId: ambiente.id, tipoId: 'camarote', nombre: nombreBien, categoria: 'mobiliario', condicion: 'bueno', cantidad: 1 } }, 201)
        await page.reload()
        await page.getByRole('button', { name: /Cerrar sesión/ }).waitFor({ timeout: 60000 })
        await page.waitForTimeout(4000)
        const bien = async () => (await api('GET', 'bienes/datos')).bienes.find(b => b.id === bienId)
        const accion = async (opcion) => {
          await pagina(page).getByRole('button', { name: `Más acciones de ${nombreBien}`, exact: true }).first().click()
          await page.getByText(opcion, { exact: true }).last().click()
        }
        await page.goto(`${base}/#/centros?bien=${bienId}`)
        await page.waitForTimeout(3000)
        // Condición: «Actualizar información» con estado Regular.
        await pagina(page).getByRole('button', { name: /Actualizar información/i }).first().click()
        let d = dialogo(page)
        await d.getByRole('radio', { name: 'Regular' }).click()
        await d.getByLabel('Deterioro observado').fill(`${nombre} desgaste`)
        await d.getByRole('button', { name: /Guardar|Actualizar/i }).last().click()
        await d.waitFor({ state: 'hidden', timeout: 20000 })
        ok((await bien()).condicion === 'regular', 'condición actualizada desde la interfaz')
        // Anular y reactivar.
        await accion('Anular registro')
        d = dialogo(page)
        await d.getByRole('textbox', { name: /Motivo/ }).fill(`${nombre} anulación`)
        await d.getByRole('button', { name: /^Anular/ }).last().click()
        await d.waitFor({ state: 'hidden', timeout: 20000 })
        ok(!!(await bien()).anulacion, 'bien anulado desde la interfaz')
        await accion('Reactivar registro')
        d = dialogo(page)
        await d.getByRole('button', { name: 'Reactivar' }).last().click()
        await d.waitFor({ state: 'hidden', timeout: 20000 })
        ok(!(await bien()).anulacion, 'bien reactivado desde la interfaz')
      }
,
      async atencion () {
        const incidente = await api('POST', 'incidencias', { novedad: true, datos: { origen: { tipo: 'ambiente', id: ambiente.id }, tipo: 'humedad', titulo: `${nombre} novedad`, fecha: '2026-01-15' } }, 201)
        await page.reload()
        await page.getByRole('button', { name: /Cerrar sesión/ }).waitFor({ timeout: 60000 })
        await page.goto(`${base}/#/centros?ambiente=${ambiente.id}`)
        await page.waitForTimeout(3500)
        await pagina(page).getByRole('tab', { name: /Incidencias/ }).click()
        await pagina(page).getByRole('button', { name: `Acciones de la novedad ${nombre} novedad` }).click()
        if (process.env.E2E_DEBUG) console.log('MENU NOV', await page.locator('.q-menu:visible .q-item').allInnerTexts())
        await page.getByText('Marcar como atendida').last().click()
        const d = dialogo(page)
        if (process.env.E2E_DEBUG) console.log('ATENDER', await d.locator('input,textarea').evaluateAll(l => l.map(x => (x.getAttribute('aria-label') || x.name || x.type) + (x.value ? '=' + x.value : ''))), await d.getByRole('button').allInnerTexts())
        await d.getByLabel('Cómo se atendió').fill(`${nombre} atención`)
        await d.getByRole('button', { name: /Marcar como atendida/i }).last().click()
        await d.waitFor({ state: 'hidden', timeout: 20000 })
        const eventos = (await api('GET', 'bienes/datos')).eventos
        ok(eventos.some(e => e.id === incidente.id && e.atencion), 'novedad atendida desde la interfaz')
      },
      async reposicion () {
        const bienId = `${nombre}-B3`
        await api('POST', 'bienes', { bien: { id: bienId, ambienteId: ambiente.id, tipoId: 'camarote', nombre: `${nombre} bien tres`, categoria: 'mobiliario', condicion: 'bueno', cantidad: 1 } }, 201)
        await api('POST', `incidencias/bajas/${bienId}`, { motivo: `${nombre} baja previa`, fecha: '2026-01-17' }, 201)
        await page.reload()
        await page.getByRole('button', { name: /Cerrar sesión/ }).waitFor({ timeout: 60000 })
        await page.goto(`${base}/#/centros?bien=${bienId}`)
        await page.waitForTimeout(3500)
        if (process.env.E2E_DEBUG) console.log('BTN BAJA', await pagina(page).getByRole('button').evaluateAll(l => l.map(x => (x.getAttribute('aria-label') || x.innerText).trim().replace(/s+/g, ' ')).filter(Boolean)))
        await pagina(page).getByRole('button', { name: /Registrar reposición/i }).first().click()
        const d = dialogo(page)
        if (process.env.E2E_DEBUG) console.log('REPOS', await d.locator('input,textarea').evaluateAll(l => l.map(x => (x.getAttribute('aria-label') || x.name || x.type) + (x.value ? '=' + x.value : ''))), await d.getByRole('button').allInnerTexts())
        await d.getByLabel(/Rótulo|Código/i).first().fill(`${nombre}-REP`)
        await d.getByLabel(/Nombre/).first().fill(`${nombre} reposición`)
        await d.getByRole('button', { name: /Registrar reposición/i }).last().click()
        await d.waitFor({ state: 'hidden', timeout: 20000 })
        const reposiciones = (await api('GET', 'bienes/datos')).eventos.filter(e => e.tipo === 'reposicion' && e.bienAnteriorId === bienId && !e.anulacion)
        ok(reposiciones.length === 1, 'reposición registrada desde la interfaz')
      }
,
      async pagos () {
        const servicio = await api('POST', 'servicios', { carId: registro.codigo, tipo: 'agua', periodicidad: 'mensual', datos: { proveedor: `${nombre} proveedor` } }, 201)
        await page.reload()
        await page.getByRole('button', { name: /Cerrar sesión/ }).waitFor({ timeout: 60000 })
        await page.goto(`${base}/#/servicios?car=${registro.codigo}`)
        await page.waitForTimeout(3500)
        const celda = () => pagina(page).getByRole('button', { name: /Agua, Ene/ }).first()
        await celda().click()
        let d = dialogo(page)
        if (process.env.E2E_DEBUG) console.log('PERIODO', await d.locator('input,textarea').evaluateAll(l => l.map(x => (x.getAttribute('aria-label') || x.name || x.type) + (x.value ? '=' + x.value : ''))), await d.getByRole('button').allInnerTexts())
        await d.getByRole('radio', { name: /Pagado/ }).click()
        await page.waitForTimeout(500)
        if (process.env.E2E_DEBUG) console.log('PAGADO', await d.locator('input,textarea').evaluateAll(l => l.map(x => (x.getAttribute('aria-label') || x.name || x.type) + (x.value ? '=' + x.value : ''))))
        await d.getByLabel('Fecha de pago').fill('2026-01-15')
        await d.getByLabel(/Importe/).fill('20')
        await d.getByLabel(/Sustento|Comprobante/).fill(`${nombre} pago`)
        await d.getByRole('button', { name: /Guardar/i }).last().click()
        await d.waitFor({ state: 'hidden', timeout: 20000 })
        const periodo = async () => (await api('GET', 'servicios')).find(x => x.id === servicio.id)
        const despues = JSON.stringify(await periodo())
        ok(despues.includes(`${nombre} pago`), 'pago informado desde la interfaz')
        // Corrección: el mismo período vuelve a «Pendiente conocido» con motivo.
        await celda().click()
        d = dialogo(page)
        await d.getByRole('button', { name: /Corregir situación/i }).click()
        d = dialogo(page)
        await d.getByRole('radio', { name: /Pendiente conocido/ }).click()
        await d.getByLabel(/Motivo/).first().fill(`${nombre} corrección`)
        await d.getByRole('button', { name: /Guardar/i }).last().click()
        await d.waitFor({ state: 'hidden', timeout: 20000 })
        ok(JSON.stringify(await periodo()).includes(`${nombre} corrección`), 'corrección de período desde la interfaz')
      }
,
      async consumo () {
        const ctxChofer = await browser.newContext({ viewport: { width: 1440, height: 900 } })
        try {
          const chofer = await ctxChofer.newPage()
          await iniciarSesion(chofer, 'demo.chofer', 'SIGREC_DEMO_CHOFER_PASSWORD')
          await chofer.goto(`${base}/#/movilidad/itinerarios`)
          await pagina(chofer).getByRole('button', { name: /Registrar itinerario/i }).first().click()
          let d = dialogo(chofer)
          await d.getByLabel('Propósito *').fill(`${nombre} recorrido`)
          await d.getByLabel(/Destinos, separados por comas/).fill(`${nombre} destino`)
          await d.getByLabel('Salida').fill('08:00')
          await d.getByLabel('Llegada').fill('09:00')
          await d.getByLabel(/Distancia/).fill('12')
          await d.getByRole('button', { name: /Guardar/i }).click()
          await d.waitFor({ state: 'hidden', timeout: 20000 })
          const propio = (await crearApi(chofer)('GET', 'itinerarios')).find(x => x.proposito === `${nombre} recorrido`)
          await chofer.goto(`${base}/#/movilidad/itinerarios`)
          await chofer.waitForTimeout(2500)
          await pagina(chofer).getByRole('button', { name: `Acciones del itinerario ${propio.id}` }).click()
          if (process.env.E2E_DEBUG) console.log('MENU IT', await chofer.locator('.q-menu:visible .q-item').allInnerTexts())
          await chofer.getByText(/Informar ejecución/i).last().click()
          d = dialogo(chofer)
          await d.getByLabel('Distancia (km)').fill('12')
          await d.getByRole('button', { name: /Guardar/i }).click()
          await d.waitFor({ state: 'hidden', timeout: 20000 })
          if (process.env.E2E_DEBUG) console.log('ITIN', JSON.stringify((await crearApi(chofer)('GET', 'itinerarios')).filter(i => i.proposito === `${nombre} recorrido`)))
          await chofer.goto(`${base}/#/movilidad/combustible`)
          await pagina(chofer).getByRole('button', { name: /Informar combustible/i }).click()
          d = dialogo(chofer)
          await d.getByRole('radio', { name: /Consumo declarado/ }).click()
          if (process.env.E2E_DEBUG) console.log('CONSUMO', await d.locator('input,textarea,[role=combobox]').evaluateAll(l => l.map(x => (x.getAttribute('aria-label') || x.name || x.type) + (x.value ? '=' + x.value : ''))))
          await d.getByRole('combobox').first().click()
          await chofer.getByRole('option', { name: new RegExp(nombre) }).first().click()
          await d.getByLabel('Cantidad *').fill('2')
          await d.getByLabel(/Sustento/).fill(`${nombre} consumo`)
          await d.getByRole('button', { name: /Registrar/i }).last().click()
          await d.waitFor({ state: 'hidden', timeout: 20000 })
          const consumos = await crearApi(chofer)('GET', 'combustible')
          ok(consumos.some(c => c.sustento === `${nombre} consumo` && c.itinerarioId), 'consumo declarado informado por el chofer desde la interfaz')
        } finally {
          await ctxChofer.close()
        }
      },
      async mapa () {
        await page.goto(`${base}/#/movilidad/itinerarios`)
        await pagina(page).getByRole('button', { name: /Registrar itinerario/i }).first().click()
        const d = dialogo(page)
        await d.getByRole('radio', { name: /Definir en mapa/ }).click()
        await d.locator('.leaflet-container, .mapa, [class*=map], canvas').first().waitFor({ timeout: 20000 })
        ok(true, 'el selector de trazado en mapa se muestra desde la interfaz')
        await d.getByRole('button', { name: /Cancelar/i }).click()
        const descartar = page.getByRole('button', { name: /Descartar/ })
        if (await descartar.isVisible().catch(() => false)) await descartar.click()
      },
      async csv () {
        await page.reload()
        await page.getByRole('button', { name: /Cerrar sesión/ }).waitFor({ timeout: 60000 })
        await page.goto(`${base}/#/necesidades`)
        await page.getByText(/Saldo|Monto disponible/).first().waitFor({ timeout: 20000 })
        await page.getByLabel('Monto disponible (S/)').fill('1200')
        await page.getByText(/Saldo:/).first().waitFor({ timeout: 15000 })
        const [descarga] = await Promise.all([
          page.waitForEvent('download'),
          pagina(page).locator('section[aria-label="Simulador de presupuesto"]').getByRole('button', { name: /Exportar CSV/ }).click()
        ])
        const ruta = await descarga.path()
        const texto = require("node:fs").readFileSync(ruta, "utf8").replace(/^\uFEFF/, "")
        const lineas = texto.split(/\r?\n/).filter(Boolean)
        ok(lineas.length >= 2, 'el CSV tiene encabezado y filas')
        ok(lineas[0].includes(';') || lineas[0].includes(','), 'el CSV usa un separador de columnas')
      }
,
      async centro () {
        await page.goto(`${base}/#/centros?car=${registro.codigo}`)
        await page.waitForTimeout(3500)
        if (process.env.E2E_DEBUG) console.log('CENTRO BTN', await pagina(page).getByRole('button').evaluateAll(l => l.map(x => (x.getAttribute('aria-label') || x.innerText).trim().replace(/s+/g, ' ')).filter(Boolean)))
        await pagina(page).getByRole('button', { name: `Acciones de ${nombre}`, exact: true }).click()
        if (process.env.E2E_DEBUG) console.log('MENU CENTRO', await page.locator('.q-menu:visible .q-item').allInnerTexts())
        await page.locator('.q-menu:visible .q-item').filter({ hasText: /Actualizar/ }).first().click()
        let d = dialogo(page)
        if (process.env.E2E_DEBUG) console.log('CENTRO EDIT', await d.locator('input,textarea,[role=combobox]').evaluateAll(l => l.map(x => (x.getAttribute('aria-label') || x.name || x.type) + (x.value ? '=' + x.value : ''))))
        await d.getByLabel('Dirección', { exact: true }).fill(`${nombre} dirección editada`)
        await d.getByRole('button', { name: /Guardar|Actualizar/i }).last().click()
        await d.waitFor({ state: 'hidden', timeout: 20000 })
        const car = (await api('GET', 'centros/jerarquia')).cars.find(c => c.id === registro.codigo)
        ok(JSON.stringify(car).includes(`${nombre} dirección editada`), 'centro actualizado desde la interfaz')
        await pagina(page).getByRole('tab', { name: /Seguridad y mantenimiento/ }).click()
        await pagina(page).getByRole('button', { name: /Registrar fumigación/i }).first().click()
        d = dialogo(page)
        if (process.env.E2E_DEBUG) console.log('FUMIG', await d.locator('input,textarea,[role=combobox]').evaluateAll(l => l.map(x => (x.getAttribute('aria-label') || x.name || x.type) + (x.value ? '=' + x.value : ''))), await d.getByRole('button').allInnerTexts())
        await d.getByLabel(/Detalle|Observaciones|Descripción/i).first().fill(`${nombre} mantenimiento`)
        await d.getByRole('button', { name: /Registrar/i }).last().click()
        await d.waitFor({ state: 'hidden', timeout: 20000 })
        const lista = await api('GET', 'mantenimientos')
        ok(lista.some(m => m.carId === registro.codigo && m.detalle === `${nombre} mantenimiento`), 'fumigación registrada desde la interfaz')
      }
    }
    for (const [clave, fn] of Object.entries(secciones)) {
      if (filtro && filtro !== clave) continue
      await fn()
      console.log('OK', clave)
    }
  } finally {
    await contexto.close()
    await browser.close()
    if (fs.existsSync(diario)) {
      const r = spawnSync(process.execPath, [path.join(__dirname, 'escrituras.cjs')], { encoding: 'utf8', env: process.env })
      if (r.status !== 0) { console.error('Limpieza por diario:', (r.stdout + r.stderr).slice(-400)); process.exitCode = 1 }
    }
  }
  console.log(`Flujos de módulos: ${comprobaciones} comprobaciones aprobadas`)
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
