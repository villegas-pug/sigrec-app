// Control preventivo y mantenimientos (SPEC 010 §7): fumigación, recarga de extintores y mantenimiento de equipos y vehículos.
// Un solo registro (`db.mantenimientos`) cubre todos los tipos. Reglas puras: no modifican datos.
import { db, ambientesDeCar, bienPorId, carPorId, vehiculoPorId, vigente } from './datos'
import { PARAMETROS_CONTROL } from 'src/config/demo'
import { TIPO_EXTINTOR } from 'src/config/catalogos'
import { diasEntre } from 'src/utils/fechas'

/**
 * Mantenimientos que cumplen el filtro, del más reciente al más antiguo (a igual fecha, el registrado después va primero).
 * Los anulados solo se incluyen con `inactivos`.
 */
export function mantenimientosDe ({ carId, tipo, bienId, vehiculoId } = {}, { inactivos = false } = {}) {
  return db.mantenimientos
    .filter((m) =>
      (inactivos || vigente(m)) &&
      (!carId || m.carId === carId) &&
      (!tipo || m.tipo === tipo) &&
      (!bienId || m.bienId === bienId) &&
      (!vehiculoId || m.vehiculoId === vehiculoId)
    )
    .reverse()
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
}

export const ultimoMantenimiento = (filtro) => mantenimientosDe(filtro)[0] ?? null

/**
 * Estado de un control según su próxima fecha:
 * - sin fecha: «sin_programar» (no se asume que esté al día);
 * - fecha pasada: «vencido»; dentro del umbral: «por_vencer»; si no, «al_dia».
 */
export function estadoControl (proxima, fechaCorte, diasAviso = PARAMETROS_CONTROL.diasPorVencer) {
  if (!proxima) return 'sin_programar'
  const dias = diasEntre(fechaCorte, proxima)
  if (dias < 0) return 'vencido'
  return dias <= diasAviso ? 'por_vencer' : 'al_dia'
}

// Control de un objetivo (centro, bien o vehículo): su último mantenimiento, la próxima fecha que ese registro programó y su estado.
export function controlDe (filtro, fechaCorte) {
  const ultimo = ultimoMantenimiento(filtro)
  const proxima = ultimo?.proxima ?? null
  return { ultimo, proxima, estado: estadoControl(proxima, fechaCorte), dias: proxima ? diasEntre(fechaCorte, proxima) : null }
}

// Control de un vehículo. La fecha del último mantenimiento es la más reciente entre la ficha del vehículo y los registros.
export function controlDeVehiculo (vehiculo, fechaCorte) {
  const control = controlDe({ vehiculoId: vehiculo.id, tipo: 'mantenimiento_vehiculo' }, fechaCorte)
  const fichas = [vehiculo.mantenimiento?.ultimoFecha, control.ultimo?.fecha].filter(Boolean).sort()
  return { ...control, ultimaFecha: fichas.at(-1) ?? null }
}

const esExtintor = (bien) => bien.tipoId === TIPO_EXTINTOR && bien.situacion === 'activo'
const unidades = (bien) => bien.cantidad ?? 1

/**
 * Extintores de un centro: son bienes activos del tipo «extintor». Los faltantes se calculan contra la dotación requerida de la ficha
 * del centro; si no se informó, no se calculan (nunca se asumen cero).
 */
export function extintoresDeCentro (carId, fechaCorte) {
  const car = carPorId(carId)
  const lista = ambientesDeCar(carId).flatMap((ambiente) =>
    db.bienes.filter((b) => b.ambienteId === ambiente.id && esExtintor(b)).map((bien) => ({
      bien,
      ambiente,
      ...controlDe({ bienId: bien.id, tipo: 'recarga_extintor' }, fechaCorte)
    }))
  )
  const requeridos = car?.inmueble?.seguridad?.extintoresRequeridos ?? null
  const activos = lista.reduce((suma, e) => suma + unidades(e.bien), 0)
  return {
    lista,
    requeridos,
    activos,
    faltantes: requeridos == null ? null : Math.max(0, requeridos - activos),
    vencidos: lista.filter((e) => e.estado === 'vencido').length,
    porVencer: lista.filter((e) => e.estado === 'por_vencer').length
  }
}

export const fumigacionDeCentro = (carId, fechaCorte) => controlDe({ carId, tipo: 'fumigacion' }, fechaCorte)

// Último mantenimiento vigente de cada objetivo (tipo + bien o vehículo) de los centros indicados.
function ultimosPorObjetivo (carIds) {
  const grupos = new Map()
  for (const m of mantenimientosDe()) {
    if (carIds && !carIds.includes(m.carId)) continue
    const clave = `${m.tipo}|${m.carId}|${m.bienId ?? ''}|${m.vehiculoId ?? ''}`
    if (!grupos.has(clave)) grupos.set(clave, m)
  }
  return [...grupos.values()]
}

// Texto del objetivo de un mantenimiento: el bien, el vehículo o el centro.
export function objetivoDe (m) {
  if (m.bienId) {
    const bien = bienPorId(m.bienId)
    return bien ? `${bien.nombre} ${bien.id}` : m.bienId
  }
  if (m.vehiculoId) {
    const v = vehiculoPorId(m.vehiculoId)
    return v ? `${v.tipo} ${v.id}` : m.vehiculoId
  }
  return 'Centro'
}

// ¿El objetivo sigue vigente? Un bien dado de baja o un vehículo anulado ya no genera controles.
function objetivoVigente (m) {
  if (m.bienId) return bienPorId(m.bienId)?.situacion === 'activo'
  if (m.vehiculoId) {
    const v = vehiculoPorId(m.vehiculoId)
    return !!v && vigente(v)
  }
  return true
}

/**
 * Controles que requieren atención en los centros indicados (null = todos): vencidos, por vencer y extintores faltantes.
 * Cada elemento: { clave, clase: 'vencido' | 'por_vencer' | 'faltante', carId, tipo, objetivo, mantenimiento, proxima, dias, faltantes }.
 * Un control «sin programar» no se lista aquí (se ve en la ficha del centro y en el tablero).
 */
export function controlesPendientes (carIds, fechaCorte) {
  const lista = []
  for (const m of ultimosPorObjetivo(carIds)) {
    if (!objetivoVigente(m) || !carPorId(m.carId) || carPorId(m.carId).anulacion) continue
    const estado = estadoControl(m.proxima, fechaCorte)
    if (estado !== 'vencido' && estado !== 'por_vencer') continue
    lista.push({ clave: m.id, clase: estado, carId: m.carId, tipo: m.tipo, objetivo: objetivoDe(m), mantenimiento: m, proxima: m.proxima, dias: diasEntre(fechaCorte, m.proxima) })
  }
  const cars = (carIds ?? db.cars.map((c) => c.id)).map(carPorId).filter((c) => c && !c.anulacion)
  for (const car of cars) {
    const { faltantes } = extintoresDeCentro(car.id, fechaCorte)
    if (faltantes > 0) lista.push({ clave: `faltantes-${car.id}`, clase: 'faltante', carId: car.id, tipo: 'recarga_extintor', objetivo: 'Extintores', mantenimiento: null, proxima: null, dias: null, faltantes })
  }
  const peso = { vencido: 0, faltante: 1, por_vencer: 2 }
  return lista.sort((a, b) => peso[a.clase] - peso[b.clase] || (a.dias ?? 0) - (b.dias ?? 0))
}

export function resumirControles (pendientes) {
  return {
    vencidos: pendientes.filter((p) => p.clase === 'vencido').length,
    porVencer: pendientes.filter((p) => p.clase === 'por_vencer').length,
    extintoresFaltantes: pendientes.filter((p) => p.clase === 'faltante').reduce((suma, p) => suma + p.faltantes, 0)
  }
}
