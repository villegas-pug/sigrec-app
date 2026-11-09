// Estado de la infraestructura por elemento (ambiente y construcción del centro) y resumen del mobiliario a partir de los bienes.
import { CONDICIONES, CONDICIONES_CRITICAS, ELEMENTOS_INFRAESTRUCTURA } from 'src/config/catalogos'

// Objeto con todos los elementos del catálogo (null = no evaluado): forma estable para los formularios.
export function completarElementos (estadoElementos) {
  return Object.fromEntries(ELEMENTOS_INFRAESTRUCTURA.map(({ key }) => [key, estadoElementos?.[key] ?? null]))
}

// Solo se guardan los elementos evaluados; sin ninguno devuelve null (no informado).
export function normalizarElementos (estadoElementos) {
  const evaluados = ELEMENTOS_INFRAESTRUCTURA.filter(({ key }) => estadoElementos?.[key])
  return evaluados.length ? Object.fromEntries(evaluados.map(({ key }) => [key, estadoElementos[key]])) : null
}

// Elementos evaluados en condición mala o inservible.
export const elementosCriticos = (estadoElementos) =>
  ELEMENTOS_INFRAESTRUCTURA.filter(({ key }) => CONDICIONES_CRITICAS.includes(estadoElementos?.[key]))

export const cantidadEvaluados = (estadoElementos) =>
  ELEMENTOS_INFRAESTRUCTURA.filter(({ key }) => estadoElementos?.[key]).length

/**
 * Conteo de bienes activos por condición (bueno, regular, malo, inservible y sin dato), ponderado por cantidad.
 * Los componentes cuentan como bienes del ambiente.
 */
export function conteoPorCondicion (bienes) {
  const conteo = { ...Object.fromEntries(Object.keys(CONDICIONES).map((c) => [c, 0])), sin_dato: 0 }
  for (const bien of bienes) {
    if (bien.situacion !== 'activo') continue
    conteo[CONDICIONES[bien.condicion] ? bien.condicion : 'sin_dato'] += bien.cantidad ?? 1
  }
  return conteo
}
