<template>
  <form-dialog
    :model-value="modelValue"
    :icono-enviar="tipo ? 'save' : 'add'"
    :titulo="tipo ? 'Actualizar tipo de bien' : 'Registrar tipo de bien'"
    :subtitulo="tipo ? tipo.id : 'El precio referencial se informa después'"
    :ancho="480"
    :etiqueta-enviar="tipo ? 'Guardar cambios' : 'Registrar tipo'"
    :modificado="modificado"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <q-input v-model="form.nombre" outlined dense label="Nombre *" hint="Ej.: Cocina industrial, Silla de estudio" :rules="[requerido, nombreLibre]">
      <template #append><boton-dictado v-model="form.nombre" /></template>
    </q-input>
    <q-select v-model="form.categoria" :options="OPCIONES_CATEGORIA" emit-value map-options outlined dense label="Categoría *" :rules="[requerido]">
      <template #append><boton-dictado v-model="form.categoria" tipo="opcion" :opciones="OPCIONES_CATEGORIA" emit-value /></template>
    </q-select>
    <q-input
      v-model.number="form.vidaUtilSugerida"
      outlined
      dense
      type="number"
      min="1"
      label="Vida útil sugerida (años)"
      hint="Opcional: se propone al registrar un bien de este tipo. No es tabla oficial.">
      <template #append><boton-dictado v-model="form.vidaUtilSugerida" tipo="numero" /></template>
    </q-input>
  </form-dialog>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import { useBorrador } from 'src/composables/useBorrador'
import { db } from 'src/services/datos'
import { actualizarTipoBien, registrarTipoBien } from 'src/services/acciones'
import { OPCIONES_CATEGORIA } from 'src/config/catalogos'
import { requerido } from 'src/utils/validaciones'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // null = tipo nuevo.
  tipo: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue'])
const $q = useQuasar()

const normalizar = (v) => String(v ?? '').trim().toLowerCase()
const nombreLibre = (v) =>
  !db.tiposBien.some((t) => t.id !== props.tipo?.id && !t.anulacion && normalizar(t.nombre) === normalizar(v)) || 'Ya existe un tipo de bien con ese nombre'

const form = reactive({ nombre: '', categoria: null, vidaUtilSugerida: null })
const { modificado, fijar } = useBorrador(form)

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  Object.assign(form, {
    nombre: props.tipo?.nombre ?? '',
    categoria: props.tipo?.categoria ?? null,
    vidaUtilSugerida: props.tipo?.vidaUtilSugerida ?? null
  })
  fijar()
})

function guardar () {
  if (props.tipo) actualizarTipoBien(props.tipo, form)
  else registrarTipoBien(form)
  $q.notify({ type: 'positive', message: props.tipo ? 'Tipo de bien actualizado.' : 'Tipo de bien registrado.' })
  emit('update:modelValue', false)
}
</script>
