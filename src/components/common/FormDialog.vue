<template>
  <q-dialog
    :model-value="modelValue"
    :no-route-dismiss="modificado"
    :maximized="$q.screen.lt.sm"
    @update:model-value="actualizarApertura"
  >
    <q-card class="sg-dialog" :style="{ width: `${ancho}px` }">
      <q-card-section class="sg-dialog__header">
        <h2 class="text-h6 text-weight-bold q-my-none">{{ titulo }}</h2>
        <p v-if="subtitulo" class="sg-muted q-mb-none">{{ subtitulo }}</p>
      </q-card-section>
      <q-form class="sg-dialog__form" @submit="$emit('enviar')">
        <q-card-section class="sg-dialog__body column q-gutter-y-md">
          <slot />
        </q-card-section>
        <q-card-actions align="right" class="sg-dialog__footer q-px-md q-pb-md q-gutter-sm">
          <div v-if="$slots.resumen" class="sg-dialog__summary" role="status"><slot name="resumen" /></div>
          <q-btn flat color="secondary" icon="close" :label="soloLectura ? 'Cerrar' : 'Cancelar'" @click="cerrar" />
          <q-btn v-if="!soloLectura" unelevated :color="colorEnviar" :icon="iconoEnviar" type="submit" :label="etiquetaEnviar" :disable="deshabilitarEnviar" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
// Diálogo de formulario común: título, campos (slot), Cancelar y Enviar. En pantallas pequeñas se maximiza.
// Con `modificado` pide confirmación antes de descartar lo escrito (Cancelar, Esc o clic exterior).
import { useQuasar } from 'quasar'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  titulo: { type: String, required: true },
  subtitulo: { type: String, default: '' },
  ancho: { type: Number, default: 560 },
  etiquetaEnviar: { type: String, default: 'Guardar' },
  iconoEnviar: { type: String, default: 'save' },
  colorEnviar: { type: String, default: 'primary' },
  deshabilitarEnviar: { type: Boolean, default: false },
  // El formulario tiene cambios sin guardar (ver useBorrador).
  modificado: { type: Boolean, default: false },
  // Solo consulta: sin botón de envío.
  soloLectura: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'enviar'])
const $q = useQuasar()
let confirmacionAbierta = false

function actualizarApertura (abierto) {
  if (abierto) emit('update:modelValue', true)
  else cerrar()
}

function cerrar () {
  if (confirmacionAbierta) return
  if (!props.modificado) {
    emit('update:modelValue', false)
    return
  }
  confirmacionAbierta = true
  $q.dialog({
    title: 'Cambios sin guardar',
    message: 'Hay datos escritos que no se han guardado. Si cierra ahora se descartarán.',
    persistent: true,
    cancel: { flat: true, icon: 'edit', label: 'Seguir editando', color: 'secondary' },
    ok: { unelevated: true, icon: 'delete_outline', label: 'Descartar', color: 'negative' }
  })
    .onOk(() => emit('update:modelValue', false))
    .onDismiss(() => { confirmacionAbierta = false })
}
</script>
