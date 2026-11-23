// SPEC 038: utilidades compartidas por las pruebas de formularios de Vue (sesión, REST, datos propios y diario de limpieza).
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const assert = require('node:assert/strict')

const base = process.env.SIGREC_E2E_URL || 'http://127.0.0.1:9000'
const diario = path.join(__dirname, '..', 'artifacts', 'e2e', 'escrituras-pendientes.json')

async function iniciarSesion (page, usuario, clave) {
  assert.ok(process.env[clave], `Falta ${clave}`)
  await page.goto(`${base}/#/login`)
  await page.locator('[name=username]').fill(usuario)
  await page.locator('[name=password]').fill(process.env[clave])
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await page.getByRole('button', { name: /Cerrar sesión/ }).waitFor({ timeout: 60000 })
}

// Llamadas REST con la sesión y el token CSRF del propio navegador.
function crearApi (page) {
  return async (metodo, ruta, cuerpo, esperado = 200) => {
    const r = await page.evaluate(async ([m, rt, c]) => {
      const t = (await (await fetch('/api/v1/auth/csrf')).json()).data
      const res = await fetch('/api/v1/' + rt, { method: m, headers: { 'Content-Type': 'application/json', [t.header]: t.token }, body: c ? JSON.stringify(c) : undefined })
      return { status: res.status, json: await res.json().catch(() => ({})) }
    }, [metodo, ruta, cuerpo])
    assert.equal(r.status, esperado, `${metodo} ${ruta}: ${r.json.message || 'respuesta inesperada'}`)
    return r.json.data
  }
}

// Datos propios: centro, módulo y dos ambientes con prefijo E2E, anotados en el diario que reutiliza la limpieza de escrituras.cjs.
async function prepararEscenario (api) {
  const actual = await api('GET', 'centros/jerarquia')
  const libres = []
  for (let a = 65; a <= 90; a++) for (let b = 65; b <= 90; b++) {
    const codigo = `E${String.fromCharCode(a, b)}`
    if (!actual.cars.some(c => c.id === codigo)) libres.push(codigo)
  }
  assert.ok(libres.length, 'No hay códigos libres para el centro E2E')
  const registro = { codigo: libres[crypto.randomInt(libres.length)], nombre: `E2E-${crypto.randomBytes(8).toString('hex')}` }
  fs.mkdirSync(path.dirname(diario), { recursive: true })
  fs.writeFileSync(diario, JSON.stringify(registro), { flag: 'wx' })
  await api('POST', 'centros', { id: registro.codigo, nombre: registro.nombre, inmueble: { direccion: `${registro.nombre} dirección`, condicion: 'propio' } }, 201)
  const modulo = (await api('POST', 'modulos', { carId: registro.codigo, nombre: `${registro.nombre} módulo`, tipo: 'comun', pisos: 1, condicion: 'bueno' }, 201)).registro
  const ambiente = (await api('POST', 'ambientes', { moduloId: modulo.id, nombre: `${registro.nombre} ambiente`, condicion: 'bueno' }, 201)).registro
  const destino = (await api('POST', 'ambientes', { moduloId: modulo.id, nombre: `${registro.nombre} destino`, condicion: 'bueno' }, 201)).registro
  return { registro, modulo, ambiente, destino }
}

module.exports = { base, diario, iniciarSesion, crearApi, prepararEscenario }
