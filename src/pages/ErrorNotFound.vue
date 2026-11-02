<template>
  <div class="fullscreen column flex-center q-pa-lg text-center">
    <h1 class="text-h5 text-weight-bold">Página no encontrada</h1>
    <p class="sg-muted">La dirección solicitada no existe en SIGREC.</p>
    <q-btn unelevated color="primary" :to="{ name: rutaInicial }" label="Ir al inicio" />
  </div>
</template>

<script setup>
import { usePerfil } from 'src/composables/usePerfil'

// Cada perfil vuelve a su primera pantalla; Verificación y Chofer no tienen «Inicio».
const { rutaInicial } = usePerfil()
</script>
