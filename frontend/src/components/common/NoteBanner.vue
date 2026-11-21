<template>
  <div class="sg-note" :class="`sg-note--${tono}`" role="note">
    <q-icon :name="icono" size="20px" aria-hidden="true" />
    <div class="sg-note__body"><slot /></div>
  </div>
</template>

<script setup>
defineProps({
  tono: { type: String, default: 'in' },
  icono: { type: String, default: 'info' }
})
</script>
