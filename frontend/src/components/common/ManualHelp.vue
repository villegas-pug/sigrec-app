<template>
  <q-btn v-if="chapter" flat dense no-caps icon="help_outline" color="secondary" label="Ver ayuda de esta pantalla" :to="{ name: 'manual', query: { chapter: chapter.id } }" />
</template>
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { MANUAL_CHAPTERS } from 'src/config/manual'
const route = useRoute()
const chapter = computed(() => {
  if (route.name === 'centros') {
    const id = route.query.bien || route.query.registrar ? 'assets'
      : route.query.hecho ? 'incidents'
        : ['fotos', 'seguridad', 'intervenciones', 'novedades'].includes(route.query.tab) || route.query.consulta ? 'infrastructure' : 'centers'
    return MANUAL_CHAPTERS.find(item => item.id === id)
  }
  return MANUAL_CHAPTERS.find(item => item.routes.includes(route.name))
})
</script>
