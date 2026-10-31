<template>
  <component :is="to ? RouterLink : 'div'" :to="to || undefined" class="sg-kpi">
    <span class="sg-kpi__icon" :class="`sg-kpi__icon--${tono}`">
      <q-icon :name="icono" size="32px" aria-hidden="true" />
    </span>
    <span class="sg-kpi__text">
      <span class="sg-kpi__value">{{ valor }}</span>
      <span class="sg-kpi__label">{{ etiqueta }}</span>
      <span v-if="nota" class="sg-kpi__note">{{ nota }}</span>
    </span>
  </component>
</template>

<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  icono: { type: String, required: true },
  tono: { type: String, default: 'azul' },
  valor: { type: [String, Number], required: true },
  etiqueta: { type: String, required: true },
  nota: { type: String, default: '' },
  to: { type: Object, default: null }
})
</script>
