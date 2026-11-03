<template>
  <q-btn
    v-if="dictadoDisponible"
    flat
    round
    dense
    class="sg-dictado"
    :class="{ 'sg-dictado--activo': escuchando }"
    :icon="escuchando ? 'stop' : 'mic'"
    :color="escuchando ? 'negative' : 'secondary'"
    :disable="disable"
    :aria-label="escuchando ? 'Detener dictado' : 'Dictar texto'"
    :aria-pressed="escuchando ? 'true' : 'false'"
    @click="alternar"
  />
</template>

<script setup>
import { dictadoDisponible, unirDictado, useDictado } from 'src/composables/useDictado'

const props = defineProps({
  modelValue: { type: String, default: '' },
  disable: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

const { escuchando, iniciar, detener } = useDictado()

function alternar () {
  if (escuchando.value) {
    detener()
    return
  }
  // El texto previo del campo se conserva: el dictado se añade al final y se ve en vivo mientras se habla.
  const base = props.modelValue ?? ''
  iniciar({
    alParcial: (texto) => emit('update:modelValue', unirDictado(base, texto)),
    alFinal: (texto) => emit('update:modelValue', unirDictado(base, texto)),
    alCancelar: () => emit('update:modelValue', base)
  })
}
</script>
