<template>
  <q-toggle :model-value="modelValue" dense label="Mostrar inactivos" @update:model-value="$emit('update:modelValue', $event)" />
</template>

<script setup>
// Interruptor «Mostrar inactivos»: incluye en el listado los registros anulados (baja lógica).
defineProps({
  modelValue: { type: Boolean, default: false }
})

defineEmits(['update:modelValue'])
</script>
