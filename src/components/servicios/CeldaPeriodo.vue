<template>
  <button
    type="button"
    class="sg-celda"
    :class="`sg-celda--${celda.estado}`"
    :aria-label="`${nombre}, ${celda.etiqueta}: ${ESTADOS_PERIODO[celda.estado].label}`"
    :disabled="disabled"
    @click="$emit('abrir')"
  >
    <span>{{ conEtiqueta || celda.span > 1 ? `${celda.etiqueta} · ` : '' }}{{ ESTADOS_PERIODO[celda.estado].label }}</span>
    <span v-if="celda.estado === 'pendiente'" class="sg-celda__sub">{{ celda.vence ? `vence ${fecha(celda.vence)}` : 'vencimiento no informado' }}</span>
  </button>
</template>

<script setup>
import { ESTADOS_PERIODO } from 'src/config/catalogos'
import { fecha } from 'src/utils/formato'

// Celda de un período de pago (mes o trimestre): la usan la tabla anual y la lista de móvil.
defineProps({
  nombre: { type: String, required: true },
  celda: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
  conEtiqueta: { type: Boolean, default: false }
})

defineEmits(['abrir'])
</script>
