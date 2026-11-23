// SPEC 042: comparar reglas reales de la SPA con el servicio Java y fixtures compartidos.
// Ejecutar primero mvn -Dtest=EquivalenciaVehiculosTest test en backend.
const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const base = process.env.SIGREC_E2E_URL || 'http://10.101.0.36:9000/sigrec/'
const raiz = path.resolve(__dirname, '../../backend')
const casos = JSON.parse(fs.readFileSync(path.join(raiz, 'src/test/resources/resumen-vehiculos-casos.json'), 'utf8'))
const resultados = JSON.parse(fs.readFileSync(path.join(raiz, 'target/resumen-vehiculos-resultados.json'), 'utf8'))

async function main () {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.goto(base)
    const calculados = await page.evaluate(async ({ casos, base }) => {
      const datos = await import(new URL('src/services/datos.js', base).href)
      const { usePerfil } = await import(new URL('src/composables/usePerfil.js', base).href)
      const { resumirEstadoVehiculos } = await import(new URL('src/services/vehiculos.js', base).href)
      return casos.map(caso => {
        datos.restablecerDatos()
        datos.db.cars.push(...caso.cars.map(c => ({ id: c.id, anulacion: c.anulado ? {} : null })))
        datos.db.vehiculos.push(...caso.vehiculos.map(v => ({
          ...v, anulacion: v.anulado ? {} : null,
          mantenimiento: v.monto == null ? null : { presupuestoEstimado: v.monto }
        })))
        const filas = usePerfil().carsEnAmbito.value.map(car =>
          resumirEstadoVehiculos(datos.db.vehiculos.filter(v => v.carId === car.id)))
        return {
          nombre: caso.nombre,
          resumen: Object.fromEntries(['requierenAtencion', 'presupuestoEstimado', 'sinEstimar']
            .map(clave => [clave, filas.reduce((suma, fila) => suma + fila[clave], 0)]))
        }
      })
    }, { casos, base })
    assert.deepEqual(calculados, resultados)
    console.log(`Equivalencia vehículos Java/SPA: ${calculados.length} escenarios aprobados`)
  } finally {
    await browser.close()
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
