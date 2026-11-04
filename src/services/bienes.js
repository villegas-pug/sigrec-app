// Consultas de bienes: árbol de ubicación, componentes y antecedentes (RF-01, RF-04, RF-08, RF-20).
import { db, ambientePorId, bienPorId, carPorId, ambientesDeCar, bienesDeAmbiente, vigente } from './datos'
import { condicionInmueble } from 'src/config/catalogos'
import { plural } from 'src/utils/formato'

const coincide = (bien, texto) => {
  if (!texto) return true
  const t = texto.toLowerCase()
  return [bien.nombre, bien.id, bien.codigoPatrimonial, bien.descripcion].some((v) => v?.toLowerCase().includes(t))
}

// «todos» muestra activos y dados de baja; los bienes anulados (registro erróneo) solo se ven al pedirlos.
const cumpleSituacion = (bien, situacion) => (situacion === 'todos' ? bien.situacion !== 'anulado' : bien.situacion === situacion)

function nodoBien (bien, hijos) {
  return {
    id: bien.id,
    tipo: bien.asociadoA ? 'componente' : 'bien',
    label: bien.nombre,
    codigo: bien.id,
    bien,
    icono: bien.asociadoA ? 'extension' : hijos.length ? 'account_tree' : 'label',
    children: hijos
  }
}

// Prefijos de nodo para que centros y ambientes no compartan clave con los bienes en el árbol.
export const nodoCentroId = (carId) => `car:${carId}`
export const nodoAmbienteId = (ambienteId) => `amb:${ambienteId}`

function nodoAmbiente (ambiente, filtros) {
  const delAmbiente = bienesDeAmbiente(ambiente.id)
  const construir = (padreId) =>
    delAmbiente
      .filter((b) => (b.asociadoA?.bienId ?? null) === padreId)
      .map((bien) => {
        const componentes = construir(bien.id)
        const visible = cumpleSituacion(bien, filtros.situacion) && coincide(bien, filtros.texto)
        return visible || componentes.length ? nodoBien(bien, componentes) : null
      })
      .filter(Boolean)
  return {
    id: nodoAmbienteId(ambiente.id),
    tipo: 'ambiente',
    label: ambiente.nombre,
    codigo: plural(delAmbiente.filter((b) => b.situacion === 'activo').length, 'bien activo', 'bienes activos'),
    icono: 'meeting_room',
    ambiente,
    children: construir(null)
  }
}

/**
 * Árbol centro › ambiente › bien › componente (RF-01, RF-08). Todos los niveles son seleccionables.
 * El inmueble no es un nivel: sus datos son parte de la ficha del centro.
 * Con filtro, conserva los bienes que coinciden y sus antecesores para no perder la ubicación.
 */
export function arbolDeCentros (carIds, { texto = '', situacion = 'activo', inactivos = false } = {}) {
  const filtros = { texto, situacion }
  return carIds
    .map((carId) => {
      const car = carPorId(carId)
      const children = ambientesDeCar(carId, { inactivos })
        .map((ambiente) => nodoAmbiente(ambiente, filtros))
        .filter((nodo) => nodo.children.length || !texto)
      return {
        id: nodoCentroId(carId),
        tipo: 'centro',
        label: car.nombre,
        codigo: car.inmueble ? `Inmueble ${condicionInmueble(car.inmueble.condicion).label.toLowerCase()}` : 'Sin datos del inmueble',
        icono: 'home_work',
        car,
        children
      }
    })
    .filter((nodo) => nodo.children.length || !texto)
}

// Nodo del árbol a partir de su id: { tipo: 'centro' | 'ambiente' | 'bien' | 'componente', registro } o null si no existe.
export function resolverNodo (id) {
  if (!id) return null
  if (id.startsWith('car:')) {
    const registro = carPorId(id.slice(4))
    return registro ? { tipo: 'centro', registro } : null
  }
  if (id.startsWith('amb:')) {
    const registro = ambientePorId(id.slice(4))
    return registro ? { tipo: 'ambiente', registro } : null
  }
  const registro = bienPorId(id)
  return registro ? { tipo: registro.asociadoA ? 'componente' : 'bien', registro } : null
}

// Ids de los nodos que tienen hijos (los que se pueden expandir), en cualquier nivel.
export const idsExpandibles = (nodos) => nodos.flatMap((n) => (n.children?.length ? [n.id, ...idsExpandibles(n.children)] : []))

// Ids de los antecesores de un nodo dentro del árbol dado; null si el nodo no figura en él.
export function rutaHasta (nodos, objetivo, camino = []) {
  for (const n of nodos) {
    if (n.id === objetivo) return camino
    const r = n.children?.length ? rutaHasta(n.children, objetivo, [...camino, n.id]) : null
    if (r) return r
  }
  return null
}

// Antecesores de un nodo según los datos (sin depender de los filtros del árbol): centro › ambiente › bien padre.
export function antecesoresDeNodo (id) {
  const nodo = resolverNodo(id)
  if (!nodo || nodo.tipo === 'centro') return []
  if (nodo.tipo === 'ambiente') return [nodoCentroId(nodo.registro.carId)]
  const ambiente = ambientePorId(nodo.registro.ambienteId)
  return [nodoCentroId(ambiente.carId), nodoAmbienteId(ambiente.id), ...(nodo.registro.asociadoA ? [nodo.registro.asociadoA.bienId] : [])]
}

// Los componentes anulados (registro erróneo) no figuran entre las asociaciones.
const esComponenteDe = (b, bienId) => b.asociadoA?.bienId === bienId && b.situacion !== 'anulado'

export function asociacionesDeBien (bien) {
  const padre = bien.asociadoA ? bienPorId(bien.asociadoA.bienId) : null
  const hermanos = padre ? db.bienes.filter((b) => esComponenteDe(b, padre.id) && b.id !== bien.id) : []
  const hijos = db.bienes.filter((b) => esComponenteDe(b, bien.id))
  return { padre, hermanos, hijos }
}

// Antecedentes del bien, del más reciente al más antiguo; incluye el alta si se conoce la adquisición.
export function antecedentesDeBien (bien) {
  const eventos = db.eventos.filter(
    (e) => vigente(e) && (e.bienIds?.includes(bien.id) || e.bienAnteriorId === bien.id || e.bienNuevoId === bien.id)
  )
  const alta = bien.adquisicion?.fecha
    ? [{ id: `ALTA-${bien.id}`, fecha: bien.adquisicion.fecha, tipo: 'alta', titulo: 'Adquisición', detalle: 'Fecha de adquisición registrada.', informadoPor: null }]
    : []
  // Se invierte antes de ordenar para que, en una misma fecha, el hecho registrado después aparezca primero.
  return [...eventos.reverse(), ...alta].sort((a, b) => b.fecha.localeCompare(a.fecha))
}

// Baja patrimonial y reposición vigentes de un bien (null si no tiene).
export const bajaDe = (bienId) =>
  db.eventos.find((e) => vigente(e) && e.tipo === 'baja' && e.bienIds?.[0] === bienId) ?? null

export const reposicionDe = (bienId) =>
  db.eventos.find((e) => vigente(e) && e.tipo === 'reposicion' && e.bienAnteriorId === bienId) ?? null

const PASOS = {
  baja: { modo: 'baja', permiso: 'bien.baja', label: 'Dar de baja', icono: 'remove_circle', color: 'negative' },
  reposicion: { modo: 'reposicion', permiso: 'bien.reposicion', label: 'Registrar reposición', icono: 'swap_horiz', color: 'primary' }
}

// Paso siguiente de la atención de una necesidad sobre un bien: un bien activo se da de baja; uno dado de baja se repone.
// La reposición exige la baja previa y ninguno de los dos pasos se ejecuta solo. Nulo si no hay paso (anulado o ya repuesto).
export function siguientePaso (bien) {
  if (!bien) return null
  if (bien.situacion === 'activo') return PASOS.baja
  if (bien.situacion === 'baja' && !reposicionDe(bien.id)) return PASOS.reposicion
  return null
}
