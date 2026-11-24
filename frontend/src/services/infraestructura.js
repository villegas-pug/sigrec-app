// Estado de la infraestructura por elemento (ambiente, módulo y construcción del centro) y resumen del mobiliario a partir de los bienes.
// Cada ficha tiene sus propios elementos: `adicionales` = [{ key, label, icono }] (SPEC 051).
import { CONDICIONES, CONDICIONES_CRITICAS } from 'src/config/catalogos'
import { normalizar } from 'src/utils/interpretacionVoz'
import { situacionDe } from './datos'

export const LARGO_MAXIMO_ELEMENTO = 40

// Lista de elementos de la ficha.
export const elementosDe = (adicionales = []) => [
  ...(adicionales ?? []).map((a) => ({ ...a, icono: a.icono || 'category', adicional: true }))
]

// Clave independiente del nombre para conservarla al editar.
export const claveElemento = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 15) | 64
  bytes[8] = (bytes[8] & 63) | 128
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `extra-${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

// Motivo por el que un nombre no puede agregarse (null = válido): vacío, largo o repetido (sin distinguir tildes ni mayúsculas).
export function motivoElementoInvalido (nombre, adicionales = [], claveActual = null) {
  const texto = String(nombre ?? '').trim()
  if (!texto) return 'Escriba el nombre del elemento'
  if (texto.length > LARGO_MAXIMO_ELEMENTO) return `Use ${LARGO_MAXIMO_ELEMENTO} caracteres como máximo`
  const repetido = elementosDe(adicionales).some((e) => e.key !== claveActual && normalizar(e.label) === normalizar(texto))
  return repetido ? 'Ese elemento ya está en la lista' : null
}

// Objeto con todos los elementos (null = no evaluado): forma estable para los formularios.
export function completarElementos (estadoElementos, adicionales = []) {
  return Object.fromEntries(elementosDe(adicionales).map(({ key }) => [key, estadoElementos?.[key] ?? null]))
}

// Solo se guardan los elementos evaluados; sin ninguno devuelve null (no informado).
export function normalizarElementos (estadoElementos, adicionales = []) {
  const evaluados = elementosDe(adicionales).filter(({ key }) => estadoElementos?.[key])
  return evaluados.length ? Object.fromEntries(evaluados.map(({ key }) => [key, estadoElementos[key]])) : null
}

// Elementos evaluados en condición mala o inservible.
export const elementosCriticos = (estadoElementos, adicionales = []) =>
  elementosDe(adicionales).filter(({ key }) => CONDICIONES_CRITICAS.includes(estadoElementos?.[key]))

export const cantidadEvaluados = (estadoElementos, adicionales = []) =>
  elementosDe(adicionales).filter(({ key }) => estadoElementos?.[key]).length

/**
 * Conteo de bienes activos por condición (bueno, regular, malo, inservible y sin dato), ponderado por cantidad.
 * Los componentes cuentan como bienes del ambiente.
 */
export function conteoPorCondicion (bienes) {
  const conteo = { ...Object.fromEntries(Object.keys(CONDICIONES).map((c) => [c, 0])), sin_dato: 0 }
  for (const bien of bienes) {
    if (situacionDe(bien) !== 'activo') continue
    conteo[CONDICIONES[bien.condicion] ? bien.condicion : 'sin_dato'] += bien.cantidad ?? 1
  }
  return conteo
}
