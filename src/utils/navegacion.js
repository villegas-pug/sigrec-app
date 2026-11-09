// Ayudas para enlaces profundos: los parámetros de la URL solo identifican un registro dentro de lo que el perfil ya puede ver.
import { nextTick, unref } from 'vue'

// Alto de la cabecera fija más un margen: un destino por encima de esta línea queda tapado.
const MARGEN_CABECERA = 88

// Un parámetro repetido llega como arreglo; se usa el primero.
export const parametro = (valor) => (Array.isArray(valor) ? valor[0] : valor) ?? null

// Busca el registro pedido en una lista ya filtrada por ámbito.
// `noDisponible` solo es verdadero si se pidió un id y no existe o está fuera del ámbito: en ese caso no se elige otro registro.
export function registroSolicitado (id, lista, clave = 'id') {
  const pedido = parametro(id)
  if (!pedido) return { registro: null, noDisponible: false }
  const registro = lista.find((r) => r[clave] === pedido) ?? null
  return { registro, noDisponible: !registro }
}

/**
 * Tras elegir un registro en la misma pantalla, baja hasta su detalle si el inicio del detalle no está a la vista
 * (SPEC 011, Ola 4). Acepta un elemento, un componente o una ref a cualquiera de ellos; se resuelve después de renderizar,
 * así sirve también para un detalle que recién aparece. Sin animación si se prefiere movimiento reducido.
 */
export async function mostrarDetalle (destino) {
  await nextTick()
  const valor = unref(destino)
  const el = valor?.$el ?? valor
  if (!el?.getBoundingClientRect) return
  const { top } = el.getBoundingClientRect()
  if (top >= MARGEN_CABECERA && top <= window.innerHeight - 120) return
  const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reducido ? 'auto' : 'smooth', block: 'start' })
}
