<template>
  <span v-if="!fila.cantidad" class="sg-muted">No tiene este equipo</span>
  <div v-else class="sg-chips">
    <template v-for="(cantidad, clave) in fila.porCondicion" :key="clave">
      <status-chip v-if="cantidad" v-bind="condicion(clave === 'sin_dato' ? null : clave)" :label="`${condicion(clave === 'sin_dato' ? null : clave).label}: ${cantidad}`" />
    </template>
  </div>
</template>

<script setup>
// Unidades de un equipo en un centro, por condición. Un centro sin el equipo se dice expresamente.
import StatusChip from 'components/common/StatusChip.vue'
import { condicion } from 'src/config/catalogos'

defineProps({
  fila: { type: Object, required: true }
})
</script>
