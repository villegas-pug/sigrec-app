<template>
  <div>
    <!-- Consulta: cada elemento evaluado con su condición; los no evaluados se señalan, no se asumen. -->
    <div v-if="soloLectura" class="sg-kv-grid">
      <key-value v-for="el in ELEMENTOS_INFRAESTRUCTURA" :key="el.key" :etiqueta="el.label">
        <status-chip v-if="modelValue?.[el.key]" v-bind="condicion(modelValue[el.key])" />
        <status-chip v-else tono="si" label="No evaluado" />
      </key-value>
    </div>

    <!-- Edición: una lista desplegable por elemento (opcional; vacío = no evaluado). -->
    <div v-else class="row q-col-gutter-md">
      <q-select
        v-for="el in ELEMENTOS_INFRAESTRUCTURA"
        :key="el.key"
        :model-value="modelValue?.[el.key] ?? null"
        class="col-12 col-sm-6"
        :options="OPCIONES_CONDICION"
        emit-value
        map-options
        clearable
        outlined
        dense
        :label="el.label"
        hint="Vacío si no se evaluó"
        @update:model-value="(v) => cambiar(el.key, v)"
      >
        <template #prepend><q-icon :name="el.icono" aria-hidden="true" /></template>
        <template #append><boton-dictado :model-value="modelValue?.[el.key] ?? null" tipo="opcion" :opciones="OPCIONES_CONDICION" emit-value @update:model-value="(v) => cambiar(el.key, v)" /></template>
      </q-select>
    </div>

    <note-banner v-if="criticos.length" tono="wa" icono="warning" class="q-mt-md">
      {{ criticos.map((c) => c.label).join(', ') }}: en condición mala o inservible.
      <template v-if="sugerirNovedad">Considere registrar una novedad para que se atienda; el estado por elemento no la crea por sí solo.</template>
    </note-banner>
  </div>
</template>

<script setup>
// Condición por elemento de la infraestructura (SPEC 010). Con `soloLectura` solo muestra; si no, edita con v-model.
// El valor es { [elemento]: condicion }; un elemento ausente o null es «No evaluado».
import BotonDictado from 'components/common/BotonDictado.vue'
import KeyValue from 'components/common/KeyValue.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import StatusChip from 'components/common/StatusChip.vue'
import { computed } from 'vue'
import { ELEMENTOS_INFRAESTRUCTURA, OPCIONES_CONDICION, condicion } from 'src/config/catalogos'
import { elementosCriticos } from 'src/services/infraestructura'

const props = defineProps({
  modelValue: { type: Object, default: null },
  soloLectura: { type: Boolean, default: false },
  // Muestra la sugerencia de registrar una novedad (solo tiene sentido en el ambiente).
  sugerirNovedad: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const criticos = computed(() => elementosCriticos(props.modelValue))

function cambiar (clave, valor) {
  emit('update:modelValue', { ...(props.modelValue ?? {}), [clave]: valor ?? null })
}
</script>
