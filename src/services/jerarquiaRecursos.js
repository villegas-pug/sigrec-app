// Consultas de presentación: registros de cada nivel, sin modificar las reglas de inventario.
import { bienesDeAmbiente, ambientesDeModulo, modulosDeCar, vigente } from './datos'

export const coincideSituacion = (bien, situacion = 'todos') => situacion === 'todos' ? bien.situacion !== 'anulado' : bien.situacion === situacion

export function contarRecursos (bienes) {
  return {
    bienes: bienes.filter((b) => !b.asociadoA).length,
    componentes: bienes.filter((b) => b.asociadoA).length
  }
}

export const textoConteoRecursos = ({ bienes, componentes }) => `${bienes} ${bienes === 1 ? 'bien' : 'bienes'} · ${componentes} ${componentes === 1 ? 'componente' : 'componentes'}`

export function gruposBienes (ambienteId, { situacion = 'todos' } = {}) {
  const registros = bienesDeAmbiente(ambienteId)
  const visibles = registros.filter((b) => coincideSituacion(b, situacion))
  const grupos = new Map()
  for (const bien of visibles) {
    const padreId = bien.asociadoA?.bienId ?? bien.id
    if (!grupos.has(padreId)) {
      const padre = registros.find((b) => b.id === padreId)
      const referencia = !padre || !coincideSituacion(padre, situacion)
      const registro = padre ?? { id: padreId, nombre: 'Bien principal fuera del ambiente' }
      grupos.set(padreId, { tipo: 'bien', registro, referencia, children: [] })
    }
    if (bien.asociadoA) grupos.get(padreId).children.push({ tipo: 'componente', registro: bien, children: [] })
  }
  return [...grupos.values()]
}

export function nodoAmbienteRecursos (ambiente, filtros = {}) {
  const conteo = contarRecursos(bienesDeAmbiente(ambiente.id).filter((b) => coincideSituacion(b, filtros.situacion)))
  return { tipo: 'ambiente', registro: ambiente, conteo: textoConteoRecursos(conteo), children: gruposBienes(ambiente.id, filtros) }
}

export function nodosModulos (centroId, filtros = {}) {
  return modulosDeCar(centroId, filtros).map((modulo) => ({
    tipo: 'modulo', registro: modulo,
    children: ambientesDeModulo(modulo.id, filtros).map((a) => nodoAmbienteRecursos(a, filtros))
  }))
}

export function estadoNivel (nodo) {
  return nodo.registro.situacion ?? (vigente(nodo.registro) ? 'activo' : 'anulado')
}
