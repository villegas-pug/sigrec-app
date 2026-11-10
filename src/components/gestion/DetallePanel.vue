<template>
  <section class="sg-detalle" :aria-label="titulo">
    <header class="sg-detalle__head">
      <div class="sg-detalle__titulo">
        <!-- En móvil: vuelve al árbol de la misma pantalla. Lleva texto e icono propios para no confundirse con «Volver a ‹pantalla›». -->
        <q-btn v-if="conVolver" flat dense no-caps color="secondary" icon="account_tree" label="Explorar recursos" aria-label="Volver al explorador de centros y recursos" @click="$emit('volver')" />
        <q-icon :name="icono" size="26px" color="secondary" aria-hidden="true" />
        <div class="sg-detalle__texto">
          <h2 class="sg-section-title">{{ titulo }}</h2>
          <ruta-ficha v-if="nodo" :nodo="nodo" @seleccionar="$emit('seleccionar', $event)" />
          <p v-else-if="ruta" class="sg-card__sub">{{ ruta }}</p>
        </div>
        <div v-if="$slots.chips" class="sg-chips"><slot name="chips" /></div>
      </div>
      <div v-if="$slots.acciones" class="sg-detalle__acciones"><slot name="acciones" /></div>
    </header>

    <template v-if="tabs.length">
      <q-tabs v-model="tab" dense no-caps align="left" active-color="primary" indicator-color="primary" class="sg-detalle__tabs">
        <q-tab v-for="t in tabs" :key="t.name" :name="t.name" :label="t.label" />
      </q-tabs>
      <q-separator />
      <q-tab-panels v-model="tab" class="sg-detalle__panels">
        <q-tab-panel v-for="t in tabs" :key="t.name" :name="t.name" class="sg-detalle__panel">
          <div class="column q-gutter-y-md" :class="{ 'sg-ficha': t.name === 'ficha' }"><slot :name="t.name" /></div>
        </q-tab-panel>
      </q-tab-panels>
    </template>
    <div v-else class="sg-detalle__panels sg-detalle__panel scroll"><slot /></div>
  </section>
</template>

<script setup>
// Contenedor común del detalle de un nodo del explorador: cabecera con título, estado y acciones; pestañas con scroll propio.
// Cada pestaña se rellena con un slot que lleva su mismo `name`.
import RutaFicha from './RutaFicha.vue'
import { ref, watch } from 'vue'
import { useEstadoNavegacion } from 'src/composables/useEstadoNavegacion'

const props = defineProps({
  // Identificador del nodo: con él se recuerda la pestaña al volver a esta pantalla (SPEC 011, Ola 4).
  nodo: { type: String, default: null },
  titulo: { type: String, required: true },
  // Ruta jerárquica del nodo (Centro › Ambiente › …).
  ruta: { type: String, default: '' },
  icono: { type: String, default: 'info' },
  // [{ name, label }]
  tabs: { type: Array, default: () => [] },
  tabInicial: { type: String, default: null },
  // En móvil el detalle ocupa toda la pantalla y se ofrece volver al árbol.
  conVolver: { type: Boolean, default: false }
})

defineEmits(['volver', 'seleccionar'])

const tab = ref(props.tabs.some((t) => t.name === props.tabInicial) ? props.tabInicial : props.tabs[0]?.name)

// Al volver con «Atrás» o con «Volver a…», el nodo abre en la pestaña en la que se dejó.
if (props.nodo) {
  useEstadoNavegacion(`pestana-${props.nodo}`, { tab })
  if (!props.tabs.some((t) => t.name === tab.value)) tab.value = props.tabs[0]?.name
}

// Si la pestaña activa deja de existir (p. ej. un bien que pasa a ser componente), se vuelve a la primera.
watch(() => props.tabs, (lista) => {
  if (!lista.some((t) => t.name === tab.value)) tab.value = lista[0]?.name
})
</script>
