// SPEC 038: ciclo controlado del backend y comprobación de persistencia en Oracle.
// Requiere el puerto 8080 libre; el backend hijo se detiene al terminar.
const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const net = require('node:net')
const base = process.env.SIGREC_E2E_URL || 'http://127.0.0.1:9000'
const diario = path.resolve(__dirname, '../artifacts/e2e/escrituras-pendientes.json')
const backend = path.resolve(__dirname, '../../backend')
let hijo

async function detener () {
  if (!hijo || hijo.exitCode !== null) return
  const terminado = new Promise(resolve => hijo.once('exit', resolve))
  hijo.kill()
  await terminado
  hijo = null
}
async function iniciar () {
  await new Promise((resolve, reject) => {
    const prueba = net.createServer()
    prueba.once('error', () => reject(new Error('El puerto 8080 no está libre')))
    prueba.listen(8080, '127.0.0.1', () => prueba.close(resolve))
  })
  hijo = spawn('java', ['-jar', 'target/sigrec-0.1.0-SNAPSHOT.jar', '--server.address=127.0.0.1'], {
    cwd: backend, stdio: 'ignore', windowsHide: true,
    env: { ...process.env, SIGREC_DDL_AUTO: 'validate', SIGREC_SEED: 'never', SIGREC_IMPORTAR_DEMO: 'false' }
  })
  const limite = Date.now() + 90000
  while (Date.now() < limite) {
    if (hijo.exitCode !== null) throw new Error('El backend terminó durante el arranque')
    try {
      const r = await fetch('http://127.0.0.1:8080/api/v1/auth/csrf')
      if (r.ok) return
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  throw new Error('El backend no respondió dentro del plazo')
}
async function main () {
  assert.ok(process.env.SIGREC_DB_PASSWORD && process.env.SIGREC_DEMO_CENTRAL_PASSWORD, 'Faltan variables de Oracle o de la cuenta central')
  assert.ok(!fs.existsSync(diario), 'Hay un diario pendiente; ejecutar primero escrituras.cjs para recuperarlo')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  let registro
  try {
    await iniciar()
    const page = await context.newPage()
    await page.goto(`${base}/#/login`)
    await page.locator('[name=username]').fill('demo.central')
    await page.locator('[name=password]').fill(process.env.SIGREC_DEMO_CENTRAL_PASSWORD)
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await page.getByRole('button', { name: /Cerrar sesión/ }).waitFor({ timeout: 60000 })
    const existentes = await page.evaluate(async () => (await (await fetch('/api/v1/centros/jerarquia')).json()).data.cars.map(c => c.id))
    const disponibles = []
    for (let a = 65; a <= 90; a++) for (let b = 65; b <= 90; b++) {
      const id = `E${String.fromCharCode(a, b)}`
      if (!existentes.includes(id)) disponibles.push(id)
    }
    assert.ok(disponibles.length)
    registro = { codigo: disponibles[crypto.randomInt(disponibles.length)], nombre: `E2E-${crypto.randomBytes(8).toString('hex')}` }
    fs.mkdirSync(path.dirname(diario), { recursive: true })
    fs.writeFileSync(diario, JSON.stringify(registro), { flag: 'wx' })
    const operacion = async (ruta, body) => page.evaluate(async ({ ruta, body }) => {
      const csrf = (await (await fetch('/api/v1/auth/csrf')).json()).data
      return (await fetch(`/api/v1/${ruta}`, { method: 'POST', headers: { [csrf.header]: csrf.token, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).status
    }, { ruta, body })
    assert.equal(await operacion('centros', { id: registro.codigo, nombre: registro.nombre, inmueble: { direccion: `${registro.nombre} dirección`, condicion: 'propio' } }), 201)
    await page.reload()
    await page.getByRole('button', { name: /Cerrar sesión/ }).waitFor({ timeout: 60000 })
    const contiene = () => page.evaluate(async codigo => (await (await fetch('/api/v1/centros/jerarquia')).json()).data.cars.some(c => c.id === codigo && !c.anulacion), registro.codigo)
    assert.ok(await contiene(), 'No persistió tras recargar')
    await detener()
    await iniciar()
    await page.reload()
    await page.getByRole('button', { name: /Cerrar sesión/ }).waitFor({ timeout: 60000 })
    assert.ok(await contiene(), 'No persistió tras reiniciar el backend')
    assert.equal(await operacion(`centros/${registro.codigo}/anular`, { motivo: 'E2E: limpieza' }), 200)
    assert.equal(await operacion(`centros/${registro.codigo}/anular`, { motivo: 'E2E: limpieza' }), 200)
    fs.unlinkSync(diario)
    registro = null
    await page.getByRole('button', { name: /Cerrar sesión/ }).click()
    console.log('Persistencia: recarga, reinicio y limpieza idempotente aprobados')
  } finally {
    if (registro) console.error('Quedó un diario de limpieza: ejecutar escrituras.cjs con el backend disponible')
    await context.close()
    await browser.close()
    await detener()
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
