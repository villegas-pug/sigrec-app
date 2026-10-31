<template>
  <q-header class="sg-header">
    <q-toolbar>
      <q-btn
        flat
        round
        dense
        icon="menu"
        class="sg-header__menu"
        :aria-label="drawerAbierto ? 'Cerrar menú' : 'Abrir menú'"
        :aria-expanded="drawerAbierto ? 'true' : 'false'"
        aria-controls="menu-principal"
        @click="$emit('alternar-menu')"
      />
      <router-link :to="{ name: rutaInicial }" class="sg-header__home" aria-label="Ir al inicio">
        <span class="sg-logo" role="img" aria-label="Logo INABIF (archivo oficial pendiente)">Logo INABIF</span>
      </router-link>
      <div class="sg-header__identity">
        <span class="sg-header__name">SIGREC · Sistema Integrado de Gestión de Recursos de Centros</span>
        <span class="sg-header__unit">USPNNA – INABIF</span>
      </div>
    </q-toolbar>
  </q-header>
</template>

<script setup>
import { usePerfil } from 'src/composables/usePerfil'

defineProps({
  drawerAbierto: { type: Boolean, default: false }
})

defineEmits(['alternar-menu'])

const { rutaInicial } = usePerfil()
</script>
