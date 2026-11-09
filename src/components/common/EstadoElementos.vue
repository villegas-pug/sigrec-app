<template>
  <div>
    <!-- Consulta: cada elemento evaluado con su condición; los no evaluados se señalan, no se asumen. -->
    <div v-if="soloLectura" class="sg-kv-grid">
      <key-value v-for="el in ELEMENTOS_INFRAESTRUCTURA" :key="el.key" :etiqueta="el.label">
        <status-chip v-if="modelValue?.[el.key]" v-bind="condicion(modelValue[el.key])" />
        <status-chip v-else tono="si" label="No evaluado" />
      </key-value>
    </div>

    <!-- Edición rápida: un toque por elemento (B/R/M/I). Volver a tocar la opción elegida la quita (no evaluado). -->
    <div v-else class="column q-gutter-y-sm">
      <div class="row items-center justify-between q-gutter-sm">
        <span class="sg-muted">{{ evaluados }} de {{ ELEMENTOS_INFRAESTRUCTURA.length }} evaluados · vacío = no evaluado</span>
        <q-btn
          v-if="evaluados < ELEMENTOS_INFRAESTRUCTURA.length"
          flat
          dense
          no-caps
          color="secondary"
          icon="done_all"
          label="Marcar los no evaluados como Bueno"
          @click="marcarRestantes('bueno')"
        />
      </div>
      <div v-for="el in ELEMENTOS_INFRAESTRUCTURA" :key="el.key" class="sg-elemento row items-center justify-between no-wrap q-gutter-x-sm">
        <span class="row items-center no-wrap" style="min-width: 0">
          <q-icon :name="el.icono" size="20px" class="q-mr-sm" aria-hidden="true" />
          <span class="ellipsis">{{ el.label }}</span>
        </span>
        <q-btn-toggle
          :model-value="modelValue?.[el.key] ?? null"
          :options="OPCIONES_CORTAS"
          clearable
          dense
          no-caps
          unelevated
          toggle-color="primary"
          color="grey-2"
          text-color="dark"
          :aria-label="`Condición de ${el.label}`"
          @update:model-value="(v) => cambiar(el.key, v)"
        />
      </div>
    </div>

    <note-banner v-if="criticos.length" tono="wa" icono="warning" class="q-mt-md">
      {{ criticos.map((c) => c.label).join(', ') }}: en condición mala o inservible.
      <template v-if="sugerirNovedad">
        El estado por elemento no crea una novedad por sí solo.
        <q-btn v-if="accionNovedad" flat dense no-caps color="primary" icon="add_alert" label="Registrar novedad" class="q-ml-xs" @click="$emit('registrar-novedad', criticos)" />
        <template v-else>Considere registrar una novedad para que se atienda.</template>
      </template>
    </note-banner>
  </div>
</template>

<script setup>
// Condición por elemento de la infraestructura (SPEC 010; captura rápida en SPEC 011, Ola 2). Con `soloLectura` solo muestra;
// si no, edita con v-model. El valor es { [elemento]: condicion }; un elemento ausente o null es «No evaluado».
import KeyValue from 'components/common/KeyValue.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import StatusChip from 'components/common/StatusChip.vue'
import { computed } from 'vue'
import { ELEMENTOS_INFRAESTRUCTURA, OPCIONES_CONDICION, condicion } from 'src/config/catalogos'
import { cantidadEvaluados, elementosCriticos } from 'src/services/infraestructura'

const props = defineProps({
  modelValue: { type: Object, default: null },
  soloLectura: { type: Boolean, default: false },
  // Muestra la sugerencia de registrar una novedad (solo tiene sentido en el ambiente).
  sugerirNovedad: { type: Boolean, default: false },
  // Con la sugerencia, ofrece el botón «Registrar novedad» (emite `registrar-novedad` con los elementos críticos).
  accionNovedad: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'registrar-novedad'])

// Etiqueta corta en pantallas estrechas; el nombre completo queda en el atributo accesible.
const OPCIONES_CORTAS = OPCIONES_CONDICION.map((o) => ({ value: o.value, label: o.label.slice(0, 1), attrs: { 'aria-label': o.label, title: o.label } }))

const criticos = computed(() => elementosCriticos(props.modelValue))
const evaluados = computed(() => cantidadEvaluados(props.modelValue))

function cambiar (clave, valor) {
  emit('update:modelValue', { ...(props.modelValue ?? {}), [clave]: valor ?? null })
}

// Completa solo los no evaluados; lo ya indicado no se toca.
function marcarRestantes (valor) {
  const actual = props.modelValue ?? {}
  emit('update:modelValue', Object.fromEntries(ELEMENTOS_INFRAESTRUCTURA.map(({ key }) => [key, actual[key] ?? valor])))
}
</script>
