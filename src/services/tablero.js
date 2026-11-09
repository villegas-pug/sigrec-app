// Vista ejecutiva de control (SPEC 010 §8): reúne, por centro y de forma consolidada, datos que ya se registran en otros módulos.
// No crea reglas nuevas: reutiliza las de infraestructura, inventario, mantenimientos, vehículos y servicios.
import { db, ambientesDeCar, vigente } from './datos'
import { conteoPorCondicion, elementosCriticos } from './infraestructura'
import { resumenInventario } from './inventario'
import { controlDe, controlesPendientes, fumigacionDeCentro, mantenimientosDe, resumirControles } from './mantenimientos'
import { avisosDeServicios, problemasRecurrentes, resumirAvisos, serviciosDeCar } from './servicios'
import { resumirEstadoVehiculos } from './vehiculos'
import { CONDICIONES_CRITICAS } from 'src/config/catalogos'

const sumar = (lista) => lista.reduce((suma, n) => suma + n, 0)

/**
 * Una fila por centro con el estado de su infraestructura, bienes, controles preventivos, vehículos y servicios.
 * Todas las cifras salen de las mismas funciones que usan las pantallas de detalle, de modo que coinciden con ellas.
 */
export function resumenPorCentro (cars, { fechaCorte, anioServicios }) {
  return cars.map((car) => {
    const ambientes = ambientesDeCar(car.id)
    const idsAmbientes = new Set(ambientes.map((a) => a.id))
    const bienes = db.bienes.filter((b) => idsAmbientes.has(b.ambienteId))
    const condiciones = conteoPorCondicion(bienes)
    const controles = resumirControles(controlesPendientes([car.id], fechaCorte))
    const servicios = serviciosDeCar(car.id)
    const avisos = avisosDeServicios(servicios, anioServicios, fechaCorte)
    const construccion = car.inmueble.construccion ?? {}

    return {
      car,
      estadoGeneral: construccion.estado ?? null,
      ambientesCriticos: ambientes.filter((a) => CONDICIONES_CRITICAS.includes(a.condicion)).length,
      elementosCriticos: elementosCriticos(construccion.estadoElementos).length + sumar(ambientes.map((a) => elementosCriticos(a.estadoElementos).length)),
      novedadesAbiertas: sumar(ambientes.map((a) => (a.novedades ?? []).filter((n) => vigente(n) && !n.atendida).length)),
      bienesActivos: sumar(Object.values(condiciones)),
      bienesMalos: condiciones.malo + condiciones.inservible,
      controles,
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

export function totalizarTablero (filas) {
  return {
    centros: filas.length,
    bienesActivos: sumar(filas.map((f) => f.bienesActivos)),
    bienesMalos: sumar(filas.map((f) => f.bienesMalos)),
    controlesVencidos: sumar(filas.map((f) => f.controles.vencidos)),
    controlesPorVencer: sumar(filas.map((f) => f.controles.porVencer)),
    extintoresFaltantes: sumar(filas.map((f) => f.controles.extintoresFaltantes)),
    vehiculosConAtencion: sumar(filas.map((f) => f.vehiculos.requierenAtencion)),
    presupuestoVehiculos: sumar(filas.map((f) => f.vehiculos.presupuestoEstimado)),
    vehiculosSinEstimar: sumar(filas.map((f) => f.vehiculos.sinEstimar))
  }
}

// De peor a mejor: el estado de un conjunto de controles es el de su peor integrante.
const ORDEN_ESTADOS = ['vencido', 'por_vencer', 'sin_programar', 'al_dia']

/**
 * Responde «¿qué centros tienen este equipo, en qué condición, cuándo recibió mantenimiento y dónde requiere atención?».
 * Un centro sin el equipo figura con cantidad cero (no se omite). Si tiene el equipo pero ningún control programado, el estado
 * es «sin programar», no «al día».
 */
export function consultaPorTipo (tipoId, cars, { anio, fechaCorte }) {
  return cars.map((car) => {
    const fila = resumenInventario({ carIds: [car.id], agruparPor: 'tipo', anio }).find((f) => f.clave === tipoId) ?? null
    const ids = new Set(
      ambientesDeCar(car.id).flatMap((a) => db.bienes.filter((b) => b.ambienteId === a.id && b.situacion === 'activo' && b.tipoId === tipoId).map((b) => b.id))
    )
    const estados = [...ids].map((bienId) => controlDe({ bienId }, fechaCorte).estado)
    const ultimo = mantenimientosDe({ carId: car.id }).find((m) => ids.has(m.bienId)) ?? null
    return {
      car,
      cantidad: fila?.cantidad ?? 0,
      porCondicion: fila?.porCondicion ?? null,
      enMalEstado: fila ? fila.porCondicion.malo + fila.porCondicion.inservible : 0,
      ultimoFecha: ultimo?.fecha ?? null,
      estadoControl: estados.length ? ORDEN_ESTADOS.find((e) => estados.includes(e)) : null,
      controlesVencidos: estados.filter((e) => e === 'vencido').length
    }
  })
}

// Un equipo requiere atención si hay unidades en mal estado o controles vencidos.
export const requiereAtencionEquipo = (fila) => fila.enMalEstado > 0 || fila.controlesVencidos > 0
