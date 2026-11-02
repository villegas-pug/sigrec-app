<template>
  <q-dialog :model-value="modelValue" :maximized="$q.screen.lt.sm" @update:model-value="$emit('update:modelValue', $event)">
    <q-card class="sg-dialog" :style="{ width: `${ancho}px` }">
      <q-card-section>
        <h2 class="text-h6 text-weight-bold q-my-none">{{ titulo }}</h2>
        <p v-if="subtitulo" class="sg-muted q-mb-none">{{ subtitulo }}</p>
      </q-card-section>
      <q-card-section>
        <q-form class="column q-gutter-y-md" @submit="$emit('enviar')">
          <slot />
          <div class="row justify-end q-gutter-sm">
            <q-btn flat color="secondary" label="Cancelar" v-close-popup />
            <q-btn unelevated :color="colorEnviar" type="submit" :label="etiquetaEnviar" :disable="deshabilitarEnviar" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
// Diálogo de formulario común: título, campos (slot), Cancelar y Enviar. En pantallas pequeñas se maximiza.
defineProps({
  modelValue: { type: Boolean, default: false },
  titulo: { type: String, required: true },
  subtitulo: { type: String, default: '' },
  ancho: { type: Number, default: 560 },
  etiquetaEnviar: { type: String, default: 'Guardar' },
  colorEnviar: { type: String, default: 'primary' },
  deshabilitarEnviar: { type: Boolean, default: false }
})

defineEmits(['update:modelValue', 'enviar'])
</script>
