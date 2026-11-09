<template>
  <q-dialog :model-value="modelValue" :maximized="$q.screen.lt.sm" @update:model-value="$emit('update:modelValue', $event)" @show="empezar" @hide="detener">
    <q-card class="sg-dialog" style="width: 480px">
      <q-card-section class="sg-dialog__header">
        <h2 class="text-h6 text-weight-bold q-my-none">{{ titulo }}</h2>
        <p class="sg-muted q-mb-none">Apunte la cámara al código QR o de barras del rótulo SIGREC. La imagen no se guarda ni se envía.</p>
      </q-card-section>
      <q-card-section class="column q-gutter-y-md">
        <div v-if="escaneoDisponible && estado !== 'error'" class="sg-escaner">
          <video ref="video" class="sg-escaner__video" muted playsinline aria-label="Vista de la cámara" />
          <div class="sg-escaner__marco" aria-hidden="true" />
          <q-inner-loading :showing="estado === 'iniciando'" label="Iniciando la cámara…" />
        </div>
        <note-banner v-else tono="wa" icono="no_photography">
          {{ error ?? 'Este navegador no permite leer códigos con la cámara.' }} Puede escribir el rótulo.
        </note-banner>
        <div v-if="ultimo" class="sg-chips items-center">
          <status-chip tono="ok" icono="qr_code_2" :label="`Leído: ${ultimo}`" />
          <span v-if="continuo" class="sg-muted">Siga escaneando o cierre al terminar.</span>
        </div>
        <q-input v-model="manual" outlined dense label="Rótulo (si no se puede escanear)" @keyup.enter="enviarManual">
          <template #append>
            <boton-dictado v-model="manual" tipo="codigo" />
            <q-btn flat round dense icon="arrow_forward" color="primary" aria-label="Usar el rótulo escrito" :disable="!manual" @click="enviarManual" />
          </template>
        </q-input>
      </q-card-section>
      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat color="secondary" icon="close" :label="continuo ? 'Terminar' : 'Cerrar'" @click="$emit('update:modelValue', false)" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
// Escáner del rótulo SIGREC (SPEC 011, Ola 3). Emite `leido` con el rótulo normalizado. Con `continuo` sigue leyendo
// (p. ej. en el recorrido de verificación) e ignora la repetición inmediata del mismo código; si no, se cierra tras la lectura.
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import BotonDictado from 'components/common/BotonDictado.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import StatusChip from 'components/common/StatusChip.vue'
import { escaneoDisponible, useEscaneo } from 'src/composables/useEscaneo'
import { rotuloDesdeCodigo } from 'src/services/busqueda'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  titulo: { type: String, default: 'Escanear rótulo' },
  continuo: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'leido'])

const $q = useQuasar()
const { estado, error, iniciar, detener } = useEscaneo()
const video = ref(null)
const manual = ref('')
const ultimo = ref(null)
let ultimaVez = 0

function entregar (texto) {
  const rotulo = rotuloDesdeCodigo(texto)
  if (!rotulo) return
  const ahora = Date.now()
  if (rotulo === ultimo.value && ahora - ultimaVez < 3000) return
  ultimo.value = rotulo
  ultimaVez = ahora
  if (navigator.vibrate) navigator.vibrate(60)
  emit('leido', rotulo)
  if (!props.continuo) emit('update:modelValue', false)
}

function empezar () {
  ultimo.value = null
  manual.value = ''
  if (escaneoDisponible && video.value) iniciar(video.value, entregar)
}

function enviarManual () {
  if (!manual.value) return
  entregar(manual.value)
  manual.value = ''
}
</script>

<style scoped>
.sg-escaner { position: relative; border-radius: 8px; overflow: hidden; background: #000; aspect-ratio: 4 / 3; }
.sg-escaner__video { width: 100%; height: 100%; object-fit: cover; display: block; }
.sg-escaner__marco { position: absolute; inset: 18%; border: 3px solid rgba(255, 255, 255, 0.85); border-radius: 12px; }
</style>
