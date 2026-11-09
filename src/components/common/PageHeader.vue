<template>
  <header>
    <div class="sg-crumbs-row">
      <!-- Si se llegó por un enlace desde otra pantalla, se ofrece volver a ella (SPEC 011, Ola 4). -->
      <volver-origen />
      <nav class="sg-crumbs" aria-label="Ruta de navegación">
        <ol class="sg-crumbs__list">
          <li v-for="(miga, i) in migas" :key="i" class="sg-crumbs__item">
            <q-icon v-if="i > 0" name="chevron_right" size="16px" class="sg-crumbs__sep" aria-hidden="true" />
            <!-- Las migas son navegación jerárquica, como el menú: la pantalla a la que llevan no ofrece «Volver». -->
            <router-link v-if="miga.to" :to="miga.to" class="sg-crumbs__link" @click="marcarNavegacionPrincipal">{{ miga.label }}</router-link>
            <span v-else-if="i === migas.length - 1" class="sg-crumbs__current" aria-current="page">{{ miga.label }}</span>
            <span v-else>{{ miga.label }}</span>
          </li>
        </ol>
      </nav>
    </div>
    <h1 class="sg-page-title">
      {{ titulo || route.meta.titulo }}
      <ayuda-contextual v-if="$slots.ayuda" :etiqueta="etiquetaAyuda"><slot name="ayuda" /></ayuda-contextual>
    </h1>
    <div v-if="$slots.acciones" class="sg-page-actions">
      <slot name="acciones" />
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePerfil } from 'src/composables/usePerfil'
import AyudaContextual from 'components/common/AyudaContextual.vue'
import VolverOrigen from 'components/layout/VolverOrigen.vue'
import { marcarNavegacionPrincipal } from 'src/router/retorno'

defineProps({
  titulo: { type: String, default: '' },
  // Con el slot «ayuda», un botón junto al título despliega las reglas de la pantalla.
  etiquetaAyuda: { type: String, default: '¿Cómo se interpreta esta pantalla?' }
})

const route = useRoute()
const { puedeAcceder } = usePerfil()

const migas = computed(() => {
  const lista = [{ label: 'Inicio', to: puedeAcceder('inicio') ? { name: 'inicio' } : null }]
  if (route.meta.grupo) lista.push({ label: route.meta.grupo })
  lista.push({ label: route.meta.titulo })
  return lista
})
</script>
