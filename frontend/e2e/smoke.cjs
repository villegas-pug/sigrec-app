// SPEC 038: comprobaciones de lectura con la API y las cuentas demo reales.
// Requiere Playwright disponible para Node y contraseñas en el entorno del proceso.
const { chromium } = require('playwright')
const assert = require('node:assert/strict')

const base = process.env.SIGREC_E2E_URL || 'http://127.0.0.1:9000'
const perfiles = [
  { usuario: 'demo.central', clave: 'SIGREC_DEMO_CENTRAL_PASSWORD', nombre: 'Equipo central USPNNA', rutas: ['centros', 'incidencias', 'necesidades', 'necesidades/inventario', 'servicios', 'movilidad/vehiculos', 'movilidad/itinerarios', 'movilidad/combustible'] },
  { usuario: 'demo.car', clave: 'SIGREC_DEMO_CAR_PASSWORD', nombre: 'Personal del CAR', rutas: ['centros', 'incidencias', 'necesidades', 'necesidades/inventario', 'servicios', 'movilidad/vehiculos', 'movilidad/itinerarios', 'movilidad/combustible'] },
  { usuario: 'demo.verifica', clave: 'SIGREC_DEMO_VERIFICA_PASSWORD', nombre: 'Verificación física', rutas: ['centros', 'incidencias'], denegadas: ['servicios', 'movilidad/combustible'] },
  { usuario: 'demo.chofer', clave: 'SIGREC_DEMO_CHOFER_PASSWORD', nombre: 'Chofer', rutas: ['movilidad/vehiculos', 'movilidad/itinerarios', 'movilidad/combustible'], denegadas: ['centros', 'servicios'] }
]

async function main () {
  for (const perfil of perfiles) assert.ok(process.env[perfil.clave], `Falta ${perfil.clave}`)
  const browser = await chromium.launch({ headless: true })
  let verificaciones = 0
  try {
    for (const perfil of perfiles) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      try {
        const page = await context.newPage()
        await page.goto(`${base}/#/login`)
        await page.locator('[name=username]').fill(perfil.usuario)
        await page.locator('[name=password]').fill(process.env[perfil.clave])
        await page.getByRole('button', { name: 'Iniciar sesión' }).click()
        await page.getByRole('button', { name: /Cerrar sesión/ }).waitFor({ timeout: 60000 })
        assert.ok((await page.locator('.sg-perfil').innerText()).includes(perfil.nombre))
        verificaciones++
        const rutasMenu = perfil.usuario === 'demo.chofer'
          ? ['movilidad/vehiculos', 'movilidad/itinerarios', 'movilidad/combustible', 'manual']
          : perfil.usuario === 'demo.verifica'
            ? ['centros', 'incidencias', 'manual']
            : ['inicio', 'centros', 'incidencias', 'necesidades', 'necesidades/inventario', 'servicios', 'movilidad/vehiculos', 'movilidad/itinerarios', 'movilidad/combustible', 'manual']
        const enlaces = await page.locator('#menu-principal a[href]').evaluateAll(items => items.map(a => a.getAttribute('href').replace(/^#\//, '')).sort())
        assert.deepEqual(enlaces, rutasMenu.sort(), `${perfil.usuario}: menú completo`)
        verificaciones++
        const permisos = await page.evaluate(async id => {
          const sesion = (await (await fetch('/api/v1/auth/me')).json()).data
          const { PERFILES } = await import('/src/config/perfiles.js')
          const esperado = PERFILES.find(p => p.id === id)
          const asignacion = sesion.asignaciones[0]
          return { rutas: asignacion.rutas, acciones: asignacion.acciones, rutasEsperadas: esperado.accesos, accionesEsperadas: esperado.acciones }
        }, perfil.usuario.split('.')[1])
        assert.deepEqual([...permisos.rutas].sort(), [...permisos.rutasEsperadas].sort(), `${perfil.usuario}: permisos de ruta`)
        const administrativas = perfil.usuario === 'demo.central' ? ['usuario.consultar', 'usuario.registrar', 'usuario.actualizar', 'usuario.desactivar', 'usuario.asignar'] : []
        assert.deepEqual([...permisos.acciones].sort(), [...permisos.accionesEsperadas, ...administrativas].sort(), `${perfil.usuario}: permisos de acción`)
        verificaciones += 2
        const csrfStatus = await page.evaluate(async () => (await fetch('/api/v1/auth/logout', { method: 'POST' })).status)
        assert.equal(csrfStatus, 403, `${perfil.usuario}: CSRF`)
        verificaciones++
        const endpoints = perfil.usuario === 'demo.chofer'
          ? ['vehiculos', 'itinerarios', 'combustible', 'mantenimientos']
          : perfil.usuario === 'demo.verifica'
            ? ['centros/jerarquia', 'bienes/datos', 'fotos', 'intervenciones', 'mantenimientos']
            : ['centros/jerarquia', 'bienes/datos', 'fotos', 'intervenciones', 'mantenimientos', 'servicios', 'vehiculos', 'itinerarios', 'combustible']
        for (const endpoint of endpoints) {
          const status = await page.evaluate(async path => (await fetch(`/api/v1/${path}`)).status, endpoint)
          assert.equal(status, 200, `${perfil.usuario}: GET ${endpoint}`)
          verificaciones++
        }
        if (perfil.usuario === 'demo.chofer') {
          const vehiculos = await page.evaluate(async () => (await (await fetch('/api/v1/vehiculos')).json()).data)
          assert.deepEqual(vehiculos.map(v => v.id), ['AMA-V01'], 'Ámbito del chofer')
          const status = await page.evaluate(async () => (await fetch('/api/v1/centros/jerarquia')).status)
          assert.equal(status, 403, 'Jerarquía denegada al chofer')
          verificaciones += 2
        }
        for (const ruta of rutasMenu) {
          await page.goto(`${base}/#/${ruta}`)
          await page.locator('.sg-page').first().waitFor({ timeout: 30000 })
          assert.equal(await page.getByText('Este módulo no está disponible', { exact: false }).count(), 0, `${perfil.usuario}: ${ruta}`)
          verificaciones++
          if (ruta === 'centros') {
            await page.getByRole('heading', { name: 'Gestión de centros' }).waitFor({ timeout: 30000 })
            assert.equal(await page.getByRole('button', { name: 'Registrar centro' }).count(), perfil.usuario === 'demo.central' ? 1 : 0, `${perfil.usuario}: alta de centro`)
            verificaciones++
          }
        }
        const todas = ['inicio', 'centros', 'incidencias', 'necesidades', 'necesidades/inventario', 'servicios', 'movilidad/vehiculos', 'movilidad/itinerarios', 'movilidad/combustible', 'manual']
        for (const ruta of todas.filter(r => !rutasMenu.includes(r))) {
          await page.goto(`${base}/#/${ruta}`)
          await page.getByText('Este módulo no está disponible', { exact: false }).waitFor({ timeout: 30000 })
          verificaciones++
        }
        await page.reload()
        await page.getByRole('button', { name: /Cerrar sesión/ }).waitFor({ timeout: 60000 })
        verificaciones++
        const duplicado = await browser.newContext()
        try {
          await duplicado.addCookies(await context.cookies())
          await page.getByRole('button', { name: /Cerrar sesión/ }).click()
          await page.locator('[name=username]').waitFor({ timeout: 30000 })
          const status = await duplicado.request.get(`${base}/api/v1/auth/me`)
          assert.equal(status.status(), 401, `${perfil.usuario}: sesión revocada`)
          verificaciones++
        } finally {
          await duplicado.close()
        }
        console.log(`${perfil.usuario}: correcto`)
      } finally {
        await context.close()
      }
    }
    console.log(`Comprobaciones aprobadas: ${verificaciones}`)
  } finally {
    await browser.close()
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1 })
