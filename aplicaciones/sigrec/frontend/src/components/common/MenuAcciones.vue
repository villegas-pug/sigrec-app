<template>
  <q-btn v-if="visibles.length" :round="!conEtiqueta" :label="conEtiqueta ? 'Más acciones' : undefined" flat dense no-caps color="secondary" icon="more_vert" :aria-label="etiqueta">
    <q-menu auto-close>
      <q-list dense style="min-width: 210px">
        <template v-for="(item, i) in visibles" :key="item.label">
        <q-separator v-if="conEtiqueta && i > 0 && item.peligro && !visibles[i - 1].peligro" />
        <q-item :disable="item.disable"
          clickable
          :class="{ 'text-negative': item.peligro }"
          @click="item.accion()"
        >
          <q-item-section avatar>
            <q-icon :name="item.icono" size="20px" aria-hidden="true" />
          </q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
        </q-item>
        </template>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup>
import { computed } from 'vue'

// Menú «⋮» de acciones de una fila o ficha. Cada ítem: { label, icono, accion, visible?, peligro? }.
const props = defineProps({
  items: { type: Array, required: true },
  conEtiqueta: { type: Boolean, default: false },
  etiqueta: { type: String, default: 'Más acciones' }
})

const visibles = computed(() => { const items = props.items.filter((i) => i.visible !== false); return props.conEtiqueta ? items.slice().sort((a, b) => Number(!!a.peligro) - Number(!!b.peligro)) : items })
</script>
