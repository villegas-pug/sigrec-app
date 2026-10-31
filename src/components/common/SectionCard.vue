<template>
  <section class="sg-card" :aria-label="titulo || undefined">
    <div v-if="titulo || $slots.acciones" class="sg-card__head">
      <div>
        <h2 class="sg-section-title">{{ titulo }}</h2>
        <p v-if="subtitulo" class="sg-card__sub">{{ subtitulo }}</p>
      </div>
      <div v-if="$slots.acciones" class="sg-card__actions"><slot name="acciones" /></div>
    </div>
    <div :class="{ 'sg-card__body': !sinRelleno }"><slot /></div>
  </section>
</template>

<script setup>
defineProps({
  titulo: { type: String, default: '' },
  subtitulo: { type: String, default: '' },
  sinRelleno: { type: Boolean, default: false }
})
</script>
