// Situación por centro (SPEC 011, antes «Tablero de control» de la SPEC 010 §8): una fila por centro que reúne necesidades,
// infraestructura, bienes, controles preventivos, vehículos y servicios. No crea reglas nuevas: reutiliza las de cada módulo,
// de modo que sus cifras coinciden con las pantallas de detalle. Inicio es la única pantalla que la muestra.
import { db, ambientesDeCar, vigente } from './datos'
import { conteoPorCondicion, elementosCriticos } from './infraestructura'
import { calcularNecesidades, consolidarPorCar } from './necesidades'
import { controlesPendientes, fumigacionDeCentro, resumirControles } from './mantenimientos'
import { avisosDeServicios, problemasRecurrentes, resumirAvisos, serviciosDeCar } from './servicios'
import { resumirEstadoVehiculos } from './vehiculos'
import { CONDICIONES_CRITICAS } from 'src/config/catalogos'

const sumar = (lista) => lista.reduce((suma, n) => suma + n, 0)

// Novedades vigentes sin atender de un ambiente.
export const novedadesAbiertas = (ambiente) => (ambiente.novedades ?? []).filter((n) => vigente(n) && !n.atendida)

/**
 * Una fila por centro. `anio` es el año de revisión de las necesidades; `anioServicios`, el de los períodos de pago.
 * - `bienesActivos` y `bienesMalos` cuentan unidades (como Inventario); `registrosActivos` y `verificados`, registros (como Inicio).
 */
export function resumenPorCentro (cars, { fechaCorte, anioServicios, anio }) {
  const necesidades = consolidarPorCar(calcularNecesidades({ anio, carIds: cars.map((c) => c.id) }), cars)

  return cars.map((car, i) => {
    const ambientes = ambientesDeCar(car.id)
    const idsAmbientes = new Set(ambientes.map((a) => a.id))
    const bienes = db.bienes.filter((b) => idsAmbientes.has(b.ambienteId))
    const activos = bienes.filter((b) => b.situacion === 'activo')
    const condiciones = conteoPorCondicion(bienes)
    const servicios = serviciosDeCar(car.id)
    const avisos = avisosDeServicios(servicios, anioServicios, fechaCorte)
    const construccion = car.inmueble.construccion ?? {}
    const n = necesidades[i]

    return {
      car,
      necesidades: { cantidad: n.cantidad, importeConocido: n.importeConocido, sinValorar: n.sinValorar, infraestructura: n.infraestructura, atendidas: n.atendidas },
      estadoGeneral: construccion.estado ?? null,
      ambientesCriticos: ambientes.filter((a) => CONDICIONES_CRITICAS.includes(a.condicion)).length,
      elementosCriticos: elementosCriticos(construccion.estadoElementos).length + sumar(ambientes.map((a) => elementosCriticos(a.estadoElementos).length)),
      novedadesAbiertas: sumar(ambientes.map((a) => novedadesAbiertas(a).length)),
      bienesActivos: sumar(Object.values(condiciones)),
      bienesMalos: condiciones.malo + condiciones.inservible,
      registrosActivos: activos.length,
      verificados: activos.filter((b) => b.verificacion).length,
      controles: resumirControles(controlesPendientes([car.id], fechaCorte)),
      fumigacion: fumigacionDeCentro(car.id, fechaCorte).estado,
      vehiculos: resumirEstadoVehiculos(db.vehiculos.filter((v) => v.carId === car.id)),
      servicios: {
        ...resumirAvisos(avisos),
        renovaciones: avisos.filter((a) => a.clase.startsWith('renovacion')).length,
        recurrentes: servicios.filter((s) => problemasRecurrentes(s, fechaCorte).recurrente).length
      }
    }
  })
}

export function totalizarSituacion (filas) {
  const total = (fn) => sumar(filas.map(fn))
  return {
    centros: filas.length,
    necesidades: total((f) => f.necesidades.cantidad),
    importeConocido: total((f) => f.necesidades.importeConocido),
    sinValorar: total((f) => f.necesidades.sinValorar),
    bienesActivos: total((f) => f.bienesActivos),
    bienesMalos: total((f) => f.bienesMalos),
    registrosActivos: total((f) => f.registrosActivos),
    verificados: total((f) => f.verificados),
    controlesVencidos: total((f) => f.controles.vencidos),
    controlesPorVencer: total((f) => f.controles.porVencer),
    extintoresFaltantes: total((f) => f.controles.extintoresFaltantes),
    vehiculosConAtencion: total((f) => f.vehiculos.requierenAtencion),
    presupuestoVehiculos: total((f) => f.vehiculos.presupuestoEstimado),
    vehiculosSinEstimar: total((f) => f.vehiculos.sinEstimar)
  }
}
