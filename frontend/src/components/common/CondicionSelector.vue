<template>
  <div>
    <div v-if="etiqueta" class="sg-kv__label q-mb-xs">{{ etiqueta }}</div>
    <!-- Opción única: botones de opción (en móvil se ajustan en varias líneas). -->
    <q-option-group
      :model-value="modelValue"
      :options="opciones"
      type="radio"
      inline
      color="secondary"
      :aria-label="etiqueta || 'Condición'"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { OPCIONES_CONDICION } from 'src/config/catalogos'

const props = defineProps({
  modelValue: { type: String, default: null },
  etiqueta: { type: String, default: '' },
  // Permite no cambiar la condición: añade la opción «Sin cambio» (valor null).
  clearable: { type: Boolean, default: false }
})

defineEmits(['update:modelValue'])

const opciones = computed(() => (props.clearable ? [{ value: null, label: 'Sin cambio' }, ...OPCIONES_CONDICION] : OPCIONES_CONDICION))
</script>
