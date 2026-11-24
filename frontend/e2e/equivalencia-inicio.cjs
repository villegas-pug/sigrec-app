// SPEC 044: compara el resumen de Inicio que calcula el backend (Java) con las reglas anteriores de la SPA sobre los mismos casos.
// Ejecutar primero `mvn -Dtest=EquivalenciaInicioTest test` en backend/ y tener el frontend en marcha (SIGREC_E2E_URL).
const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const base = process.env.SIGREC_E2E_URL || 'http://10.101.0.36:9000/sigrec/'
const raiz = path.resolve(__dirname, '../../backend')
const casos = JSON.parse(fs.readFileSync(path.join(raiz, 'src/test/resources/resumen-inicio-casos.json'), 'utf8'))
const resultados = JSON.parse(fs.readFileSync(path.join(raiz, 'target/resumen-inicio-resultados.json'), 'utf8'))

// Las cifras monetarias se comparan con 6 decimales (BigDecimal en Java, coma flotante en JS) y se descarta `undefined`.
const normalizar = (valor) => JSON.parse(JSON.stringify(valor, (clave, x) => (typeof x === 'number' ? Math.round(x * 1e6) / 1e6 : x)))

async function main () {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.goto(base)
    const comparados = await page.evaluate(async ({ casos, resultados, base }) => {
      const cargar = (ruta) => import(new URL(ruta, base).href)
      const datos = await cargar('src/services/datos.js')
      const { aplicarJerarquia } = await cargar('src/services/jerarquiaRest.js')
      const { aplicarInventario } = await cargar('src/services/inventarioRest.js')
      const { aplicarTiposBien } = await cargar('src/services/tiposBienRest.js')
      const { aplicarColeccion } = await cargar('src/services/coleccionRest.js')
      const { resumenPorCentro } = await cargar('src/services/situacion.js')
      const { avisosDeAtencion } = await cargar('src/services/atencion.js')
      const { itinerariosDeVehiculo, evaluarItinerario } = await cargar('src/services/combustible.js')
      const { usePerfil } = await cargar('src/composables/usePerfil.js')
      const { avisosDesdeResumen } = await cargar('src/services/avisosResumen.js')

      return casos.map((caso, i) => {
        // Estado de la SPA con las mismas colecciones que recibió el backend.
        datos.restablecerDatos()
        const d = caso.datos
        aplicarJerarquia(d.jerarquia)
        aplicarInventario(d.inventario)
        aplicarTiposBien(d.tiposBien, d.precios)
        for (const coleccion of ['servicios', 'vehiculos', 'itinerarios', 'combustible', 'mantenimientos']) aplicarColeccion(coleccion, d[coleccion])

        const fechaCorte = caso.hoy
        const anioServicios = Number(fechaCorte.slice(0, 4))
        const anio = anioServicios + 1
        const { carsEnAmbito, vehiculosEnAmbito } = usePerfil()
        const cars = carsEnAmbito.value
        const vehiculos = vehiculosEnAmbito.value
        const recorridos = vehiculos.flatMap((v) => itinerariosDeVehiculo(v.id).map((it) => evaluarItinerario(it, v)))
        const esperado = {
          filas: resumenPorCentro(cars, { fechaCorte, anioServicios, anio }).map((f) => ({
            ...f, car: { id: f.car.id, nombre: f.car.nombre, inmueble: f.car.inmueble ? { condicion: f.car.inmueble.condicion } : null }
          })),
          jerarquia: {
            centros: cars.length,
            modulos: cars.reduce((suma, c) => suma + datos.modulosDeCar(c.id).length, 0),
            ambientes: cars.reduce((suma, c) => suma + datos.ambientesDeCar(c.id).length, 0)
          },
          recorridos: { total: recorridos.length, noComparables: recorridos.filter((r) => r.estado === 'no_comparable').length },
          avisos: avisosDeAtencion({ cars, vehiculos, fechaCorte, anio, anioServicios })
        }

        // Resultado de Java, con los avisos redactados por la SPA.
        const java = resultados[i].resumen
        const nombres = new Map(java.filas.map((f) => [f.car.id, f.car.nombre]))
        const obtenido = {
          filas: java.filas,
          jerarquia: java.jerarquia,
          recorridos: java.recorridos,
          avisos: avisosDesdeResumen(java.avisos, (carId) => nombres.get(carId) ?? carId)
        }
        return { nombre: caso.nombre, esperado, obtenido }
      })
    }, { casos, resultados, base })

    for (const { nombre, esperado, obtenido } of comparados) {
      for (const parte of ['filas', 'jerarquia', 'recorridos']) {
        assert.deepEqual(normalizar(obtenido[parte]), normalizar(esperado[parte]), `${nombre}: ${parte}`)
      }
      for (const horizonte of ['ahora', 'proximos']) {
        assert.deepEqual(
          normalizar(obtenido.avisos[horizonte]).map((a) => a.id),
          normalizar(esperado.avisos[horizonte]).map((a) => a.id),
          `${nombre}: avisos ${horizonte} (identificadores y orden)`
        )
        assert.deepEqual(normalizar(obtenido.avisos[horizonte]), normalizar(esperado.avisos[horizonte]), `${nombre}: avisos ${horizonte}`)
      }
    }
    console.log(`Equivalencia Inicio Java/SPA: ${comparados.length} escenarios aprobados`)
  } finally {
    await browser.close()
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
