<template>
  <span class="sg-chip" :class="`sg-chip--${tono}`">
    <q-icon v-if="icono" :name="icono" size="16px" aria-hidden="true" />
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup>
// Estado siempre con texto explícito; el color solo refuerza (tonos: ok, wa, da, in, ne, si, pv).
defineProps({
  label: { type: String, default: '' },
  tono: { type: String, default: 'ne' },
  icono: { type: String, default: '' }
})
</script>
