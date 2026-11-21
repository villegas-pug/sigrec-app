<template>
  <div class="fullscreen column flex-center q-pa-lg text-center">
    <h1 class="text-h5 text-weight-bold">Página no encontrada</h1>
    <p class="sg-muted">La dirección solicitada no existe en SIGREC.</p>
    <!-- Si se llegó por un enlace, primero se ofrece volver a la pantalla de origen (SPEC 011, Ola 5). -->
    <div class="row items-center justify-center q-gutter-sm">
      <volver-origen destacado />
      <q-btn :unelevated="!destino" :outline="!!destino" color="primary" :to="{ name: rutaInicial }" icon="home" label="Ir al inicio" />
    </div>
  </div>
</template>

<script setup>
import { usePerfil } from 'src/composables/usePerfil'
import { useRetorno } from 'src/composables/useRetorno'
import VolverOrigen from 'components/layout/VolverOrigen.vue'

// Cada perfil vuelve a su primera pantalla; Verificación y Chofer no tienen «Inicio».
const { rutaInicial } = usePerfil()
const { destino } = useRetorno()
</script>
