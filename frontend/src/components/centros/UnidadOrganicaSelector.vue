<template>
  <div :class="{ 'unidad-organica-selector--activador': $slots.activador }">
    <slot
      v-if="$slots.activador"
      name="activador"
      :abrir="abrir"
      :deshabilitado="deshabilitado"
      :seleccionada="!!modelValue"
    />
    <q-field
      v-else
      :model-value="modelValue?.id ?? null"
      :rules="obligatoria ? [validarUnidad] : undefined"
      :label="obligatoria ? 'Unidad orgánica *' : 'Unidad orgánica'"
      outlined
      dense
      stack-label
    >
      <template #control="{ id }">
        <div :id="id" class="self-center">{{ modelValue?.nombre ?? 'Sin unidad orgánica' }}</div>
      </template>
      <template #append>
        <q-btn
          :disable="deshabilitado"
          :label="modelValue ? 'Cambiar unidad' : 'Buscar unidad orgánica'"
          color="primary"
          icon="search"
          flat
          dense
          @click="abrir"
        />
      </template>
    </q-field>
    <div v-if="!$slots.activador && (modelValue?.codigo || modelValue?.direccion)" class="sg-muted q-mt-xs text-caption">
      <div v-if="modelValue.codigo">Código: {{ modelValue.codigo }}</div>
      <div v-if="modelValue.direccion">Dirección: {{ modelValue.direccion }}</div>
    </div>
    <p v-if="!$slots.activador && modelValue?.elegible === false" class="q-mt-sm q-mb-none" role="status">
      <q-icon name="warning_amber" />
      La unidad vinculada ya no está activa o fue eliminada. Puede conservarla o elegir otra.
    </p>

    <q-dialog v-model="abierto" :maximized="$q.screen.lt.sm">
      <q-card class="sg-dialog" style="width: 760px">
        <q-card-section class="sg-dialog__header">
          <h2 class="text-h6 q-my-none">Buscar unidad orgánica</h2>
        </q-card-section>
        <q-card-section>
          <q-input v-model="consulta" label="Nombre de la unidad orgánica" outlined dense autofocus maxlength="240"
                   hint="Escriba al menos 3 caracteres." @keydown.enter.prevent />
          <div v-if="error" class="q-my-md" role="alert">
            {{ error }}
            <q-btn flat color="primary" label="Reintentar" @click="buscar(paginacion.page)" />
          </div>
          <q-table
            v-if="textoValido"
            class="q-mt-sm"
            flat
            wrap-cells
            row-key="id"
            :columns="columnas"
            :rows="unidades"
            :loading="buscando"
            v-model:pagination="paginacion"
            :rows-per-page-options="[5]"
            :no-data-label="buscando ? 'Buscando…' : error ? 'No se pudieron cargar los resultados.' : 'No se encontraron unidades.'"
            @request="({ pagination }) => buscar(pagination.page)"
          >
            <template #body-cell-accion="celda">
              <q-td :props="celda">
                <span v-if="celda.row.ocupada" class="text-caption">Ya vinculada a otro centro</span>
                <q-btn v-else flat dense color="primary" label="Seleccionar" @click="seleccionar(celda.row)" />
              </q-td>
            </template>
          </q-table>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cerrar" color="secondary" @click="abierto = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { api } from 'src/services/api'
import { useBusquedaPaginada } from 'src/composables/useBusquedaPaginada'

const props = defineProps({
  modelValue: { type: Object, default: null },
  centro: { type: String, default: null },
  busquedaInicial: { type: String, default: '' },
  obligatoria: Boolean,
  deshabilitado: Boolean
})
const emit = defineEmits(['update:modelValue', 'seleccionar'])
const abierto = ref(false)
const { consulta, textoValido, filas: unidades, buscando, error, paginacion, buscar } = useBusquedaPaginada(abierto, (q, pagina) => {
  const params = new URLSearchParams({ q, pagina })
  if (props.centro) params.set('centro', props.centro)
  return api(`/centros/unidades-organicas?${params}`)
})
const columnas = [
  { name: 'nombre', label: 'Nombre oficial', field: 'nombre', align: 'left' },
  { name: 'codigo', label: 'Código', field: (fila) => fila.codigo || '—', align: 'left' },
  { name: 'direccion', label: 'Dirección', field: (fila) => fila.direccion || '—', align: 'left' },
  { name: 'accion', label: 'Selección', field: 'ocupada', align: 'left' }
]

const validarUnidad = (id) => id != null || 'Seleccione una unidad orgánica.'

function abrir () {
  consulta.value = props.busquedaInicial.trim()
  abierto.value = true
}

function seleccionar ({ id, nombre, codigo, direccion }) {
  const unidad = { id, nombre, codigo, direccion, elegible: true }
  emit('update:modelValue', unidad)
  emit('seleccionar', unidad)
  abierto.value = false
}
</script>

<style scoped>
.unidad-organica-selector--activador {
  display: inline-flex;
  align-items: center;
}
</style>
