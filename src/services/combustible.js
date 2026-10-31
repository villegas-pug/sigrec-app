// Reglas de movilidad y combustible (RF-16, RF-17, RF-18).
import { db } from './datos'

/**
 * Evalúa un itinerario sin concluir irregularidades.
 * - La estimación usa solo la distancia realizada ÷ rendimiento de referencia (orientativo).
 * - Si falta distancia, rendimiento o consumo declarado, la comparación no es posible y se informa qué falta.
 * - Las cargas al vehículo no intervienen: cargar no equivale a consumir.
 */
export function evaluarItinerario (itinerario, vehiculo) {
  const rendimiento = vehiculo?.rendimientoKmL ?? null
  const realizado = itinerario.realizado
  const kmRealizados = realizado?.km ?? null
  const consumo = itinerario.consumoDeclaradoL ?? null
  const faltantes = []

  if (!realizado) faltantes.push('ejecución del recorrido')
  else if (kmRealizados == null) faltantes.push('distancia realizada')
  if (rendimiento == null) faltantes.push('rendimiento de referencia')
  if (realizado && consumo == null) faltantes.push('consumo declarado')

  const estimadoL = kmRealizados != null && rendimiento ? kmRealizados / rendimiento : null
  const kmPrevistos = itinerario.previsto?.km ?? null
  const estimadoPrevistoL = !realizado && kmPrevistos != null && rendimiento ? kmPrevistos / rendimiento : null

  let estado = 'no_comparable'
  if (!realizado) estado = 'solo_previsto'
  else if (estimadoL != null && consumo != null) estado = 'comparable'

  return {
    estado,
    kmRealizados,
    rendimiento,
    consumo,
    estimadoL,
    estimadoPrevistoL,
    diferenciaL: estado === 'comparable' ? consumo - estimadoL : null,
    faltantes
  }
}

export const itinerariosDeVehiculo = (vehiculoId) =>
  db.itinerarios.filter((i) => i.vehiculoId === vehiculoId).sort((a, b) => b.fecha.localeCompare(a.fecha))

export const registrosDeVehiculo = (vehiculoId) =>
  db.combustible.filter((r) => r.vehiculoId === vehiculoId).sort((a, b) => b.fecha.localeCompare(a.fecha))
