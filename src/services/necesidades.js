// Reglas de necesidades y presupuesto (RF-05, RF-06, RF-19, RF-20, RF-21).
import { db, bienPorId, tipoPorId, ubicacionDeBien, ubicacionDeAmbiente, vigente } from './datos'
import { reposicionDe } from './bienes'
import { plural } from 'src/utils/formato'
import { INCIDENTES, TIPOS_EVENTO } from 'src/config/catalogos'
import { PARAMETROS_PRIORIDAD } from 'src/config/demo'

const enAmbito = (carIds, carId) => !carIds || carIds.includes(carId)
const anioDe = (fechaIso) => Number(fechaIso.slice(0, 4))

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

// Incidentes vigentes que reportan necesidad y ocurrieron hasta el año revisado (`anio` null = sin límite).
export function incidentesConNecesidad (bienId, anio = null) {
  return db.eventos.filter(
    (e) =>
      vigente(e) &&
      INCIDENTES.includes(e.tipo) &&
      e.reportaNecesidad &&
      e.bienIds?.includes(bienId) &&
      (anio == null || anioDe(e.fecha) <= anio)
  )
}

// Unidades afectadas por un incidente: solo cuenta `unidades` cuando el hecho informa un único bien.
const unidadesDelIncidente = (evento, cantidadBien) => (evento.bienIds.length === 1 && evento.unidades ? evento.unidades : cantidadBien)

/**
 * Calcula las necesidades del año para los CAR indicados (null = todos).
 * - Una sola necesidad por bien activo, con todos sus motivos (vida útil e incidentes).
 * - Sin fecha de adquisición o vida útil no se calcula renovación; se informa como antecedente insuficiente.
 * - Sin precio referencial el importe es null («sin valorar»), nunca cero.
 * - Con la vida útil cumplida se renuevan todas las unidades; solo por incidente, las unidades informadas (regla por validar).
 * - Los incidentes cuentan desde el año en que ocurren. Las reposiciones registradas se listan como atendidas y no suman.
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

    const cantidadBien = bien.cantidad ?? 1
    const motivos = []
    const fin = finVidaUtil(bien)
    const porVidaUtil = fin != null && fin <= anio
    if (porVidaUtil) {
      motivos.push({ clase: 'vida_util', texto: `Vida útil cumplida en ${fin}`, fecha: null })
    }
    const incidentes = incidentesConNecesidad(bien.id, anio)
    for (const evento of incidentes) {
      const unidades = unidadesDelIncidente(evento, cantidadBien)
      const parcial = unidades < cantidadBien ? ` (${unidades} de ${plural(cantidadBien, 'unidad', 'unidades')})` : ''
      motivos.push({ clase: 'incidente', texto: `${TIPOS_EVENTO[evento.tipo].label}: ${evento.titulo}${parcial}`, fecha: evento.fecha, eventoId: evento.id })
    }
    if (!motivos.length) continue

    const afectadas = incidentes.reduce((suma, e) => suma + unidadesDelIncidente(e, cantidadBien), 0)
    const cantidad = porVidaUtil ? cantidadBien : Math.min(cantidadBien, afectadas)
    const tipo = tipoPorId(bien.tipoId)
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

  const infraestructura = db.ambientes
    .filter(vigente)
    .flatMap((ambiente) => {
      const ubicacion = ubicacionDeAmbiente(ambiente.id)
      if (!enAmbito(carIds, ubicacion.car.id)) return []
      return (ambiente.novedades ?? [])
        .filter((n) => vigente(n) && n.requiereEvaluacion && !n.atendida)
        .map((novedad) => ({ id: novedad.id, novedad, ubicacion }))
    })

  const atendidas = db.eventos
    .filter((e) => vigente(e) && e.tipo === 'reposicion' && anioDe(e.fecha) <= anio)
    .map((evento) => {
      const anterior = bienPorId(evento.bienAnteriorId)
      return { id: evento.id, evento, anterior, nuevo: bienPorId(evento.bienNuevoId), ubicacion: ubicacionDeBien(anterior) }
    })
    .filter((a) => enAmbito(carIds, a.ubicacion.car.id))

  // Bienes ya dados de baja por un incidente con necesidad y todavía sin reposición. Es informativo: no suma a los pendientes
  // (regla por validar), porque la baja saca al bien del cálculo.
  const porReponer = db.bienes
    .filter((b) => b.situacion === 'baja' && !reposicionDe(b.id))
    .map((bien) => ({ id: bien.id, bien, ubicacion: ubicacionDeBien(bien), incidentes: incidentesConNecesidad(bien.id, anio) }))
    .filter((r) => r.incidentes.length && enAmbito(carIds, r.ubicacion.car.id))

  return { pendientes, infraestructura, atendidas, insuficientes, porReponer }
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

/**
 * Orden de prioridad provisional (PARAMETROS_PRIORIDAD, por validar): primero la reposición por incidente, luego la peor condición
 * y, a igualdad, la vida útil cumplida hace más tiempo. Devuelve una copia ordenada con su posición (`prioridad`, desde 1).
 */
export function priorizar (pendientes, parametros = PARAMETROS_PRIORIDAD) {
  const puntaje = (n) => [
    parametros.clase[n.clase] ?? 9,
    parametros.condicion[n.bien.condicion] ?? parametros.condicion.sin_dato,
    finVidaUtil(n.bien) ?? 9999
  ]
  return [...pendientes]
    .sort((a, b) => {
      const [pa, pb] = [puntaje(a), puntaje(b)]
      return pa[0] - pb[0] || pa[1] - pb[1] || pa[2] - pb[2] || a.id.localeCompare(b.id)
    })
    .map((n, i) => ({ ...n, prioridad: i + 1 }))
}

/**
 * Simula qué necesidades cubre un techo presupuestal (en soles), en orden de prioridad.
 * - Se recorre la lista priorizada: si el importe cabe en el saldo, se cubre; si no, queda «sin saldo» y se sigue con la siguiente
 *   (una necesidad menor puede cubrirse aunque otra de mayor prioridad no quepa).
 * - Las necesidades sin valorar no se cubren ni se descuentan: se informan aparte, nunca como cero.
 * - Es una simulación: no aprueba compras ni reserva presupuesto.
 */
export function simularTecho (pendientes, techo) {
  const ordenadas = priorizar(pendientes)
  let saldo = Number.isFinite(techo) && techo > 0 ? techo : 0
  const cubiertas = []
  const sinSaldo = []
  const sinValorar = []
  for (const n of ordenadas) {
    if (n.importe == null) sinValorar.push(n)
    else if (n.importe <= saldo) {
      saldo -= n.importe
      cubiertas.push(n)
    } else sinSaldo.push(n)
  }
  const suma = (lista) => lista.reduce((s, n) => s + n.importe, 0)
  return { ordenadas, cubiertas, sinSaldo, sinValorar, importeCubierto: suma(cubiertas), importeSinSaldo: suma(sinSaldo), saldo }
}
