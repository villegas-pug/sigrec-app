import { ref } from 'vue'
import { useQuasar } from 'quasar'

export function useGuardado (accion) {
  const $q = useQuasar()
  const guardando = ref(false)

  async function guardar () {
    if (guardando.value) return
    guardando.value = true
    try {
      await accion()
    } catch (error) {
      $q.notify({ type: 'negative', message: error.message })
    } finally {
      guardando.value = false
    }
  }

  return { guardando, guardar }
}
