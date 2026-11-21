<template>
  <div class="column q-gutter-y-xs items-start">
    <div class="sg-chips">
      <template v-for="(item, i) in celda.items" :key="i">
        <router-link v-if="item.to" :to="item.to" :aria-label="`Ver ${item.label}`"><status-chip :tono="item.tono" :label="item.label" /></router-link>
        <status-chip v-else :tono="item.tono" :label="item.label" />
      </template>
    </div>
    <router-link v-if="celda.to" :to="celda.to" class="text-weight-bold">Ver {{ titulo.toLowerCase() }}</router-link>
  </div>
</template>

<script setup>
// Celda del tablero de control: las alertas de un centro en un tema, como chips, con el enlace al detalle que las sustenta.
import StatusChip from 'components/common/StatusChip.vue'

defineProps({
  // { items: [{ tono, label }], to: ubicación de ruta o null }
  celda: { type: Object, required: true },
  titulo: { type: String, required: true }
})
</script>
