<template>
  <div class="sg-kv">
    <span class="sg-kv__label">{{ etiqueta }}</span>
    <span class="sg-kv__value"><slot /></span>
    <span v-if="nota" class="sg-kv__note">{{ nota }}</span>
  </div>
</template>

<script setup>
defineProps({
  etiqueta: { type: String, required: true },
  nota: { type: String, default: '' }
})
</script>
