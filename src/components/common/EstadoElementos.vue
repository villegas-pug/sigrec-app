<template>
  <div>
    <!-- Consulta: cada elemento evaluado con su condición; los no evaluados se señalan, no se asumen. -->
    <div v-if="soloLectura" class="sg-kv-grid">
      <key-value v-for="el in elementos" :key="el.key" :etiqueta="el.label">
        <status-chip v-if="modelValue?.[el.key]" v-bind="condicion(modelValue[el.key])" />
        <status-chip v-else tono="si" label="No evaluado" />
      </key-value>
    </div>

    <!-- Edición rápida: un toque por elemento (B/R/M/I). Volver a tocar la opción elegida la quita (no evaluado). -->
    <div v-else class="column q-gutter-y-sm">
      <div class="row items-center justify-between q-gutter-sm">
        <span class="sg-muted">{{ evaluados }} de {{ elementos.length }} evaluados · vacío = no evaluado</span>
        <q-btn
          v-if="evaluados < elementos.length"
          flat
          dense
          no-caps
          color="secondary"
          icon="done_all"
          label="Marcar los no evaluados como Bueno"
          @click="marcarRestantes('bueno')"
        />
      </div>
      <div v-for="el in elementos" :key="el.key" class="sg-elemento row items-center justify-between no-wrap q-gutter-x-sm">
        <span class="row items-center no-wrap" style="min-width: 0">
          <q-icon :name="el.icono" size="20px" class="q-mr-sm" aria-hidden="true" />
          <span class="ellipsis">{{ el.label }}</span>
          <q-btn v-if="el.adicional" flat round dense size="sm" color="grey-7" icon="close" class="q-ml-xs" :aria-label="`Quitar ${el.label}`" @click="quitar(el)">
            <q-tooltip>Quitar {{ el.label }}</q-tooltip>
          </q-btn>
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

      <!-- Alta de un elemento propio del centro o del módulo (SPEC 022): sugerencias comunes o texto libre con Enter. -->
      <q-select
        v-if="permitirAgregar"
        ref="agregarRef"
        :model-value="null"
        :options="sugerenciasFiltradas"
        use-input
        hide-selected
        fill-input
        input-debounce="0"
        outlined
        dense
        label="Agregar elemento"
        hint="Elija una sugerencia o escriba otro elemento y presione Enter"
        :maxlength="LARGO_MAXIMO_ELEMENTO"
        :error="!!error"
        :error-message="error"
        @filter="filtrar"
        @input-value="error = ''"
        @new-value="(valor) => agregar(valor)"
        @update:model-value="agregar"
      >
        <template #prepend><q-icon name="add" aria-hidden="true" /></template>
        <template #no-option>
          <q-item><q-item-section class="sg-muted">Presione Enter para agregar el elemento escrito.</q-item-section></q-item>
        </template>
      </q-select>
    </div>

    <note-banner v-if="criticos.length" tono="wa" icono="warning" class="q-mt-md">
      {{ criticos.map((c) => c.label).join(', ') }}: en condición mala o inservible.
      <template v-if="sugerirNovedad">
        El estado por elemento no registra un hecho por sí solo.
        <q-btn v-if="accionNovedad" flat dense no-caps color="primary" icon="add_alert" :label="etiquetaAccion" class="q-ml-xs" @click="$emit('registrar-novedad', criticos)" />
        <template v-else>Considere registrar el hecho para que se atienda.</template>
      </template>
    </note-banner>
  </div>
</template>

<script setup>
// Condición por elemento de la infraestructura (SPEC 010; captura rápida en SPEC 011, Ola 2). Con `soloLectura` solo muestra;
// si no, edita con v-model. El valor es { [elemento]: condicion }; un elemento ausente o null es «No evaluado».
// Centros y módulos suman elementos propios con `v-model:adicionales` y `permitir-agregar` (SPEC 022).
import KeyValue from 'components/common/KeyValue.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import StatusChip from 'components/common/StatusChip.vue'
import { computed, ref } from 'vue'
import { OPCIONES_CONDICION, SUGERENCIAS_ELEMENTOS, condicion } from 'src/config/catalogos'
import { LARGO_MAXIMO_ELEMENTO, cantidadEvaluados, claveElemento, elementosCriticos, elementosDe, motivoElementoInvalido } from 'src/services/infraestructura'
import { normalizar } from 'src/utils/interpretacionVoz'

const props = defineProps({
  modelValue: { type: Object, default: null },
  // Elementos propios del registro: [{ key, label }].
  adicionales: { type: Array, default: () => [] },
  // Muestra «Agregar elemento» y permite quitar los agregados (solo en edición).
  permitirAgregar: { type: Boolean, default: false },
  soloLectura: { type: Boolean, default: false },
  // Muestra la sugerencia de registrar una novedad (solo tiene sentido en el ambiente).
  sugerirNovedad: { type: Boolean, default: false },
  // Con la sugerencia, ofrece el botón «Registrar novedad» (emite `registrar-novedad` con los elementos críticos).
  accionNovedad: { type: Boolean, default: false },
  etiquetaAccion: { type: String, default: 'Registrar novedad' }
})

const emit = defineEmits(['update:modelValue', 'update:adicionales', 'registrar-novedad'])

// Etiqueta corta en pantallas estrechas; el nombre completo queda en el atributo accesible.
const OPCIONES_CORTAS = OPCIONES_CONDICION.map((o) => ({ value: o.value, label: o.label.slice(0, 1), attrs: { 'aria-label': o.label, title: o.label } }))

const elementos = computed(() => elementosDe(props.adicionales))
const criticos = computed(() => elementosCriticos(props.modelValue, props.adicionales))
const evaluados = computed(() => cantidadEvaluados(props.modelValue, props.adicionales))

function cambiar (clave, valor) {
  emit('update:modelValue', { ...(props.modelValue ?? {}), [clave]: valor ?? null })
}

// Completa solo los no evaluados; lo ya indicado no se toca.
function marcarRestantes (valor) {
  const actual = props.modelValue ?? {}
  emit('update:modelValue', Object.fromEntries(elementos.value.map(({ key }) => [key, actual[key] ?? valor])))
}

// ---------- Elementos agregados ----------
const agregarRef = ref(null)
const error = ref('')
const textoFiltro = ref('')

// Sugerencias que aún no están en la lista, filtradas por lo escrito.
const sugerenciasFiltradas = computed(() => {
  const presentes = new Set(elementos.value.map((e) => normalizar(e.label)))
  const t = normalizar(textoFiltro.value)
  return SUGERENCIAS_ELEMENTOS.filter((s) => !presentes.has(normalizar(s)) && (!t || normalizar(s).includes(t)))
})

function filtrar (valor, actualizar) {
  actualizar(() => { textoFiltro.value = valor })
}

function agregar (nombre) {
  if (nombre == null) return
  const motivo = motivoElementoInvalido(nombre, props.adicionales)
  if (motivo) {
    error.value = motivo
    return
  }
  const label = String(nombre).trim()
  const key = claveElemento(label)
  emit('update:adicionales', [...(props.adicionales ?? []), { key, label }])
  emit('update:modelValue', { ...(props.modelValue ?? {}), [key]: null })
  error.value = ''
  textoFiltro.value = ''
  agregarRef.value?.updateInputValue('', true)
}

// Quitar un elemento agregado elimina también su condición.
function quitar (elemento) {
  emit('update:adicionales', (props.adicionales ?? []).filter((a) => a.key !== elemento.key))
  const { [elemento.key]: _omitido, ...resto } = props.modelValue ?? {}
  emit('update:modelValue', resto)
}
</script>
