// Consultas y estados compartidos por el visor y Gestión de centros (SPEC 015).
import { db, bienPorId, ambientePorId, carPorId, moduloPorId, textoUbicacion, ubicacionDeAmbiente, ubicacionDeBien, vigente } from './datos'
import { reposicionDe } from './bienes'
import { INCIDENTES, TIPOS_NOVEDAD } from 'src/config/catalogos'
import { plural } from 'src/utils/formato'
export const TIPOS_HECHO = [...new Set([...INCIDENTES, ...Object.keys(TIPOS_NOVEDAD), 'baja', 'reposicion'])]
export const esIncidencia = (e) => !!e && (INCIDENTES.includes(e.tipo) || (['centro', 'ambiente'].includes(e.origen?.tipo) && Object.hasOwn(TIPOS_NOVEDAD, e.tipo)))
// Los incidentes anteriores solo guardaban el ambiente; no se inventa un origen más preciso.
export function origenIncidencia (e) {
  return e.origen ?? (esIncidencia(e) ? { tipo: 'ambiente', id: e.ambienteId } : { tipo: 'bien', id: e.bienAnteriorId ?? e.bienIds?.[0] })
}
export function ubicacionHecho (e) {
  const ambiente = e.ambienteId ? ambientePorId(e.ambienteId) : null
  const car = carPorId(e.carId ?? ambiente?.carId)
  const modulo = ambiente ? moduloPorId(ambiente.moduloId) : null
  return { car, ambiente, nombre: textoUbicacion({ car: car ?? { nombre: 'Centro no disponible' }, modulo, ambiente }) }
}
export function requiereReposicion (e, id) {
  const evaluacion = e.evaluaciones?.[id]
  return evaluacion && Object.hasOwn(evaluacion, 'requiereReposicion') ? evaluacion.requiereReposicion === true : e.reportaNecesidad === true
}
export function unidadesAfectadas (e, bien) {
  return e.evaluaciones?.[bien.id]?.unidades ?? (e.bienIds?.length === 1 && e.unidades ? e.unidades : bien.cantidad ?? 1)
}
export function contextoIncidencia (origen) {
  if (origen.tipo === 'centro') {
    const car = carPorId(origen.id)
    if (!car) throw new Error('Centro no disponible')
    return { carId: car.id, ambienteId: null, padre: null, nombre: car.nombre }
  }
  if (origen.tipo === 'ambiente') {
    const a = ambientePorId(origen.id)
    if (!a) throw new Error('Ambiente no disponible')
    const { car } = ubicacionDeAmbiente(a.id)
    return { carId: car.id, ambienteId: a.id, padre: { tipo: 'centro', id: car.id, nombre: car.nombre }, nombre: a.nombre }
  }
  const bien = bienPorId(origen.id)
  if (!bien) throw new Error('Bien no disponible')
  const { car, ambiente } = ubicacionDeBien(bien)
  const principal = bien.asociadoA ? bienPorId(bien.asociadoA.bienId) : null
  return { carId: car.id, ambienteId: ambiente.id, padre: principal ? { tipo: 'bien', id: principal.id, nombre: principal.nombre } : { tipo: 'ambiente', id: ambiente.id, nombre: ambiente.nombre }, nombre: bien.nombre }
}
export const permisoIncidencia = (e) => ['centro', 'ambiente'].includes(origenIncidencia(e).tipo) ? `${origenIncidencia(e).tipo}.incidente` : 'bien.incidente'
export function hechosRegistrados ({ bienId = null, ambienteId = null, centroId = null, inactivos = false } = {}) {
  return db.eventos.filter((e) => TIPOS_HECHO.includes(e.tipo) && (inactivos || vigente(e)) &&
    (!bienId || e.bienIds?.includes(bienId) || e.bienAnteriorId === bienId || e.bienNuevoId === bienId) &&
    (!ambienteId || (origenIncidencia(e).tipo === 'ambiente' && origenIncidencia(e).id === ambienteId)) &&
    (!centroId || (origenIncidencia(e).tipo === 'centro' && origenIncidencia(e).id === centroId)))
    .slice().reverse().sort((a, b) => b.fecha.localeCompare(a.fecha))
}
export const ESTADOS = {
  pendiente: { clave: 'pendiente', tono: 'da', label: 'Pendiente' },
  atendida: { clave: 'atendida', tono: 'ok', label: 'Atendida' },
  sin: { clave: 'sin', tono: 'ne', label: 'Sin necesidad reportada' },
  sinAbierta: { clave: 'sin', tono: 'ne', label: 'Sin necesidad abierta' },
  anulado: { clave: 'anulado', tono: 'ne', label: 'Anulado' }
}
export function estadoDeBien (ev, bienId, pendientes) {
  if (ev.anulacion) return ESTADOS.anulado
  if (ev.tipo === 'reposicion' || reposicionDe(bienId)) return ESTADOS.atendida
  if (!esIncidencia(ev) || !requiereReposicion(ev, bienId)) return ESTADOS.sin
  if (bienPorId(bienId)?.situacion === 'baja') return ESTADOS.pendiente
  return pendientes.find((n) => n.id === bienId) ? ESTADOS.pendiente : ESTADOS.sinAbierta
}

// Resumen del hecho: pendiente si algún bien lo está; si no, atendida si alguno lo está.
export function estadoNecesidad (ev, pendientes) {
  if (ev.anulacion) return ESTADOS.anulado
  if (ev.requiereEvaluacion && !ev.atendida && !(ev.bienIds ?? []).some((id) => requiereReposicion(ev, id))) return { clave: 'evaluacion', tono: 'in', label: 'Infraestructura en evaluación' }
  const estados = (ev.bienIds ?? []).map((id) => estadoDeBien(ev, id, pendientes))
  const pend = estados.filter((e) => e === ESTADOS.pendiente).length
  if (pend) return { ...ESTADOS.pendiente, label: ev.bienIds.length > 1 ? plural(pend, 'pendiente', 'pendientes') : ESTADOS.pendiente.label }
  return estados.find((e) => e === ESTADOS.atendida) ?? estados[0] ?? ESTADOS.sin
}

