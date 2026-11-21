// Retorno a la pantalla de origen para los componentes (SPEC 011, Olas 4 y 5): el origen solo se ofrece si el perfil
// actual todavía puede ver esa pantalla. `avisarGuardado` añade «Volver a ‹origen›» al aviso de una tarea terminada.
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { usePerfil } from './usePerfil'
import { origen, volver } from 'src/router/retorno'

export function useRetorno () {
  const $q = useQuasar()
  const { puedeAcceder } = usePerfil()

  const destino = computed(() => (origen.value && puedeAcceder(origen.value.nombre) ? origen.value : null))

  // Aviso de guardado. Con `conRetorno` (la tarea se abrió desde un enlace) y un origen visible, el aviso dura más y ofrece volver.
  function avisarGuardado (message, { conRetorno = false } = {}) {
    const d = conRetorno ? destino.value : null
    $q.notify({
      type: 'positive',
      message,
      ...(d
        ? { timeout: 8000, actions: [{ label: `Volver a ${d.titulo}`, color: 'white', noCaps: true, handler: volver }] }
        : {})
    })
  }

  return { destino, volver, avisarGuardado }
}
