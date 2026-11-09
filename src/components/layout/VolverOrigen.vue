<template>
  <q-btn
    v-if="destino"
    :flat="!destacado"
    :unelevated="destacado"
    :dense="!destacado"
    no-caps
    :color="destacado ? 'primary' : 'secondary'"
    icon="arrow_back"
    :label="`Volver a ${destino.titulo}`"
    :class="{ 'sg-volver': !destacado }"
    @click="volver"
  >
    <q-tooltip>Vuelve a la pantalla anterior con sus filtros. También: «Atrás» del navegador o Alt + ←</q-tooltip>
  </q-btn>
</template>

<script setup>
// Botón «Volver a ‹pantalla de origen›» (SPEC 011, Olas 4 y 5). Solo aparece si se llegó por un enlace desde otra pantalla
// y el perfil actual todavía puede ver esa pantalla. `destacado`: acción principal (p. ej. en «Registro no disponible»).
import { useRetorno } from 'src/composables/useRetorno'

defineProps({ destacado: { type: Boolean, default: false } })

const { destino, volver } = useRetorno()
</script>
