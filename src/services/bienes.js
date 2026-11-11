// Consultas de bienes: árbol de ubicación, componentes y antecedentes (RF-01, RF-04, RF-08, RF-20).
import { db, ambientePorId, bienPorId, carPorId, moduloPorId, modulosDeCar, ambientesDeModulo, bienesDeAmbiente, vigente } from './datos'
import { contarRecursos, textoConteoRecursos } from './jerarquiaRecursos'
import { TIPOS_MANTENIMIENTO, condicionInmueble } from 'src/config/catalogos'
import { fecha, plural } from 'src/utils/formato'

const coincide = (bien, texto) => {
  if (!texto) return true
  const normalizar = (v) => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const t = normalizar(texto)
  return [bien.nombre, bien.id, bien.codigoPatrimonial, bien.descripcion].some((v) => normalizar(v).includes(t))
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

// Prefijos de nodo para que centros, módulos y ambientes no compartan clave con los bienes en el árbol.
export const nodoCentroId = (carId) => `car:${carId}`
export const nodoModuloId = (moduloId) => `mod:${moduloId}`
export const nodoAmbienteId = (ambienteId) => `amb:${ambienteId}`

// Icono del módulo: las casas y los módulos de uso común se distinguen en todo el sistema.
export const iconoModulo = (modulo) => (modulo.tipo === 'comun' ? 'groups' : 'cottage')

function nodoAmbiente (ambiente, filtros) {
  const delAmbiente = bienesDeAmbiente(ambiente.id)
  const construir = (padreId, heredado = false) =>
    delAmbiente
      .filter((b) => (b.asociadoA?.bienId ?? null) === padreId)
      .map((bien) => {
        const coincideTexto = heredado || coincide(bien, filtros.texto)
        const componentes = construir(bien.id, coincideTexto)
        const visible = cumpleSituacion(bien, filtros.situacion) && coincideTexto
        return visible || componentes.length ? nodoBien(bien, componentes) : null
      })
      .filter(Boolean)
  return {
    id: nodoAmbienteId(ambiente.id),
    tipo: 'ambiente',
    label: ambiente.nombre,
    codigo: `${textoConteoRecursos(contarRecursos(delAmbiente.filter((b) => cumpleSituacion(b, filtros.situacion))))} (registros)`,
    icono: 'meeting_room',
    ambiente,
    children: construir(null, coincide(ambiente, filtros.texto))
  }
}

// Un nivel con coincidencia de texto muestra completos sus descendientes (respetando situación y ámbito).
function nodoModulo (modulo, filtros, inactivos) {
  const propios = coincide(modulo, filtros.texto) ? { ...filtros, texto: '' } : filtros
  const children = ambientesDeModulo(modulo.id, { inactivos })
    .map((ambiente) => nodoAmbiente(ambiente, propios))
    .filter((nodo) => nodo.children.length || !propios.texto || coincide(nodo.ambiente, propios.texto))
  return {
    id: nodoModuloId(modulo.id),
    tipo: 'modulo',
    label: modulo.nombre,
    codigo: `${modulo.tipo === 'comun' ? 'Uso común · ' : ''}${plural(children.length, 'ambiente', 'ambientes')}`,
    icono: iconoModulo(modulo),
    modulo,
    children
  }
}

/**
 * Árbol centro › módulo › ambiente › bien › componente (RF-01, RF-08, SPEC 020). Todos los niveles son seleccionables.
 * El inmueble no es un nivel: sus datos son parte de la ficha del centro.
 * Con búsqueda, conserva coincidencias de cualquier nivel y sus antecesores; los descendientes respetan situación y ámbito.
 */
export function arbolDeCentros (carIds, { texto = '', situacion = 'activo', inactivos = false } = {}) {
  const filtros = { texto, situacion }
  return carIds
    .map((carId) => {
      const car = carPorId(carId)
      const propios = coincide(car, texto) ? { ...filtros, texto: '' } : filtros
      const children = modulosDeCar(carId, { inactivos })
        .map((modulo) => nodoModulo(modulo, propios, inactivos))
        .filter((nodo) => nodo.children.length || !propios.texto || coincide(nodo.modulo, propios.texto))
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
    .filter((nodo) => nodo.children.length || !texto || coincide(nodo.car, texto))
}

// Nodo del árbol a partir de su id: { tipo: 'centro' | 'modulo' | 'ambiente' | 'bien' | 'componente', registro } o null si no existe.
export function resolverNodo (id) {
  if (!id) return null
  if (id.startsWith('car:')) {
    const registro = carPorId(id.slice(4))
    return registro ? { tipo: 'centro', registro } : null
  }
  if (id.startsWith('mod:')) {
    const registro = moduloPorId(id.slice(4))
    return registro ? { tipo: 'modulo', registro } : null
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

// Antecesores de un nodo según los datos (sin depender de los filtros del árbol): centro › módulo › ambiente › bien padre.
export function antecesoresDeNodo (id) {
  const nodo = resolverNodo(id)
  if (!nodo || nodo.tipo === 'centro') return []
  if (nodo.tipo === 'modulo') return [nodoCentroId(nodo.registro.carId)]
  const ambiente = nodo.tipo === 'ambiente' ? nodo.registro : ambientePorId(nodo.registro.ambienteId)
  const hastaAmbiente = [nodoCentroId(ambiente.carId), ...(ambiente.moduloId ? [nodoModuloId(ambiente.moduloId)] : [])]
  if (nodo.tipo === 'ambiente') return hastaAmbiente
  return [...hastaAmbiente, nodoAmbienteId(ambiente.id), ...(nodo.registro.asociadoA ? [nodo.registro.asociadoA.bienId] : [])]
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
  // Los mantenimientos vigentes del bien (recarga de extintor, mantenimiento de equipo) también son antecedentes.
  const mantenimientos = db.mantenimientos
    .filter((m) => vigente(m) && m.bienId === bien.id)
    .map((m) => ({
      id: m.id,
      fecha: m.fecha,
      tipo: 'mantenimiento',
      titulo: TIPOS_MANTENIMIENTO[m.tipo]?.label ?? 'Mantenimiento',
      detalle: [m.detalle, m.proxima ? `Próximo: ${fecha(m.proxima)}` : null].filter(Boolean).join(' · ') || null,
      informadoPor: m.informadoPor
    }))
  // Se invierte antes de ordenar para que, en una misma fecha, el hecho registrado después aparezca primero.
  return [...eventos.reverse(), ...mantenimientos, ...alta].sort((a, b) => b.fecha.localeCompare(a.fecha))
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
