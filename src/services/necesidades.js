// Reglas de necesidades y presupuesto (RF-05, RF-06, RF-19, RF-20, RF-21).
import { db, bienPorId, tipoPorId, ubicacionDeBien, ubicacionDeAmbiente } from './datos'
import { INCIDENTES, TIPOS_EVENTO } from 'src/config/catalogos'

const enAmbito = (carIds, carId) => !carIds || carIds.includes(carId)

// Año en que se cumple la vida útil; null si faltan antecedentes.
export function finVidaUtil (bien) {
  const fechaAdq = bien.adquisicion?.fecha
  if (!fechaAdq || bien.vidaUtilAnios == null) return null
  return Number(fechaAdq.slice(0, 4)) + bien.vidaUtilAnios
}

export function antecedentesFaltantes (bien) {
  const faltantes = []
  if (!bien.adquisicion?.fecha) faltantes.push('fecha de adquisición')
  if (bien.vidaUtilAnios == null) faltantes.push('vida útil')
  return faltantes
}

export function incidentesConNecesidad (bienId) {
  return db.eventos.filter((e) => INCIDENTES.includes(e.tipo) && e.reportaNecesidad && e.bienIds?.includes(bienId))
}

/**
 * Calcula las necesidades del año para los CAR indicados (null = todos).
 * - Una sola necesidad por bien activo, con todos sus motivos (vida útil e incidentes).
 * - Sin fecha de adquisición o vida útil no se calcula renovación; se informa como antecedente insuficiente.
 * - Sin precio referencial el importe es null («sin valorar»), nunca cero.
 * - Las reposiciones registradas se listan como atendidas y no suman.
 */
export function calcularNecesidades ({ anio, carIds = null }) {
  const pendientes = []
  const insuficientes = []

  for (const bien of db.bienes) {
    if (bien.situacion !== 'activo') continue
    const ubicacion = ubicacionDeBien(bien)
    if (!enAmbito(carIds, ubicacion.car.id)) continue

    const faltantes = antecedentesFaltantes(bien)
    if (faltantes.length) insuficientes.push({ bien, ubicacion, faltantes })

    const motivos = []
    const fin = finVidaUtil(bien)
    if (fin != null && fin <= anio) {
      motivos.push({ clase: 'vida_util', texto: `Vida útil cumplida en ${fin}`, fecha: null })
    }
    for (const evento of incidentesConNecesidad(bien.id)) {
      motivos.push({ clase: 'incidente', texto: `${TIPOS_EVENTO[evento.tipo].label}: ${evento.titulo}`, fecha: evento.fecha })
    }
    if (!motivos.length) continue

    const tipo = tipoPorId(bien.tipoId)
    const cantidad = bien.cantidad ?? 1
    const precioUnitario = tipo?.precio ?? null
    pendientes.push({
      id: bien.id,
      bien,
      tipo,
      ubicacion,
      motivos,
      faltantes,
      clase: motivos.some((m) => m.clase === 'incidente') ? 'reposicion' : 'renovacion',
      cantidad,
      precioUnitario,
      importe: precioUnitario == null ? null : precioUnitario * cantidad
    })
  }

  const infraestructura = db.ambientes.flatMap((ambiente) => {
    const ubicacion = ubicacionDeAmbiente(ambiente.id)
    if (!enAmbito(carIds, ubicacion.car.id)) return []
    return (ambiente.novedades ?? [])
      .filter((n) => n.requiereEvaluacion && !n.atendida)
      .map((novedad) => ({ id: novedad.id, novedad, ubicacion }))
  })

  const atendidas = db.eventos
    .filter((e) => e.tipo === 'reposicion')
    .map((evento) => {
      const anterior = bienPorId(evento.bienAnteriorId)
      return { id: evento.id, evento, anterior, nuevo: bienPorId(evento.bienNuevoId), ubicacion: ubicacionDeBien(anterior) }
    })
    .filter((a) => enAmbito(carIds, a.ubicacion.car.id))

  return { pendientes, infraestructura, atendidas, insuficientes }
}

export function totalizar (pendientes) {
  const valoradas = pendientes.filter((n) => n.importe != null)
  return {
    cantidad: pendientes.length,
    importeConocido: valoradas.reduce((suma, n) => suma + n.importe, 0),
    sinValorar: pendientes.length - valoradas.length,
    renovacion: pendientes.filter((n) => n.clase === 'renovacion').length,
    reposicion: pendientes.filter((n) => n.clase === 'reposicion').length
  }
}

export function consolidarPorCar (resultado, cars) {
  return cars.map((car) => {
    const delCar = (lista) => lista.filter((item) => item.ubicacion.car.id === car.id)
    return {
      car,
      ...totalizar(delCar(resultado.pendientes)),
      infraestructura: delCar(resultado.infraestructura).length,
      atendidas: delCar(resultado.atendidas).length,
      insuficientes: delCar(resultado.insuficientes).length
    }
  })
}
