// «Volver a ‹pantalla de origen›» (SPEC 011, Ola 4). Al seguir un enlace a otra pantalla se recuerda de dónde se vino y la pantalla
// ofrece volver, paso a paso. El origen se guarda en la propia entrada del historial (`history.state`), igual que
// useEstadoNavegacion: sobrevive a la recarga y a «Atrás» y «Adelante». Volver usa el historial, así la pantalla de origen
// recupera sus filtros, su pestaña y su posición. El menú principal y el logo no ofrecen volver.
import { ref } from 'vue'

const CLAVE = 'sigrecOrigen'

// Origen de la entrada actual: { posicion, nombre, titulo } o null.
export const origen = ref(null)

let enrutador = null
let principal = false
let posicionActual = null

/**
 * Origen de una entrada nueva del historial (función pura).
 * - Navegación principal (menú o logo): sin origen.
 * - Misma pantalla (solo cambia la consulta) o entrada inicial: conserva el origen que ya tenía la pantalla.
 * - Otra pantalla: la pantalla anterior, con su posición en el historial.
 */
export function origenDeNavegacion ({ to, from, principal: esPrincipal = false, origenPrevio = null, posicionPrevia = null }) {
  if (esPrincipal) return null
  if (!from?.name || from.name === to?.name) return origenPrevio
  return { posicion: posicionPrevia, nombre: from.name, titulo: from.meta?.titulo ?? String(from.name) }
}

// La próxima navegación viene del menú principal o del logo: no ofrecerá volver.
export function marcarNavegacionPrincipal () {
  principal = true
}

export function instalarRetorno (router) {
  enrutador = router
  router.afterEach((to, from, failure) => {
    // La marca se consume siempre, aunque la navegación falle o se cancele (p. ej. un borrador sin guardar).
    const esPrincipal = principal
    principal = false
    if (failure || typeof window === 'undefined') return
    const estado = window.history.state ?? {}
    if (CLAVE in estado) {
      // Entrada ya visitada (Atrás, Adelante, recarga o reemplazo): se respeta su origen.
      origen.value = estado[CLAVE]
    } else {
      const nuevo = origenDeNavegacion({ to, from, principal: esPrincipal, origenPrevio: origen.value, posicionPrevia: posicionActual })
      window.history.replaceState({ ...estado, [CLAVE]: nuevo }, '')
      origen.value = nuevo
    }
    posicionActual = typeof estado.position === 'number' ? estado.position : null
  })
}

// Vuelve por el historial hasta la entrada de origen; si no se puede, abre la pantalla de origen.
export function volver () {
  const o = origen.value
  if (!o || !enrutador) return
  if (typeof o.posicion === 'number' && typeof posicionActual === 'number' && o.posicion < posicionActual) {
    enrutador.go(o.posicion - posicionActual)
  } else {
    enrutador.push({ name: o.nombre })
  }
}
