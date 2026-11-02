<template>
  <form-dialog
    :model-value="modelValue"
    :titulo="foto ? 'Actualizar fotografía' : 'Incorporar fotografía'"
    :subtitulo="`${centro.id} · ${centro.nombre}`"
    :ancho="520"
    :etiqueta-enviar="foto ? 'Guardar cambios' : 'Incorporar'"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <note-banner tono="wa" icono="privacy_tip">
      No incluya imágenes de niñas, niños, adolescentes ni de otras personas. Fotografíe solo la infraestructura.
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
    <q-input v-model="form.titulo" outlined dense label="Título *" hint="Ej.: Fachada, techo del patio" :rules="[requerido]" />
    <q-input v-model="form.nota" outlined dense label="Nota" />
  </form-dialog>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import { actualizarFoto, registrarFoto } from 'src/services/acciones'
import { requerido } from 'src/utils/validaciones'

const MAX_BYTES = 5 * 1024 * 1024

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  centro: { type: Object, required: true },
  // null = fotografía nueva.
  foto: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue'])
const $q = useQuasar()

const form = reactive({ archivo: null, titulo: '', nota: '' })

watch(() => props.modelValue, (abierto) => {
  if (abierto) Object.assign(form, { archivo: null, titulo: props.foto?.titulo ?? '', nota: props.foto?.nota ?? '' })
})

function rechazada () {
  $q.notify({ type: 'warning', message: 'Solo se aceptan imágenes de hasta 5 MB.' })
}

// La imagen no sale del navegador: se muestra desde una URL local en memoria.
function guardar () {
  const url = form.archivo ? URL.createObjectURL(form.archivo) : null
  if (props.foto) {
    actualizarFoto(props.foto, { titulo: form.titulo, nota: form.nota, url })
  } else {
    registrarFoto(props.centro, { titulo: form.titulo, nota: form.nota, url })
  }
  $q.notify({ type: 'positive', message: props.foto ? 'Fotografía actualizada.' : 'Fotografía incorporada.' })
  emit('update:modelValue', false)
}
</script>
