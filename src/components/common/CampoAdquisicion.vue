<template>
  <div class="column q-gutter-y-xs">
    <q-option-group v-model="precision" :options="PRECISIONES" type="radio" inline dense aria-label="Precisión de la fecha de adquisición" @update:model-value="alCambiarPrecision" />
    <q-input
      v-if="precision === 'anio'"
      :model-value="modelValue"
      outlined
      dense
      type="number"
      min="1900"
      max="2100"
      :label="label"
      :hint="hint"
      :rules="[anioValido, noFutura]"
      @update:model-value="(v) => $emit('update:modelValue', v == null ? '' : String(v))"
    >
      <template #append><boton-dictado :model-value="modelValue" tipo="anio" como-texto @update:model-value="(v) => $emit('update:modelValue', v)" /></template>
    </q-input>
    <q-input
      v-else
      :model-value="modelValue"
      outlined
      dense
      type="month"
      stack-label
      :label="label"
      :hint="hint"
      :rules="[noFutura]"
      @update:model-value="(v) => $emit('update:modelValue', v ?? '')"
    >
      <template #append><boton-dictado :model-value="modelValue" tipo="mes" @update:model-value="(v) => $emit('update:modelValue', v)" /></template>
    </q-input>
  </div>
</template>

<script setup>
// Fecha de adquisición con la precisión que realmente se conoce: solo el año ('AAAA') o el mes ('AAAA-MM').
// Un año conocido no se convierte en enero. Vacío = se desconoce.
import BotonDictado from 'components/common/BotonDictado.vue'
import { ref, watch } from 'vue'
import { noFutura } from 'src/utils/validaciones'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: 'Adquisición' },
  hint: { type: String, default: 'Vacío si se desconoce' }
})

const emit = defineEmits(['update:modelValue'])

const PRECISIONES = [
  { label: 'Solo el año', value: 'anio' },
  { label: 'Año y mes', value: 'mes' }
]

const precision = ref(props.modelValue?.length === 4 ? 'anio' : 'mes')

// Si el valor llega de fuera (p. ej. al editar un bien registrado solo con año), la precisión lo sigue.
watch(() => props.modelValue, (v) => {
  if (v?.length === 4) precision.value = 'anio'
  else if (v) precision.value = 'mes'
})

// Al cambiar de precisión se conserva lo que sigue siendo cierto: del mes se queda el año; del año no se inventa un mes.
function alCambiarPrecision (valor) {
  const actual = props.modelValue ?? ''
  emit('update:modelValue', valor === 'anio' ? actual.slice(0, 4) : actual.length === 7 ? actual : '')
}

const anioValido = (v) => !v || /^\d{4}$/.test(String(v)) || 'Indique un año de 4 cifras'
</script>
