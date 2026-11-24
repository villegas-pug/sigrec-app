// SPEC 055. Unidad orgánica del filtro de solo lectura «Línea de intervención»: se pide una vez por sesión.
import { ref } from 'vue'
import { api } from 'src/services/api'
import { LINEA_INTERVENCION_ID } from 'src/composables/useFiltrosCabecera'

const linea = ref(null)
const cargando = ref(false)
const error = ref('')
let promesa = null

export function reiniciarLineaIntervencion () {
  linea.value = null
  error.value = ''
  promesa = null
}

function cargar () {
  if (promesa) return promesa
  cargando.value = true
  const actual = promesa = api(`/centros/unidades-organicas/${LINEA_INTERVENCION_ID}`)
    .then((unidad) => { if (promesa === actual) linea.value = unidad })
    .catch((e) => { if (promesa === actual) { error.value = e.message; promesa = null } })
    .finally(() => { cargando.value = false })
  return actual
}

export function useLineaIntervencion () {
  if (!linea.value) cargar()
  return { linea, cargando, error }
}
