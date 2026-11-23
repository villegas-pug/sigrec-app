// SPEC 038: recuperación del borrador y simulación/exportación desde la interfaz.
const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const base = process.env.SIGREC_E2E_URL || 'http://127.0.0.1:9000'

async function main () {
  assert.ok(process.env.SIGREC_DEMO_CENTRAL_PASSWORD, 'Falta SIGREC_DEMO_CENTRAL_PASSWORD')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true })
  try {
    const page = await context.newPage()
    await page.goto(`${base}/#/login`)
    await page.locator('[name=username]').fill('demo.central')
    await page.locator('[name=password]').fill(process.env.SIGREC_DEMO_CENTRAL_PASSWORD)
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await page.getByRole('button', { name: /Cerrar sesión/ }).waitFor({ timeout: 60000 })
    const codigo = await page.evaluate(async () => {
      const existentes = (await (await fetch('/api/v1/centros/jerarquia')).json()).data.cars.map(c => c.id)
      for (let a = 65; a < 91; a++) for (let b = 65; b < 91; b++) {
        const id = `E${String.fromCharCode(a, b)}`
        if (!existentes.includes(id)) return id
      }
      return null
    })
    assert.ok(codigo, 'No hay código disponible para validar el borrador')
    await page.goto(`${base}/#/centros`)
    await page.getByRole('button', { name: 'Registrar centro' }).click()
    const dialog = page.locator('.q-dialog:visible').last()
    await dialog.getByLabel('Nombre del centro *').fill('E2E borrador sin guardar')
    await dialog.getByLabel('Código *').fill(codigo)
    await dialog.getByLabel('Dirección *').fill('E2E dirección')
    await page.route('**/api/v1/centros', route => route.request().method() === 'POST' ? route.abort('failed') : route.continue())
    await dialog.getByRole('button', { name: 'Registrar centro' }).click()
    await page.getByText('No se pudo conectar con SIGREC. Intente nuevamente.').waitFor({ timeout: 15000 })
    assert.equal(await dialog.getByLabel('Nombre del centro *').inputValue(), 'E2E borrador sin guardar')
    assert.equal(await dialog.getByLabel('Código *').inputValue(), codigo)
    assert.equal(await dialog.getByLabel('Dirección *').inputValue(), 'E2E dirección')
    await page.unroute('**/api/v1/centros')
    await dialog.getByRole('button', { name: /Cancelar/ }).click()
    await page.getByRole('button', { name: /Descartar/ }).click()
    await page.goto(`${base}/#/necesidades`)
    const monto = page.getByLabel('Monto disponible (S/)')
    await monto.fill('1200')
    await page.getByText(/Saldo:/).first().waitFor({ timeout: 15000 })
    const simulador = page.locator('section[aria-label="Simulador de presupuesto"]')
    const [descarga] = await Promise.all([
      page.waitForEvent('download'),
      simulador.getByRole('button', { name: /Exportar CSV/ }).click()
    ])
    assert.ok(descarga.suggestedFilename().endsWith('.csv'))
    await page.getByRole('button', { name: /Cerrar sesión/ }).click()
    await page.locator('[name=username]').waitFor()
    console.log('Interfaz: borrador conservado, simulación y CSV aprobados')
  } finally {
    await context.close()
    await browser.close()
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
