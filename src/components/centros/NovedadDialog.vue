<template>
  <form-dialog
    :model-value="modelValue"
    :titulo="novedad ? 'Actualizar novedad' : 'Registrar novedad'"
    :subtitulo="ambiente.nombre"
    :etiqueta-enviar="novedad ? 'Guardar cambios' : 'Registrar'"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <div class="row q-col-gutter-md">
      <q-select v-model="form.tipo" class="col-12 col-sm-6" :options="OPCIONES_NOVEDAD" emit-value map-options outlined dense label="Tipo *" :rules="[requerido]">
        <template #append><boton-dictado v-model="form.tipo" tipo="opcion" :opciones="OPCIONES_NOVEDAD" emit-value /></template>
      </q-select>
      <q-input v-model="form.fecha" class="col-12 col-sm-6" outlined dense type="date" stack-label label="Fecha *" :rules="[requerido, noFutura]">
        <template #append><boton-dictado v-model="form.fecha" tipo="fecha" /></template>
      </q-input>
    </div>
    <q-input v-model="form.titulo" outlined dense label="Novedad *" :rules="[requerido]">
      <template #append><boton-dictado v-model="form.titulo" /></template>
    </q-input>
    <q-input v-model="form.detalle" outlined dense type="textarea" autogrow label="Detalle">
      <template #append><boton-dictado v-model="form.detalle" /></template>
    </q-input>
    <q-input v-model="form.ubicacion" outlined dense label="Ubicación dentro del ambiente">
      <template #append><boton-dictado v-model="form.ubicacion" /></template>
    </q-input>
    <q-checkbox v-model="form.requiereEvaluacion" label="Requiere evaluación de infraestructura" />
  </form-dialog>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import { actualizarNovedad, registrarNovedad } from 'src/services/acciones'
import { OPCIONES_NOVEDAD } from 'src/config/catalogos'
import { FECHA_CORTE } from 'src/config/demo'
import { noFutura, requerido } from 'src/utils/validaciones'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  ambiente: { type: Object, required: true },
  // null = novedad nueva.
  novedad: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue'])
const $q = useQuasar()

const form = reactive({})

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  const n = props.novedad
  Object.assign(form, {
    tipo: n?.tipo ?? 'dano',
    fecha: n?.fecha ?? FECHA_CORTE,
    titulo: n?.titulo ?? '',
    detalle: n?.detalle ?? '',
    ubicacion: n && n.ubicacion !== 'No informada' ? n.ubicacion : '',
    requiereEvaluacion: n?.requiereEvaluacion ?? false
  })
})

function guardar () {
  const datos = {
    tipo: form.tipo,
    fecha: form.fecha,
    titulo: form.titulo,
    detalle: form.detalle,
    ubicacion: form.ubicacion || 'No informada',
    requiereEvaluacion: form.requiereEvaluacion
  }
  if (props.novedad) actualizarNovedad(props.novedad, datos)
  else registrarNovedad(props.ambiente, datos)
  $q.notify({ type: 'positive', message: props.novedad ? 'Novedad actualizada.' : 'Novedad registrada.' })
  emit('update:modelValue', false)
}
</script>
