<template>
  <q-layout view="lHh Lpr lFf">
    <app-header :drawer-abierto="drawerAbierto" @alternar-menu="drawerAbierto = !drawerAbierto" />

    <app-drawer v-model="drawerAbierto" />

    <q-footer class="sg-footer">
      <p class="sg-footer__text">
        © 2026 INABIF | Todos los derechos reservados
        <span class="sg-footer__version">(Prototipo con datos ficticios v0.1.0)</span>
      </p>
    </q-footer>

    <q-page-container>
      <router-view v-if="permitido" />
      <sin-acceso v-else />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from 'components/layout/AppHeader.vue'
import AppDrawer from 'components/layout/AppDrawer.vue'
import SinAcceso from 'components/layout/SinAcceso.vue'
import { usePerfil } from 'src/composables/usePerfil'

const drawerAbierto = ref(false)
const route = useRoute()
const { puedeAcceder } = usePerfil()

// El mismo criterio de accesos gobierna el menú y la vista: sin acceso no se muestra el contenido.
const permitido = computed(() => puedeAcceder(route.name))
</script>
