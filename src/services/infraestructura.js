// Estado de la infraestructura por elemento (ambiente, módulo y construcción del centro) y resumen del mobiliario a partir de los bienes.
// Centros y módulos pueden sumar elementos propios a la lista base (SPEC 022): `adicionales` = [{ key, label }].
// Sin `adicionales`, cada función se comporta como la lista base (el ambiente no tiene elementos agregados).
import { CONDICIONES, CONDICIONES_CRITICAS, ELEMENTOS_INFRAESTRUCTURA } from 'src/config/catalogos'
import { identificador } from 'src/utils/formato'
import { normalizar } from 'src/utils/interpretacionVoz'

export const LARGO_MAXIMO_ELEMENTO = 40

// Lista base seguida de los elementos agregados del registro.
export const elementosDe = (adicionales = []) => [
  ...ELEMENTOS_INFRAESTRUCTURA,
  ...(adicionales ?? []).map((a) => ({ ...a, icono: 'add_box', adicional: true }))
]

// Clave de un elemento agregado: no colisiona con las claves de la lista base.
export const claveElemento = (nombre) => `extra-${identificador(nombre)}`

// Motivo por el que un nombre no puede agregarse (null = válido): vacío, largo o repetido (sin distinguir tildes ni mayúsculas).
export function motivoElementoInvalido (nombre, adicionales = []) {
  const texto = String(nombre ?? '').trim()
  if (!texto) return 'Escriba el nombre del elemento'
  if (texto.length > LARGO_MAXIMO_ELEMENTO) return `Use ${LARGO_MAXIMO_ELEMENTO} caracteres como máximo`
  const repetido = elementosDe(adicionales).some((e) => normalizar(e.label) === normalizar(texto) || e.key === claveElemento(texto))
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
    if (bien.situacion !== 'activo') continue
    conteo[CONDICIONES[bien.condicion] ? bien.condicion : 'sin_dato'] += bien.cantidad ?? 1
  }
  return conteo
}
