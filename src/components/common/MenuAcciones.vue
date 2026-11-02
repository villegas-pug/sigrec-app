<template>
  <q-btn v-if="visibles.length" flat round dense color="secondary" icon="more_vert" :aria-label="etiqueta">
    <q-menu auto-close>
      <q-list dense style="min-width: 210px">
        <q-item
          v-for="item in visibles"
          :key="item.label"
          clickable
          :class="{ 'text-negative': item.peligro }"
          @click="item.accion()"
        >
          <q-item-section avatar>
            <q-icon :name="item.icono" size="20px" aria-hidden="true" />
          </q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup>
import { computed } from 'vue'

// Menú «⋮» de acciones de una fila o ficha. Cada ítem: { label, icono, accion, visible?, peligro? }.
const props = defineProps({
  items: { type: Array, required: true },
  etiqueta: { type: String, default: 'Más acciones' }
})

const visibles = computed(() => props.items.filter((i) => i.visible !== false))
</script>
