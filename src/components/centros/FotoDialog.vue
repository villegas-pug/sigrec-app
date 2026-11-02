<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="width: 520px; max-width: 94vw">
      <q-card-section>
        <h2 class="text-h6 text-weight-bold q-my-none">Incorporar fotografía</h2>
        <p class="sg-muted q-mb-none">{{ local.id }} · {{ local.nombre }}</p>
      </q-card-section>
      <q-card-section>
        <q-form class="column q-gutter-y-md" @submit="guardar">
          <note-banner tono="wa" icono="privacy_tip">
            No incluya imágenes de niñas, niños, adolescentes ni de otras personas. Fotografíe solo la infraestructura.
          </note-banner>
          <q-file
            v-model="form.archivo"
            outlined
            dense
            accept="image/*"
            :max-file-size="MAX_BYTES"
            label="Imagen *"
            hint="Hasta 5 MB. En el prototipo se conserva solo durante la sesión."
            :rules="[(v) => !!v || 'Seleccione una imagen']"
            @rejected="rechazada"
          >
            <template #prepend><q-icon name="image" /></template>
          </q-file>
          <q-input v-model="form.titulo" outlined dense label="Título *" hint="Ej.: Fachada, techo del patio" :rules="[(v) => !!v || 'Campo obligatorio']" />
          <q-input v-model="form.nota" outlined dense label="Nota" />
          <div class="row justify-end q-gutter-sm">
            <q-btn flat color="secondary" label="Cancelar" v-close-popup />
            <q-btn unelevated color="primary" type="submit" label="Incorporar" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import NoteBanner from 'components/common/NoteBanner.vue'
import { registrarFoto } from 'src/services/acciones'

const MAX_BYTES = 5 * 1024 * 1024

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  local: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue'])
const $q = useQuasar()

const form = reactive({ archivo: null, titulo: '', nota: '' })

watch(() => props.modelValue, (abierto) => {
  if (abierto) Object.assign(form, { archivo: null, titulo: '', nota: '' })
})

function rechazada () {
  $q.notify({ type: 'warning', message: 'Solo se aceptan imágenes de hasta 5 MB.' })
}

// La imagen no sale del navegador: se muestra desde una URL local en memoria.
function guardar () {
  registrarFoto(props.local, { titulo: form.titulo, nota: form.nota, url: URL.createObjectURL(form.archivo) })
  $q.notify({ type: 'positive', message: 'Fotografía incorporada.' })
  emit('update:modelValue', false)
}
</script>
