<template>
  <q-dialog :model-value="modelValue" :maximized="$q.screen.lt.sm" @update:model-value="$emit('update:modelValue', $event)" @show="empezar" @hide="detener">
    <q-card class="sg-dialog" style="width: 480px">
      <q-card-section class="sg-dialog__header">
        <h2 class="text-h6 text-weight-bold q-my-none">{{ titulo }}</h2>
        <p class="sg-muted q-mb-none">
          Acerque el código QR del rótulo SIGREC a la cámara (en una laptop, a unos 15–20 cm de la webcam). La imagen no se guarda ni se envía.
        </p>
      </q-card-section>
      <q-card-section class="column q-gutter-y-md">
        <div v-if="camaraDisponible && estado !== 'error'" class="sg-escaner">
          <video ref="video" class="sg-escaner__video" :class="{ 'sg-escaner__video--espejo': espejo }" muted playsinline aria-label="Vista de la cámara" />
          <div class="sg-escaner__marco" aria-hidden="true" />
          <q-inner-loading :showing="estado === 'iniciando'" label="Iniciando la cámara…" />
          <q-btn
            v-if="camaras.length > 1 && estado === 'leyendo'"
            round
            dense
            color="white"
            text-color="dark"
            icon="cameraswitch"
            class="sg-escaner__cambiar"
            aria-label="Cambiar de cámara"
            @click="cambiarCamara"
          >
            <q-tooltip>Cambiar de cámara</q-tooltip>
          </q-btn>
        </div>
        <note-banner v-else tono="wa" icono="no_photography">
          {{ error ?? 'Este equipo no permite usar la cámara.' }}
        </note-banner>
        <div v-if="ultimo" class="sg-chips items-center">
          <status-chip tono="ok" icono="qr_code_2" :label="`Leído: ${ultimo}`" />
          <span v-if="continuo" class="sg-muted">Siga escaneando o cierre al terminar.</span>
        </div>
        <!-- Un lector de códigos USB o Bluetooth escribe el rótulo y pulsa Enter, como un teclado. -->
        <q-input
          ref="entrada"
          v-model="manual"
          outlined
          dense
          label="Rótulo (si no se puede escanear)"
          hint="Escriba el rótulo o use un lector de códigos USB"
          @keyup.enter="enviarManual"
        >
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
// Escáner del rótulo SIGREC (SPEC 011, Olas 3 y 4). Funciona en móviles y en PC o laptops con webcam. Emite `leido` con el rótulo
// normalizado. Con `continuo` sigue leyendo (p. ej. en el recorrido de verificación) e ignora la repetición inmediata del mismo
// código; si no, se cierra tras la lectura. Sin cámara, el campo manual recibe el foco (sirve también para un lector USB).
import { nextTick, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import BotonDictado from 'components/common/BotonDictado.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import StatusChip from 'components/common/StatusChip.vue'
import { camaraDisponible, useEscaneo } from 'src/composables/useEscaneo'
import { rotuloDesdeCodigo } from 'src/services/busqueda'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  titulo: { type: String, default: 'Escanear rótulo' },
  continuo: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'leido'])

const $q = useQuasar()
const { estado, error, espejo, camaras, iniciar, detener, reiniciar, cambiarCamara } = useEscaneo()
const video = ref(null)
const entrada = ref(null)
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

const enfocarManual = () => nextTick(() => entrada.value?.focus())

async function empezar () {
  ultimo.value = null
  manual.value = ''
  reiniciar()
  if (!camaraDisponible) {
    enfocarManual()
    return
  }
  await nextTick()
  if (video.value) iniciar(video.value, entregar)
}

// Si la cámara falla (sin permiso, sin cámara o en uso), se pasa a escribir el rótulo.
watch(estado, (valor) => { if (valor === 'error') enfocarManual() })

function enviarManual () {
  if (!manual.value) return
  entregar(manual.value)
  manual.value = ''
}
</script>

<style scoped>
.sg-escaner { position: relative; border-radius: 8px; overflow: hidden; background: #000; aspect-ratio: 4 / 3; }
.sg-escaner__video { width: 100%; height: 100%; object-fit: cover; display: block; }
.sg-escaner__video--espejo { transform: scaleX(-1); }
.sg-escaner__marco { position: absolute; inset: 18%; border: 3px solid rgba(255, 255, 255, 0.85); border-radius: 12px; }
.sg-escaner__cambiar { position: absolute; right: 8px; bottom: 8px; }
</style>
