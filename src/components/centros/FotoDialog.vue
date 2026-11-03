<template>
  <form-dialog
    :model-value="modelValue"
    :titulo="foto ? 'Actualizar fotografía' : 'Incorporar fotografía'"
    :subtitulo="`${(bien || centro).id} · ${(bien || centro).nombre}`"
    :ancho="520"
    :etiqueta-enviar="foto ? 'Guardar cambios' : 'Incorporar'"
    :modificado="modificado"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <note-banner tono="wa" icono="privacy_tip">
      No incluya imágenes de niñas, niños, adolescentes ni de otras personas. Fotografíe solo el bien o la infraestructura.
    </note-banner>
    <q-file
      v-model="form.archivo"
      outlined
      dense
      accept="image/*"
      :max-file-size="MAX_BYTES"
      :label="foto ? 'Reemplazar imagen' : 'Imagen *'"
      :hint="foto ? 'Opcional: sin imagen nueva se conserva la actual.' : 'Hasta 5 MB. En el prototipo se conserva solo durante la sesión.'"
      :rules="foto ? [] : [(v) => !!v || 'Seleccione una imagen']"
      @rejected="rechazada"
    >
      <template #prepend><q-icon name="image" /></template>
    </q-file>
    <q-select
      v-if="!bien"
      v-model="form.ambienteId"
      :options="opcionesAmbiente"
      emit-value
      map-options
      clearable
      outlined
      dense
      label="Ambiente"
      hint="Opcional. Sin ambiente, la fotografía queda como del centro."
      :readonly="ambienteFijo"
    />
    <q-input v-model="form.titulo" outlined dense label="Título *" hint="Ej.: Fachada, techo del patio" :rules="[requerido]">
      <template #append><boton-dictado v-model="form.titulo" /></template>
    </q-input>
    <q-input v-model="form.nota" outlined dense label="Nota">
      <template #append><boton-dictado v-model="form.nota" /></template>
    </q-input>
  </form-dialog>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import { useBorrador } from 'src/composables/useBorrador'
import { ambientesDeCar } from 'src/services/datos'
import { actualizarFoto, registrarFoto } from 'src/services/acciones'
import { requerido } from 'src/utils/validaciones'
import { FECHA_CORTE } from 'src/config/demo'

const MAX_BYTES = 5 * 1024 * 1024

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  centro: { type: Object, default: null },
  bien: { type: Object, default: null },
  // null = fotografía nueva.
  foto: { type: Object, default: null },
  // Ambiente en cuya galería se incorpora la fotografía (queda fijo); null = el usuario puede elegirlo o dejarla en el centro.
  ambienteInicial: { type: String, default: null }
})

const emit = defineEmits(['update:modelValue'])
const $q = useQuasar()

const form = reactive({ archivo: null, titulo: '', nota: '', ambienteId: null })
const { modificado, fijar } = useBorrador(form)

const opcionesAmbiente = computed(() => (props.centro ? ambientesDeCar(props.centro.id) : []).map((a) => ({ label: a.nombre, value: a.id })))
const ambienteFijo = computed(() => !props.foto && !!props.ambienteInicial)

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  Object.assign(form, { archivo: null, titulo: props.foto?.titulo ?? '', nota: props.foto?.nota ?? '', ambienteId: props.foto ? props.foto.ambienteId ?? null : props.ambienteInicial })
  fijar()
})

function rechazada () {
  $q.notify({ type: 'warning', message: 'Solo se aceptan imágenes de hasta 5 MB.' })
}

// La imagen no sale del navegador: se muestra desde una URL local en memoria.
function guardar () {
  const url = form.archivo ? URL.createObjectURL(form.archivo) : null
  if (props.foto) {
    actualizarFoto(props.foto, { titulo: form.titulo, nota: form.nota, url, ambienteId: form.ambienteId })
  } else {
    if (props.bien) {
      props.bien.fotos ??= []
      props.bien.fotos.push({ titulo: form.titulo, nota: form.nota || null, url, fecha: FECHA_CORTE })
    } else registrarFoto(props.centro, { titulo: form.titulo, nota: form.nota, url, ambienteId: form.ambienteId })
  }
  $q.notify({ type: 'positive', message: props.foto ? 'Fotografía actualizada.' : 'Fotografía incorporada.' })
  emit('update:modelValue', false)
}
</script>
