// Detecta si un formulario fue modificado respecto de su estado base y, en páginas, pide confirmación antes de salir.
// Uso en un diálogo: const { modificado, fijar } = useBorrador(form); tras reiniciar el formulario, llamar a `fijar()`.
// Uso en una página: useBorrador(form, { proteger: true }); tras guardar, llamar a `fijar()` antes de navegar.
// `confirmarDescarte()` devuelve una promesa: true si no hay cambios o la persona elige «Descartar»; false si sigue editando.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useQuasar } from 'quasar'

// `excluir` lista campos de contexto que se completan solos (p. ej. el centro preseleccionado) y no cuentan como cambios.
export function useBorrador (form, { proteger = false, excluir = [] } = {}) {
  const $q = useQuasar()
  const instantanea = () => JSON.stringify(form, (clave, valor) => (excluir.includes(clave) ? undefined : valor))
  const base = ref(instantanea())

  const modificado = computed(() => instantanea() !== base.value)
  const fijar = () => { base.value = instantanea() }

  const confirmarDescarte = () => {
    if (!modificado.value) return Promise.resolve(true)
    return new Promise((resolver) => {
      $q.dialog({
        title: 'Cambios sin guardar',
        message: 'Hay datos escritos que no se han guardado. Si sale ahora se descartarán.',
        persistent: true,
        cancel: { flat: true, label: 'Seguir editando', color: 'secondary' },
        ok: { unelevated: true, label: 'Descartar', color: 'negative' }
      })
        .onOk(() => resolver(true))
        .onCancel(() => resolver(false))
    })
  }

  if (proteger) {
    const antesDeCerrar = (e) => {
      if (!modificado.value) return
      e.preventDefault()
      e.returnValue = ''
    }
    onMounted(() => window.addEventListener('beforeunload', antesDeCerrar))
    onBeforeUnmount(() => window.removeEventListener('beforeunload', antesDeCerrar))

    onBeforeRouteLeave(() => confirmarDescarte())
  }

  return { modificado, fijar, confirmarDescarte }
}
