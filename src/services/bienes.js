// Consultas de bienes: árbol de ubicación, componentes y antecedentes (RF-01, RF-04, RF-08, RF-20).
import { db, bienPorId, carPorId, ambientesDeCar, bienesDeAmbiente, vigente } from './datos'
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
    tipo: 'bien',
    label: bien.nombre,
    codigo: bien.id,
    bien,
    icono: hijos.length ? 'account_tree' : 'label',
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
    selectable: false,
    children: construir(null)
  }
}

/**
 * Árbol centro › ambiente › bien › componente (RF-01, RF-08).
 * El inmueble no es un nivel: sus datos son parte de la ficha del centro.
 * Con filtro, conserva los bienes que coinciden y sus antecesores para no perder la ubicación.
 */
export function arbolDeCentros (carIds, { texto = '', situacion = 'activo' } = {}) {
  const filtros = { texto, situacion }
  return carIds
    .map((carId) => {
      const car = carPorId(carId)
      const children = ambientesDeCar(carId)
        .map((ambiente) => nodoAmbiente(ambiente, filtros))
        .filter((nodo) => nodo.children.length || !texto)
      return {
        id: nodoCentroId(carId),
        tipo: 'centro',
        label: car.nombre,
        codigo: car.inmueble ? `Inmueble ${condicionInmueble(car.inmueble.condicion).label.toLowerCase()}` : 'Sin datos del inmueble',
        icono: 'home_work',
        selectable: false,
        children
      }
    })
    .filter((nodo) => nodo.children.length || !texto)
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
  baja: { modo: 'baja', permiso: 'bien.baja', label: 'Dar de baja', color: 'negative' },
  reposicion: { modo: 'reposicion', permiso: 'bien.reposicion', label: 'Registrar reposición', color: 'primary' }
}

// Paso siguiente de la atención de una necesidad sobre un bien: un bien activo se da de baja; uno dado de baja se repone.
// La reposición exige la baja previa y ninguno de los dos pasos se ejecuta solo. Nulo si no hay paso (anulado o ya repuesto).
export function siguientePaso (bien) {
  if (!bien) return null
  if (bien.situacion === 'activo') return PASOS.baja
  if (bien.situacion === 'baja' && !reposicionDe(bien.id)) return PASOS.reposicion
  return null
}
