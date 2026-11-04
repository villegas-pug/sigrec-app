<template>
  <q-dialog :model-value="modelValue" :maximized="$q.screen.lt.sm" @update:model-value="$emit('update:modelValue', $event)" @hide="$emit('hide')">
    <q-card v-if="foto" class="sg-gallery-viewer" tabindex="0" role="dialog" aria-modal="true" :aria-label="`Fotografía: ${foto.titulo}`" @keydown.left.prevent.stop="anterior" @keydown.right.prevent.stop="siguiente">
      <q-card-section class="sg-gallery-viewer__header">
        <div class="sg-gallery-viewer__details">
          <h2 class="text-h6 q-my-none">{{ foto.titulo }}</h2>
          <div class="sg-muted">{{ fecha(foto.fecha) }} · {{ contexto(foto) }}</div>
          <div v-if="foto.nota" class="sg-muted">{{ foto.nota }}</div>
        </div>
        <q-btn v-close-popup flat round icon="close" aria-label="Cerrar visor de fotografías" />
      </q-card-section>
      <div class="sg-gallery-viewer__body" @touchstart.passive="iniciarGesto" @touchend.passive="terminarGesto" @touchcancel="toque = null">
        <q-btn flat round icon="chevron_left" aria-label="Fotografía anterior" :disable="indice <= 0" @click="anterior" />
        <img :src="foto.url" :alt="foto.titulo" @error="$emit('error-imagen', foto.url)">
        <q-btn flat round icon="chevron_right" aria-label="Fotografía siguiente" :disable="indice >= fotos.length - 1" @click="siguiente" />
      </div>
      <q-card-actions class="sg-gallery-viewer__footer">
        <span aria-live="polite">{{ indice + 1 }} de {{ fotos.length }} fotografías</span>
        <q-btn flat icon="download" label="Descargar imagen" @click="$emit('descargar', foto)" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { fecha } from 'src/utils/formato'

const props = defineProps({
  modelValue: Boolean,
  fotos: { type: Array, required: true },
  indiceInicial: { type: Number, default: 0 },
  contexto: { type: Function, required: true }
})
const emit = defineEmits(['update:modelValue', 'hide', 'descargar', 'error-imagen'])
const indice = ref(0)
const foto = computed(() => props.fotos[indice.value])
const toque = ref(null)
watch(() => props.modelValue, (abierto) => { if (abierto) indice.value = props.indiceInicial })
watch(() => props.fotos.length, (longitud) => {
  if (!longitud && props.modelValue) emit('update:modelValue', false)
  else if (indice.value >= longitud) indice.value = Math.max(0, longitud - 1)
})
function anterior () { if (indice.value > 0) indice.value-- }
function siguiente () { if (indice.value < props.fotos.length - 1) indice.value++ }
function iniciarGesto (evento) {
  const punto = evento.changedTouches[0]
  toque.value = punto ? { x: punto.clientX, y: punto.clientY } : null
}
function terminarGesto (evento) {
  const punto = evento.changedTouches[0]
  if (toque.value && punto) {
    const dx = punto.clientX - toque.value.x
    const dy = punto.clientY - toque.value.y
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) dx < 0 ? siguiente() : anterior()
  }
  toque.value = null
}
</script>
