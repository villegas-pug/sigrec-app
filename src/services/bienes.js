// Consultas de bienes: árbol de ubicación, asociaciones y antecedentes (RF-01, RF-04, RF-08, RF-20).
import { db, bienPorId, localesDeCar, ambientesDeLocal, bienesDeAmbiente } from './datos'

const coincide = (bien, texto) => {
  if (!texto) return true
  const t = texto.toLowerCase()
  return [bien.nombre, bien.id, bien.codigoPatrimonial, bien.descripcion].some((v) => v?.toLowerCase().includes(t))
}

const cumpleSituacion = (bien, situacion) => situacion === 'todos' || bien.situacion === situacion

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

/**
 * Árbol local › ambiente › bien › bien asociado.
 * Con filtro, conserva los bienes que coinciden y sus antecesores para no perder la ubicación.
 */
export function arbolDelCar (carId, { texto = '', situacion = 'activo' } = {}) {
  return localesDeCar(carId).map((local) => ({
    id: local.id,
    tipo: 'local',
    label: `${local.id} · ${local.nombre}`,
    icono: 'apartment',
    selectable: false,
    children: ambientesDeLocal(local.id)
      .map((ambiente) => {
        const delAmbiente = bienesDeAmbiente(ambiente.id)
        const construir = (padreId) =>
          delAmbiente
            .filter((b) => (b.asociadoA?.bienId ?? null) === padreId)
            .map((bien) => {
              const hijos = construir(bien.id)
              const visible = cumpleSituacion(bien, situacion) && coincide(bien, texto)
              return visible || hijos.length ? nodoBien(bien, hijos) : null
            })
            .filter(Boolean)
        const children = construir(null)
        return {
          id: ambiente.id,
          tipo: 'ambiente',
          label: ambiente.nombre,
          codigo: `${delAmbiente.filter((b) => b.situacion === 'activo').length} bienes activos`,
          icono: 'meeting_room',
          selectable: false,
          children
        }
      })
      .filter((nodo) => nodo.children.length || !texto)
  }))
}

export function asociacionesDeBien (bien) {
  const padre = bien.asociadoA ? bienPorId(bien.asociadoA.bienId) : null
  const hermanos = padre ? db.bienes.filter((b) => b.asociadoA?.bienId === padre.id && b.id !== bien.id) : []
  const hijos = db.bienes.filter((b) => b.asociadoA?.bienId === bien.id)
  return { padre, hermanos, hijos }
}

// Antecedentes del bien, del más reciente al más antiguo; incluye el alta si se conoce la adquisición.
export function antecedentesDeBien (bien) {
  const eventos = db.eventos.filter(
    (e) => e.bienIds?.includes(bien.id) || e.bienAnteriorId === bien.id || e.bienNuevoId === bien.id
  )
  const alta = bien.adquisicion?.fecha
    ? [{ id: `ALTA-${bien.id}`, fecha: bien.adquisicion.fecha, tipo: 'alta', titulo: 'Adquisición', detalle: 'Fecha de adquisición registrada.', informadoPor: null }]
    : []
  return [...eventos, ...alta].sort((a, b) => b.fecha.localeCompare(a.fecha))
}
