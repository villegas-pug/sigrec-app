// Reporte de inventario para planificación (SPEC 010 §4): cantidades por tipo de bien o categoría, condición, valor aproximado
// y necesidades del año. Solo cuenta bienes activos; no cambia las reglas de necesidades, las reutiliza.
import { tipoPorId, ubicacionDeBien, db } from './datos'
import { calcularNecesidades } from './necesidades'
import { CATEGORIAS, CONDICIONES } from 'src/config/catalogos'

const CLAVES_CONDICION = [...Object.keys(CONDICIONES), 'sin_dato']

const conteoVacio = () => Object.fromEntries(CLAVES_CONDICION.map((c) => [c, 0]))

const claveCondicion = (bien) => (CONDICIONES[bien.condicion] ? bien.condicion : 'sin_dato')

/**
 * Filas del inventario activo de los centros indicados (null = todos).
 * - `agruparPor`: 'tipo' (tipo de bien) o 'categoria'.
 * - Valor aproximado = precio referencial del tipo × cantidad. Las unidades sin precio no suman: se informan aparte
 *   (`unidadesSinValorar`) y una fila sin ningún precio queda «sin valorar», nunca en cero.
 * - La necesidad del año sale de `calcularNecesidades`, de modo que coincide con la pantalla Necesidades.
 */
export function resumenInventario ({ carIds = null, agruparPor = 'tipo', anio, categoria = null }) {
  const necesidades = calcularNecesidades({ anio, carIds }).pendientes
  const filas = new Map()

  const fila = (clave, nombre, categoriaFila, tipo) => {
    if (!filas.has(clave)) {
      filas.set(clave, {
        clave,
        nombre,
        categoria: categoriaFila,
        precioUnitario: agruparPor === 'tipo' ? tipo?.precio ?? null : null,
        cantidad: 0,
        porCondicion: conteoVacio(),
        valorConocido: 0,
        unidadesSinValorar: 0,
        necesidad: { bienes: 0, unidades: 0, importeConocido: 0, sinValorar: 0 }
      })
    }
    return filas.get(clave)
  }

  const claveDe = (bien, tipo) => {
    const categoriaBien = tipo?.categoria ?? bien.categoria
    return agruparPor === 'categoria'
      ? { clave: categoriaBien ?? 'sin_categoria', nombre: CATEGORIAS[categoriaBien] ?? 'Sin categoría', categoria: categoriaBien }
      : { clave: bien.tipoId ?? `sin_tipo:${bien.nombre}`, nombre: tipo?.nombre ?? bien.nombre, categoria: categoriaBien }
  }

  for (const bien of db.bienes) {
    if (bien.situacion !== 'activo') continue
    if (carIds && !carIds.includes(ubicacionDeBien(bien).car.id)) continue
    const tipo = tipoPorId(bien.tipoId)
    const { clave, nombre, categoria: categoriaFila } = claveDe(bien, tipo)
    if (categoria && categoriaFila !== categoria) continue

    const f = fila(clave, nombre, categoriaFila, tipo)
    const cantidad = bien.cantidad ?? 1
    f.cantidad += cantidad
    f.porCondicion[claveCondicion(bien)] += cantidad
    if (tipo?.precio != null) f.valorConocido += tipo.precio * cantidad
    else f.unidadesSinValorar += cantidad
  }

  for (const n of necesidades) {
    const { clave } = claveDe(n.bien, n.tipo)
    const f = filas.get(clave)
    if (!f) continue
    f.necesidad.bienes += 1
    f.necesidad.unidades += n.cantidad
    if (n.importe != null) f.necesidad.importeConocido += n.importe
    else f.necesidad.sinValorar += 1
  }

  return [...filas.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

export function totalizarInventario (filasInventario) {
  const total = {
    cantidad: 0,
    tipos: filasInventario.length,
    porCondicion: conteoVacio(),
    valorConocido: 0,
    unidadesSinValorar: 0,
    necesidad: { bienes: 0, unidades: 0, importeConocido: 0, sinValorar: 0 }
  }
  for (const f of filasInventario) {
    total.cantidad += f.cantidad
    total.valorConocido += f.valorConocido
    total.unidadesSinValorar += f.unidadesSinValorar
    for (const c of CLAVES_CONDICION) total.porCondicion[c] += f.porCondicion[c]
    for (const k of Object.keys(total.necesidad)) total.necesidad[k] += f.necesidad[k]
  }
  return total
}

// Una fila está totalmente valorada, parcialmente o sin ningún precio (nunca se presenta como cero).
export const estadoValoracion = (f) => {
  if (!f.unidadesSinValorar) return 'completa'
  return f.valorConocido > 0 ? 'parcial' : 'sin_valorar'
}
