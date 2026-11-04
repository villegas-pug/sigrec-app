<template>
  <div class="sg-explorer__col">
    <div class="sg-explorer__filtros">
      <q-input v-model="texto" outlined dense clearable label="Buscar bien por nombre, rótulo o código">
        <template #append><boton-dictado v-model="texto" /><q-icon name="search" /></template>
      </q-input>
      <div class="column q-gutter-y-xs">
        <q-select v-model="situacion" class="full-width" :options="OPCIONES_SITUACION" emit-value map-options outlined dense label="Situación del bien">
          <template #append><boton-dictado v-model="situacion" tipo="opcion" :opciones="OPCIONES_SITUACION" emit-value /></template>
        </q-select>
        <div class="row justify-end">
          <filtro-inactivos v-model="inactivos" />
        </div>
      </div>
    </div>

    <div class="sg-explorer__arbol">
      <q-tree
        v-if="nodos.length"
        :selected="seleccionado"
        v-model:expanded="expandidos"
        :nodes="nodos"
        node-key="id"
        label-key="label"
        children-key="children"
        selected-color="secondary"
        no-selection-unset
        @update:selected="(id) => id && $emit('seleccionar', id)"
      >
        <template #default-header="{ node }">
          <div class="row items-center q-gutter-x-sm q-gutter-y-xs">
            <q-icon :name="node.icono" size="18px" aria-hidden="true" />
            <span :class="{ 'text-weight-bold': node.id === seleccionado || node.tipo === 'centro' }">{{ node.label }}</span>
            <span v-if="node.codigo" class="sg-muted">{{ node.codigo }}</span>
            <status-chip v-if="node.car?.anulacion || node.ambiente?.anulacion" v-bind="CHIP_ANULADO" />
            <status-chip v-if="nuevos.includes(node.id)" tono="ok" label="Nuevo" />
            <status-chip v-if="node.bien && node.bien.situacion === 'baja'" tono="ne" label="Baja" />
            <status-chip v-else-if="node.bien && node.bien.situacion === 'anulado'" v-bind="CHIP_ANULADO" />
            <status-chip v-else-if="node.bien && ['malo', 'inservible'].includes(node.bien.condicion)" v-bind="condicion(node.bien.condicion)" />
            <status-chip v-if="node.bien?.revisionPendiente" tono="wa" label="Revisar" />
          </div>
        </template>
      </q-tree>
      <p v-else class="sg-muted q-mb-none">No hay centros ni bienes que coincidan con los filtros.</p>
    </div>
  </div>
</template>

<script setup>
// Árbol Centro › Ambiente › Bien › Componente con sus filtros. Todos los niveles se pueden seleccionar.
import BotonDictado from 'components/common/BotonDictado.vue'
import FiltroInactivos from 'components/common/FiltroInactivos.vue'
import StatusChip from 'components/common/StatusChip.vue'
import { CHIP_ANULADO, TODOS, condicion } from 'src/config/catalogos'

defineProps({
  nodos: { type: Array, required: true },
  seleccionado: { type: String, default: null },
  // Ids de bienes registrados en esta sesión: se marcan como «Nuevo».
  nuevos: { type: Array, default: () => [] }
})

defineEmits(['seleccionar'])

const texto = defineModel('texto', { type: String, default: '' })
const situacion = defineModel('situacion', { type: String, default: TODOS })
const inactivos = defineModel('inactivos', { type: Boolean, default: false })
const expandidos = defineModel('expandidos', { type: Array, default: () => [] })

const OPCIONES_SITUACION = [
  { label: 'Activos', value: 'activo' },
  { label: 'Dados de baja', value: 'baja' },
  { label: 'Activos y dados de baja', value: TODOS },
  { label: 'Anulados (registro erróneo)', value: 'anulado' }
]
</script>
