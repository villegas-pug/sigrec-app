<template>
  <form-dialog
    :model-value="modelValue"
    :titulo="titulo"
    :subtitulo="subtitulo"
    :ancho="460"
    :etiqueta-enviar="hecho ? 'Guardar cambios' : 'Registrar'"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <q-option-group v-if="tipoEditable" v-model="form.tipo" inline :options="OPCIONES_SUMINISTRO" />
    <q-input v-model="form.fecha" outlined dense type="date" stack-label label="Fecha *" :rules="[requerido, noFutura]" />
    <q-input v-model="form.detalle" outlined dense type="textarea" autogrow label="Detalle">
      <template #append><boton-dictado v-model="form.detalle" /></template>
    </q-input>
  </form-dialog>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import { actualizarHechoServicio, informarHechoServicio } from 'src/services/acciones'
import { HECHOS_SERVICIO, TIPOS_SERVICIO } from 'src/config/catalogos'
import { FECHA_CORTE } from 'src/config/demo'
import { noFutura, requerido } from 'src/utils/validaciones'

const OPCIONES_SUMINISTRO = [
  { label: 'Interrupción', value: 'interrupcion' },
  { label: 'Restablecimiento', value: 'restablecimiento' }
]

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  servicio: { type: Object, required: true },
  // null = hecho nuevo del tipo indicado en `tipoInicial`.
  hecho: { type: Object, default: null },
  tipoInicial: { type: String, default: 'interrupcion' }
})

const emit = defineEmits(['update:modelValue'])
const $q = useQuasar()

const form = reactive({ tipo: 'interrupcion', fecha: FECHA_CORTE, detalle: '' })

// Los pagos y las correcciones de período los genera la situación del período; solo se corrigen su fecha y detalle.
const tipoEditable = computed(() => ['interrupcion', 'restablecimiento'].includes(form.tipo))
const titulo = computed(() => (props.hecho ? 'Actualizar hecho del servicio' : `Informar ${form.tipo === 'interrupcion' ? 'interrupción' : 'restablecimiento'}`))
const subtitulo = computed(() => `${TIPOS_SERVICIO[props.servicio.tipo]}${props.hecho ? ` · ${HECHOS_SERVICIO[props.hecho.tipo]?.label ?? props.hecho.tipo}` : ''}`)

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  const h = props.hecho
  Object.assign(form, { tipo: h?.tipo ?? props.tipoInicial, fecha: h?.fecha ?? FECHA_CORTE, detalle: h?.detalle ?? '' })
})

function guardar () {
  const datos = { tipo: form.tipo, fecha: form.fecha, detalle: form.detalle || 'Sin detalle informado.' }
  if (props.hecho) actualizarHechoServicio(props.hecho, datos)
  else informarHechoServicio(props.servicio, datos)
  $q.notify({ type: 'positive', message: props.hecho ? 'Hecho del servicio actualizado.' : 'Hecho del servicio registrado.' })
  emit('update:modelValue', false)
}
</script>
