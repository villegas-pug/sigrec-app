<template>
  <note-banner tono="wa" icono="block">
    <strong>Registro no disponible.</strong>
    {{ entidad }} <span class="text-weight-bold">{{ id }}</span> no existe o está fuera del ámbito del perfil actual.
    <router-link v-if="volver" :to="volver">{{ etiquetaVolver }}</router-link>
  </note-banner>
</template>

<script setup>
// Aviso de un enlace profundo cuyo registro no se puede mostrar. No se selecciona otro registro en su lugar.
import NoteBanner from 'components/common/NoteBanner.vue'

defineProps({
  entidad: { type: String, required: true },
  id: { type: String, default: '' },
  // Destino seguro de retorno (p. ej. la misma pantalla sin parámetros).
  volver: { type: Object, default: null },
  etiquetaVolver: { type: String, default: 'Volver al listado' }
})
</script>
