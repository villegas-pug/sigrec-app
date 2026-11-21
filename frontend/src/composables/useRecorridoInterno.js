// Recorrido dentro de una misma pantalla (SPEC 011, Ola 5): al saltar de una ficha a otra por un enlace del contenido
// (p. ej. de un bien a su componente o a su reposición) se recuerda la ficha anterior para ofrecer «Volver a ‹ficha›».
// La pila se guarda en la entrada del historial (useEstadoNavegacion): sobrevive a «Volver», «Atrás» y a la recarga.
// La navegación principal de la pantalla (p. ej. un clic en el árbol) la vacía.
import { computed, ref } from 'vue'
import { useEstadoNavegacion } from './useEstadoNavegacion'

export const MAXIMO_RECORRIDO = 10

// Funciones puras sobre la pila: [{ valor, etiqueta }], del más antiguo al más reciente.
export const apilarEn = (pila, valor, etiqueta) => [...pila, { valor, etiqueta }].slice(-MAXIMO_RECORRIDO)
export const desapilarDe = (pila) => pila.slice(0, -1)

/**
 * `clave` identifica la pantalla en `history.state`. `valor` debe poder clonarse (texto, número u objeto simple).
 * Devuelve { anterior, apilar(valor, etiqueta), regresar() → valor | null, vaciar() }.
 */
export function useRecorridoInterno (clave) {
  const pila = ref([])
  useEstadoNavegacion(`recorrido-${clave}`, { pila })

  const anterior = computed(() => pila.value.at(-1) ?? null)

  function apilar (valor, etiqueta) {
    pila.value = apilarEn(pila.value, valor, etiqueta)
  }

  function regresar () {
    const ultimo = anterior.value
    if (!ultimo) return null
    pila.value = desapilarDe(pila.value)
    return ultimo.valor
  }

  function vaciar () {
    if (pila.value.length) pila.value = []
  }

  return { anterior, apilar, regresar, vaciar }
}
