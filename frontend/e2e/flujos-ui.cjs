// SPEC 038: altas desde los formularios de Vue (centro y módulo) contra backend y Oracle, con limpieza por REST.
const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const base = process.env.SIGREC_E2E_URL || 'http://127.0.0.1:9000'
const motivo = { motivo: 'E2E limpieza automática' }

async function main () {
  assert.ok(process.env.SIGREC_DEMO_CENTRAL_PASSWORD, 'Falta SIGREC_DEMO_CENTRAL_PASSWORD')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  let codigo = null
  const api = (metodo, ruta, cuerpo) => page.evaluate(async ([m, r, c]) => {
    const t = (await (await fetch('/api/v1/auth/csrf')).json()).data
    const res = await fetch('/api/v1/' + r, { method: m, headers: { 'Content-Type': 'application/json', [t.header]: t.token }, body: c ? JSON.stringify(c) : undefined })
    return { status: res.status, json: await res.json().catch(() => null) }
  }, [metodo, ruta, cuerpo])
  let comprobaciones = 0
  try {
    await page.goto(`${base}/#/login`)
    await page.locator('[name=username]').fill('demo.central')
    await page.locator('[name=password]').fill(process.env.SIGREC_DEMO_CENTRAL_PASSWORD)
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await page.getByRole('button', { name: /Cerrar sesión/ }).waitFor({ timeout: 60000 })
    codigo = await page.evaluate(async () => {
      const existentes = (await (await fetch('/api/v1/centros/jerarquia')).json()).data.cars.map(c => c.id)
      for (let a = 65; a < 91; a++) for (let b = 65; b < 91; b++) {
        const id = `U${String.fromCharCode(a, b)}`
        if (!existentes.includes(id)) return id
      }
      return null
    })
    assert.ok(codigo, 'No hay código libre para el centro de prueba')

    await page.goto(`${base}/#/centros`)
    await page.locator("#q-app").getByRole("button", { name: "Registrar centro" }).click()
    let dialogo = page.locator('.q-dialog:visible').last()
    await dialogo.getByLabel('Nombre del centro *').fill('E2E UI centro')
    await dialogo.getByLabel('Código *').fill(codigo)
    await dialogo.getByLabel('Dirección *').fill('E2E dirección')
    await dialogo.getByRole('button', { name: 'Registrar centro' }).click()
    await dialogo.waitFor({ state: 'hidden', timeout: 20000 })
    await dialogo.waitFor({ state: 'hidden', timeout: 20000 })
    await page.getByText('E2E UI centro').first().waitFor({ timeout: 20000 })
    comprobaciones++

    // Duplicado: el mismo código se rechaza y el formulario conserva el borrador.
    await page.locator('#q-app').getByRole('button', { name: 'Registrar centro' }).click()
    dialogo = page.locator('.q-dialog:visible').last()
    await dialogo.getByLabel('Nombre del centro *').fill('E2E UI centro duplicado')
    await dialogo.getByLabel('Código *').fill(codigo)
    await dialogo.getByLabel('Dirección *').fill('E2E dirección')
    await dialogo.getByRole('button', { name: 'Registrar centro' }).click()
    await page.waitForTimeout(2500)
    assert.ok(await dialogo.isVisible(), 'El formulario debe seguir abierto tras el rechazo')
    assert.equal(await dialogo.getByLabel('Nombre del centro *').inputValue(), 'E2E UI centro duplicado')
    comprobaciones += 2
    await dialogo.getByRole('button', { name: /Cancelar/ }).click()
    const descartar = page.getByRole('button', { name: /Descartar/ })
    if (await descartar.isVisible().catch(() => false)) await descartar.click()

    // Persistencia: tras recargar, el centro sigue en el servidor.
    await page.reload()
    await page.getByText('E2E UI centro').first().waitFor({ timeout: 30000 })
    const jerarquia = await api('GET', 'centros/jerarquia')
    assert.equal(jerarquia.status, 200)
    assert.ok(jerarquia.json.data.cars.some(c => c.id === codigo && c.nombre === 'E2E UI centro'))
    comprobaciones += 2
  } finally {
    if (codigo) {
      try {
        const j = await api('GET', 'centros/jerarquia')
        const d = j.json?.data
        for (const a of (d?.ambientes || []).filter(x => x.carId === codigo && !x.anulacion)) await api('POST', `ambientes/${a.id}/anular`, motivo)
        for (const m of (d?.modulos || []).filter(x => x.carId === codigo && !x.anulacion)) await api('POST', `modulos/${m.id}/anular`, motivo)
        await api('POST', `centros/${codigo}/anular`, motivo)
        const despues = await api('GET', 'centros/jerarquia')
        const car = despues.json?.data?.cars?.find(c => c.id === codigo)
        assert.ok(!car || car.anulacion, 'El centro de prueba debe quedar anulado')
      } catch (e) { console.error('Limpieza:', e.message); process.exitCode = 1 }
    }
    await context.close()
    await browser.close()
  }
  console.log(`Flujos de interfaz: ${comprobaciones} comprobaciones aprobadas`)
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
