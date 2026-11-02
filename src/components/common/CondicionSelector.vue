<template>
  <div>
    <div v-if="etiqueta" class="sg-kv__label q-mb-xs">{{ etiqueta }}</div>
    <!-- En móvil, cuatro botones no caben en una línea: se usa una lista desplegable. -->
    <q-select
      v-if="$q.screen.lt.sm"
      :model-value="modelValue"
      :options="OPCIONES_CONDICION"
      emit-value
      map-options
      outlined
      dense
      :clearable="clearable"
      :label="etiqueta ? undefined : 'Condición'"
      @update:model-value="$emit('update:modelValue', $event)"
    />
    <q-btn-toggle
      v-else
      :model-value="modelValue"
      :options="OPCIONES_CONDICION"
      unelevated
      toggle-color="secondary"
      color="white"
      text-color="secondary"
      no-caps
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<script setup>
import { OPCIONES_CONDICION } from 'src/config/catalogos'

defineProps({
  modelValue: { type: String, default: null },
  etiqueta: { type: String, default: '' },
  clearable: { type: Boolean, default: false }
})

defineEmits(['update:modelValue'])
</script>
