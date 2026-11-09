<template>
  <span v-if="!fila.cantidad" class="sg-muted">—</span>
  <div v-else class="sg-chips">
    <status-chip v-if="fila.enMalEstado" tono="da" :label="`${fila.enMalEstado} en mal estado`" />
    <status-chip v-if="fila.controlesVencidos" tono="da" :label="plural(fila.controlesVencidos, 'control vencido', 'controles vencidos')" />
    <status-chip v-if="!fila.enMalEstado && !fila.controlesVencidos" tono="ok" label="Sin alertas" />
  </div>
</template>

<script setup>
// Atención que requiere un equipo en un centro: unidades en mal estado y controles vencidos.
import StatusChip from 'components/common/StatusChip.vue'
import { plural } from 'src/utils/formato'

defineProps({
  fila: { type: Object, required: true }
})
</script>
