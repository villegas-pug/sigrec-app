<template>
  <q-btn flat round dense size="sm" icon="help_outline" color="secondary" class="sg-ayuda" :aria-label="etiqueta">
    <q-tooltip>{{ etiqueta }}</q-tooltip>
    <q-menu anchor="bottom left" self="top left" class="sg-ayuda__menu">
      <div class="q-pa-md" style="max-width: min(380px, 90vw)">
        <div class="text-weight-bold q-mb-xs">{{ etiqueta }}</div>
        <div class="sg-ayuda__texto"><slot /></div>
      </div>
    </q-menu>
  </q-btn>
</template>

<script setup>
// Ayuda contextual (SPEC 011, Ola 2): explica reglas y supuestos en un menú desplegable, en lugar de un aviso fijo en pantalla.
// Los avisos (NoteBanner) quedan para advertencias, bloqueos y datos incompletos.
defineProps({
  etiqueta: { type: String, default: '¿Cómo se interpreta?' }
})
</script>
