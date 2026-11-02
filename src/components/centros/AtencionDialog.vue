<template>
  <form-dialog
    :model-value="modelValue"
    titulo="Marcar novedad como atendida"
    :subtitulo="novedad.titulo"
    :ancho="480"
    etiqueta-enviar="Marcar como atendida"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <q-input v-model="form.fecha" outlined dense type="date" stack-label label="Fecha de atención *" :rules="[requerido, noFutura]" />
    <q-input v-model="form.detalle" outlined dense type="textarea" autogrow label="Cómo se atendió" />
    <note-banner v-if="novedad.requiereEvaluacion" tono="in">
      La necesidad de infraestructura asociada dejará de figurar en evaluación.
    </note-banner>
  </form-dialog>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import { atenderNovedad } from 'src/services/acciones'
import { FECHA_CORTE } from 'src/config/demo'
import { noFutura, requerido } from 'src/utils/validaciones'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  novedad: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue'])
const $q = useQuasar()

const form = reactive({ fecha: FECHA_CORTE, detalle: '' })

// `immediate`: la página monta este diálogo al elegir la primera novedad, ya abierto.
watch(() => props.modelValue, (abierto) => {
  if (abierto) Object.assign(form, { fecha: FECHA_CORTE, detalle: '' })
}, { immediate: true })

function guardar () {
  atenderNovedad(props.novedad, form)
  $q.notify({ type: 'positive', message: 'Novedad marcada como atendida.' })
  emit('update:modelValue', false)
}
</script>
