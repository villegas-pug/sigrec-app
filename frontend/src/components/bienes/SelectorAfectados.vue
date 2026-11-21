<template>
  <section class="sg-afectados" aria-label="Recursos afectados">
    <div v-if="multiple" class="sg-afectados__filters">
      <q-input v-model="busqueda" outlined dense clearable label="Buscar por nombre, rótulo o código" />
      <q-toggle v-model="soloSeleccionados" label="Solo seleccionados" />
    </div>
    <div class="row items-center q-gutter-sm">
      <q-checkbox v-if="multiple" :model-value="seleccionGeneral" :disable="!visibles.length" :label="`Seleccionar resultados (${visibles.length})`" @update:model-value="seleccionarResultados" />
      <q-btn v-if="multiple" flat no-caps label="Quitar selección" :disable="!seleccionados.length" @click="seleccionados = []" />
      <span role="status">{{ seleccionados.length }} seleccionados · {{ ocultos }} fuera del filtro</span>
    </div>
    <p v-if="multiple" class="sg-muted">Cada componente se selecciona por separado de su bien principal.</p>
    <p v-if="!visibles.length" class="sg-muted">{{ candidatos.length ? 'Sin recursos para estos filtros. La selección se conserva.' : 'Sin recursos elegibles; puede registrar solo la incidencia de infraestructura.' }}</p>
    <table v-else class="sg-table sg-afectados__table">
      <thead><tr><th scope="col">Afectado</th><th scope="col">Recurso</th><th scope="col">Unidades afectadas</th><th scope="col">¿Requiere reposición?</th></tr></thead>
      <tbody>
        <template v-for="grupo in grupos" :key="grupo.id">
          <tr v-if="grupo.principal" class="sg-afectados__group"><th colspan="4" scope="rowgroup">{{ grupo.principal.nombre }} · {{ grupo.principal.id }}<span v-if="!grupo.elegible" class="sg-muted"> · Referencia del principal</span></th></tr>
          <tr v-for="b in grupo.bienes" :key="b.id" :ref="(el) => filas[b.id] = el" :class="{ 'sg-row--selected': seleccionado(b.id) }">
            <td data-label="Afectado"><q-checkbox v-if="multiple" :model-value="seleccionado(b.id)" :aria-label="`Marcar como afectado: ${b.nombre} · ${b.id}`" @update:model-value="cambiarSeleccion(b.id, $event)" /><span v-else>Seleccionado</span></td>
            <td data-label="Recurso">
              <strong>{{ b.nombre }}</strong><div class="sg-muted">{{ b.id }}<template v-if="b.codigoPatrimonial"> · {{ b.codigoPatrimonial }}</template></div>
              <status-chip v-bind="condicion(b.condicion)" />
              <div v-if="b.asociadoA" class="sg-muted">Componente de {{ b.asociadoA.bienId }}</div>
              <q-expansion-item v-if="permitirCondicion && seleccionado(b.id)" dense label="Editar condición (opcional)" header-class="q-px-none">
                <condicion-selector :model-value="condiciones[b.id]" clearable @update:model-value="cambiarCondicion(b.id, $event)" />
              </q-expansion-item>
            </td>
            <td data-label="Unidades afectadas">
              <div data-control="unidades">
                <q-input v-if="(b.cantidad ?? 1) > 1" :model-value="evaluaciones[b.id]?.unidades" :disable="!seleccionado(b.id)" type="number" outlined dense min="1" :max="b.cantidad" :aria-label="`Unidades afectadas de ${b.nombre} · ${b.id}`" :error="seleccionado(b.id) && errores[b.id]?.campo === 'unidades'" :error-message="errores[b.id]?.mensaje" @update:model-value="cambiarEvaluacion(b.id, 'unidades', $event === '' || $event == null ? null : Number($event))" />
                <span v-else>{{ seleccionado(b.id) ? 1 : '—' }}</span>
              </div>
            </td>
            <td data-label="¿Requiere reposición?">
              <div data-control="reposicion" :aria-invalid="seleccionado(b.id) && errores[b.id]?.campo === 'requiereReposicion' ? 'true' : undefined">
                <q-option-group :model-value="evaluaciones[b.id]?.requiereReposicion ?? null" :disable="!seleccionado(b.id)" :options="opciones" inline :aria-label="`Reposición de ${b.nombre} · ${b.id}`" @update:model-value="cambiarEvaluacion(b.id, 'requiereReposicion', $event)" />
                <span v-if="seleccionado(b.id) && errores[b.id]?.campo === 'requiereReposicion'" class="text-negative" role="alert">{{ errores[b.id].mensaje }}</span>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </section>
</template>
<script setup>
import { computed, nextTick, reactive, ref } from 'vue'
import StatusChip from 'components/common/StatusChip.vue'
import CondicionSelector from 'components/common/CondicionSelector.vue'
import { bienPorId } from 'src/services/datos'
import { condicion } from 'src/config/catalogos'
const props = defineProps({ candidatos: { type: Array, required: true }, multiple: { type: Boolean, default: true }, permitirCondicion: Boolean })
const seleccionados = defineModel({ type: Array, required: true })
const evaluaciones = defineModel('evaluaciones', { type: Object, required: true })
const condiciones = defineModel('condiciones', { type: Object, required: true })
const busqueda = ref('')
const soloSeleccionados = ref(false)
const errores = reactive({})
const filas = {}
const opciones = [{ label: 'Sí', value: true }, { label: 'No', value: false }]
const normalizar = (v) => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
const seleccionado = (id) => seleccionados.value.includes(id)
const visibles = computed(() => props.candidatos.filter((b) => (!soloSeleccionados.value || seleccionado(b.id)) && normalizar([b.nombre, b.id, b.codigoPatrimonial].join(' ')).includes(normalizar(busqueda.value))))
const ocultos = computed(() => seleccionados.value.filter((id) => !visibles.value.some((b) => b.id === id)).length)
const seleccionGeneral = computed(() => { const n = visibles.value.filter((b) => seleccionado(b.id)).length; return n === 0 ? false : n === visibles.value.length ? true : null })
const grupos = computed(() => {
  const mapa = new Map()
  for (const b of visibles.value) {
    const id = b.asociadoA?.bienId ?? b.id
    if (!mapa.has(id)) mapa.set(id, { id, principal: null, elegible: props.candidatos.some((p) => p.id === id), bienes: [] })
    mapa.get(id).bienes.push(b)
  }
  for (const g of mapa.values()) {
    if (g.bienes.some((b) => b.asociadoA)) g.principal = bienPorId(g.id) ?? { id: g.id, nombre: 'Bien principal' }
    g.bienes.sort((a, b) => Number(!!a.asociadoA) - Number(!!b.asociadoA) || a.nombre.localeCompare(b.nombre, 'es') || a.id.localeCompare(b.id))
  }
  return [...mapa.values()].sort((a, b) => (a.principal?.nombre ?? a.bienes[0].nombre).localeCompare(b.principal?.nombre ?? b.bienes[0].nombre, 'es'))
})
function cambiarSeleccion (id, valor) { seleccionados.value = valor ? [...new Set([...seleccionados.value, id])] : seleccionados.value.filter((s) => s !== id) }
function seleccionarResultados (valor) { const ids = visibles.value.map((b) => b.id); seleccionados.value = valor === false ? seleccionados.value.filter((id) => !ids.includes(id)) : [...new Set([...seleccionados.value, ...ids])] }
function cambiarEvaluacion (id, campo, valor) { evaluaciones.value = { ...evaluaciones.value, [id]: { ...evaluaciones.value[id], [campo]: valor } }; delete errores[id] }
function cambiarCondicion (id, valor) { condiciones.value = { ...condiciones.value, [id]: valor } }
async function validar () {
  for (const id of Object.keys(errores)) delete errores[id]
  for (const id of seleccionados.value) {
    const b = props.candidatos.find((b) => b.id === id)
    const e = evaluaciones.value[id]
    if (!b) errores[id] = { campo: 'unidades', mensaje: 'Recurso no disponible' }
    else if (!Number.isInteger(e?.unidades) || e.unidades < 1 || e.unidades > (b.cantidad ?? 1)) errores[id] = { campo: 'unidades', mensaje: 'Indique una cantidad dentro del rango disponible' }
    else if (typeof e?.requiereReposicion !== 'boolean') errores[id] = { campo: 'requiereReposicion', mensaje: 'Seleccione Sí o No' }
  }
  const id = seleccionados.value.find((id) => errores[id])
  if (!id) return true
  busqueda.value = ''; soloSeleccionados.value = false
  await nextTick()
  const fila = filas[id]
  fila?.scrollIntoView({ block: 'nearest' })
  fila?.querySelector(`[data-control="${errores[id].campo === 'unidades' ? 'unidades' : 'reposicion'}"]`)?.querySelector('input, [tabindex="0"]')?.focus()
  return false
}
defineExpose({ validar, ocultos })
</script>
<style scoped>
.sg-afectados { container: afectados / inline-size; min-width: 0; }
.sg-afectados__filters { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.sg-afectados__filters > .q-input { flex: 1 1 240px; }
.sg-afectados__table, .sg-afectados__table tbody { display: block; width: 100%; }
.sg-afectados__table thead { display: none; }
.sg-afectados__table tr { display: grid; margin-top: 12px; border: 1px solid var(--sg-border); border-radius: var(--sg-radius); }
.sg-afectados__table td { display: block; min-width: 0; overflow-wrap: anywhere; border: 0; }
.sg-afectados__table td::before { content: attr(data-label); display: block; font-weight: 600; margin-bottom: 4px; }
.sg-afectados__table th { white-space: normal; overflow-wrap: anywhere; }
.sg-afectados__group { background: var(--sg-blue-soft); }
@container afectados (min-width: 760px) {
  .sg-afectados__table { display: table; table-layout: fixed; }
  .sg-afectados__table thead { display: table-header-group; }
  .sg-afectados__table tbody { display: table-row-group; }
  .sg-afectados__table tr { display: table-row; }
  .sg-afectados__table td { display: table-cell; vertical-align: top; }
  .sg-afectados__table td::before { display: none; }
  .sg-afectados__table thead th:first-child { width: 88px; }
  .sg-afectados__table thead th:nth-child(2) { width: 38%; }
  .sg-afectados__table thead th:nth-child(3) { width: 150px; }
}
</style>
