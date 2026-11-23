// SPEC 042: comparar funciones reales de la SPA con los resultados Java de los mismos datos aislados.
// Ejecutar primero: mvn -Dtest=EquivalenciaJerarquiaTest test (en backend).
const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const base = process.env.SIGREC_E2E_URL || 'http://10.101.0.36:9000/sigrec/'
const raiz = path.resolve(__dirname, '../../backend')
const casos = JSON.parse(fs.readFileSync(path.join(raiz, 'src/test/resources/resumen-jerarquia-casos.json'), 'utf8'))
const resultados = JSON.parse(fs.readFileSync(path.join(raiz, 'target/resumen-jerarquia-resultados.json'), 'utf8'))

async function main () {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.goto(base)
    const calculados = await page.evaluate(async ({ casos, base }) => {
      const datos = await import(new URL('src/services/datos.js', base).href)
      const { usePerfil } = await import(new URL('src/composables/usePerfil.js', base).href)
      return casos.map(caso => {
        datos.restablecerDatos()
        for (const nombre of ['cars', 'modulos', 'ambientes']) {
          datos.db[nombre].push(...caso[nombre].map(({ anulado, ...registro }) => ({
            ...registro, anulacion: anulado ? { fecha: '2026-01-01' } : null
          })))
        }
        const cars = usePerfil().carsEnAmbito.value
        return {
          nombre: caso.nombre,
          resumen: {
            centros: cars.length,
            modulos: cars.reduce((total, car) => total + datos.modulosDeCar(car.id).length, 0),
            ambientes: cars.reduce((total, car) => total + datos.ambientesDeCar(car.id).length, 0)
          }
        }
      })
    }, { casos, base })
    assert.deepEqual(calculados, resultados)
    console.log(`Equivalencia jerarquía Java/SPA: ${calculados.length} escenarios aprobados`)
  } finally {
    await browser.close()
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
