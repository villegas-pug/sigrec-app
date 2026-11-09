<template>
  <q-btn
    v-if="destino"
    flat
    dense
    no-caps
    color="secondary"
    icon="arrow_back"
    :label="`Volver a ${destino.titulo}`"
    class="sg-volver"
    @click="volver"
  />
</template>

<script setup>
// Botón «Volver a ‹pantalla de origen›» (SPEC 011, Ola 4). Solo aparece si se llegó por un enlace desde otra pantalla
// y el perfil actual todavía puede ver esa pantalla.
import { computed } from 'vue'
import { usePerfil } from 'src/composables/usePerfil'
import { origen, volver } from 'src/router/retorno'

const { puedeAcceder } = usePerfil()
const destino = computed(() => (origen.value && puedeAcceder(origen.value.nombre) ? origen.value : null))
</script>
