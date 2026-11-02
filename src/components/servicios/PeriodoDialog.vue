<template>
  <form-dialog
    :model-value="modelValue"
    titulo="Informar situación del período"
    :subtitulo="`${TIPOS_SERVICIO[servicio.tipo]} · ${celda?.etiqueta ?? ''} ${anio}`"
    :ancho="460"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <q-option-group v-model="form.estado" :options="OPCIONES_ESTADO" />
    <q-input v-if="form.estado === 'pendiente'" v-model="form.vence" outlined dense type="date" stack-label label="Fecha de vencimiento (si se conoce)" />
    <note-banner v-if="retrocede" tono="wa" icono="warning">
      Este cambio deja una corrección en los hechos del servicio.
    </note-banner>
  </form-dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import { informarPeriodo } from 'src/services/acciones'
import { TIPOS_SERVICIO } from 'src/config/catalogos'

const OPCIONES_ESTADO = [
  { label: 'Pagado', value: 'pagado' },
  { label: 'Pendiente conocido', value: 'pendiente' },
  { label: 'Sin información', value: 'sin_info' }
]

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  servicio: { type: Object, required: true },
  celda: { type: Object, default: null },
  anio: { type: Number, required: true }
})

const emit = defineEmits(['update:modelValue'])
const $q = useQuasar()

const form = reactive({ estado: 'pagado', vence: '' })

// El estado de partida es el de la celda; «por venir» no existe como opción y parte de «pagado».
const estadoInicial = computed(() => (props.celda?.estado === 'por_venir' ? 'pagado' : props.celda?.estado ?? 'pagado'))
const retrocede = computed(
  () => (props.celda?.estado === 'pagado' && form.estado !== 'pagado') || (props.celda?.estado === 'pendiente' && form.estado === 'sin_info')
)

// `immediate`: la página monta este diálogo al elegir la primera celda, ya abierto.
watch(() => props.modelValue, (abierto) => {
  if (abierto) Object.assign(form, { estado: estadoInicial.value, vence: props.celda?.vence ?? '' })
}, { immediate: true })

function guardar () {
  informarPeriodo(props.servicio, props.anio, props.celda.numero, form)
  $q.notify({ type: 'positive', message: 'Situación del período registrada.' })
  emit('update:modelValue', false)
}
</script>
