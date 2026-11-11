<template>
  <form-dialog
    :model-value="modelValue"
    :icono-enviar="intervencion ? 'save' : 'add'"
    :titulo="intervencion ? 'Actualizar intervención' : 'Registrar intervención'"
    :subtitulo="etiquetaAmbiente(ambiente)"
    :ancho="480"
    :etiqueta-enviar="intervencion ? 'Guardar cambios' : 'Registrar'"
    :modificado="modificado"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <q-input v-model="form.descripcion" outlined dense label="Intervención *" hint="Ej.: Pintado de muros, cambio de chapa" :rules="[requerido]">
      <template #append><boton-dictado v-model="form.descripcion" /></template>
    </q-input>
    <q-input v-model="form.fecha" outlined dense type="month" stack-label label="Mes" hint="Vacío si no se conoce" :rules="[noFutura]">
      <template #append><boton-dictado v-model="form.fecha" tipo="mes" /></template>
    </q-input>
    <q-checkbox v-model="form.esPintado" label="Es un pintado (actualiza el último pintado si es más reciente)" />
  </form-dialog>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import { useBorrador } from 'src/composables/useBorrador'
import { actualizarIntervencion, registrarIntervencion } from 'src/services/acciones'
import { noFutura, requerido } from 'src/utils/validaciones'
import { etiquetaAmbiente } from 'src/services/datos'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  ambiente: { type: Object, required: true },
  // null = intervención nueva.
  intervencion: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue'])
const $q = useQuasar()

const form = reactive({})
const { modificado, fijar } = useBorrador(form)

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  const i = props.intervencion
  Object.assign(form, { descripcion: i?.descripcion ?? '', fecha: i?.fecha ?? '', esPintado: i?.esPintado ?? false })
  fijar()
})

function guardar () {
  if (props.intervencion) actualizarIntervencion(props.ambiente, props.intervencion, form)
  else registrarIntervencion(props.ambiente, form)
  $q.notify({ type: 'positive', message: props.intervencion ? 'Intervención actualizada.' : 'Intervención registrada.' })
  emit('update:modelValue', false)
}
</script>
