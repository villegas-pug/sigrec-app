<template>
  <div>
    <!-- Consulta: cada elemento evaluado con su condición; los no evaluados se señalan, no se asumen. -->
    <div v-if="soloLectura" class="sg-kv-grid">
      <key-value v-for="el in elementos" :key="el.key" :etiqueta="el.label">
        <q-icon :name="el.icono" size="20px" class="q-mr-sm" aria-hidden="true" />
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
          <q-btn v-if="permitirAgregar" flat round dense size="sm" color="secondary" icon="edit" class="q-ml-xs" :aria-label="`Editar ${el.label}`" @click="abrirEditor(el)" />
          <q-btn v-if="permitirAgregar" flat round dense size="sm" color="grey-7" icon="close" class="q-ml-xs" :aria-label="`Quitar ${el.label}`" @click="quitar(el)">
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

      <!-- Alta y edición de elementos propios de la ficha (SPEC 051). -->
      <q-btn v-if="permitirAgregar" outline color="secondary" icon="add" label="Agregar elemento" no-caps @click="abrirEditor()" />
      <q-dialog v-model="editorAbierto">
        <q-card class="sg-dialog" style="width: 480px; max-width: 95vw">
          <q-card-section class="sg-dialog__header"><h2 class="text-h6 q-my-none">{{ claveEditada ? 'Editar elemento' : 'Agregar elemento' }}</h2></q-card-section>
          <q-card-section>
            <q-input v-model="nombreEditado" outlined dense autofocus label="Nombre del elemento *" :maxlength="LARGO_MAXIMO_ELEMENTO" :error="!!error" :error-message="error" @update:model-value="error = ''" @keydown.enter.prevent="guardarElemento" />
            <div class="q-mt-md q-mb-sm">Icono</div>
            <div class="row q-gutter-xs">
              <q-btn v-for="icono in ICONOS" :key="icono" round dense :outline="iconoEditado !== icono" :unelevated="iconoEditado === icono" color="secondary" :icon="icono" :aria-label="`Seleccionar icono ${icono}`" :aria-pressed="iconoEditado === icono" @click="iconoEditado = icono" />
            </div>
          </q-card-section>
          <q-card-actions align="right"><q-btn flat label="Cancelar" v-close-popup /><q-btn color="primary" label="Guardar" @click="guardarElemento" /></q-card-actions>
        </q-card>
      </q-dialog>
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
// Cada ficha administra elementos propios con `v-model:adicionales` (SPEC 051).
import KeyValue from 'components/common/KeyValue.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import StatusChip from 'components/common/StatusChip.vue'
import { computed, ref } from 'vue'
import { OPCIONES_CONDICION, condicion } from 'src/config/catalogos'
import { LARGO_MAXIMO_ELEMENTO, cantidadEvaluados, claveElemento, elementosCriticos, elementosDe, motivoElementoInvalido } from 'src/services/infraestructura'

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
const ICONOS = ['category', 'door_front', 'window', 'format_paint', 'grid_on', 'roofing', 'foundation', 'electrical_services', 'plumbing', 'water_drop', 'fence', 'garage', 'lightbulb', 'stairs', 'build', 'security']
const editorAbierto = ref(false)
const claveEditada = ref(null)
const nombreEditado = ref('')
const iconoEditado = ref('category')
const error = ref('')
function abrirEditor (elemento = null) {
  claveEditada.value = elemento?.key ?? null
  nombreEditado.value = elemento?.label ?? ''
  iconoEditado.value = elemento?.icono ?? 'category'
  error.value = ''
  editorAbierto.value = true
}

function guardarElemento () {
  const motivo = motivoElementoInvalido(nombreEditado.value, props.adicionales, claveEditada.value)
  if (motivo) {
    error.value = motivo
    return
  }
  const key = claveEditada.value ?? claveElemento()
  const elemento = { key, label: nombreEditado.value.trim(), icono: iconoEditado.value }
  emit('update:adicionales', claveEditada.value ? props.adicionales.map((a) => a.key === key ? elemento : a) : [...props.adicionales, elemento])
  if (!claveEditada.value) emit('update:modelValue', { ...(props.modelValue ?? {}), [key]: null })
  editorAbierto.value = false
}

// Quitar un elemento agregado elimina también su condición.
function quitar (elemento) {
  emit('update:adicionales', (props.adicionales ?? []).filter((a) => a.key !== elemento.key))
  const { [elemento.key]: _omitido, ...resto } = props.modelValue ?? {}
  emit('update:modelValue', resto)
}
</script>
