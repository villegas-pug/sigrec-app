<template>
  <q-dialog v-model="abierto" :maximized="$q.screen.lt.sm">
    <q-card class="sg-dialog" style="width: 860px">
      <q-card-section class="sg-dialog__header">
        <h2 class="text-h6 q-my-none">Buscar centro</h2>
      </q-card-section>
      <q-card-section>
        <q-input v-model="consulta" label="Código o nombre del centro" outlined dense autofocus maxlength="240"
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
          row-key="codigo"
          :columns="columnas"
          :rows="centros"
          :loading="buscando"
          v-model:pagination="paginacion"
          :rows-per-page-options="[5]"
          :no-data-label="buscando ? 'Buscando…' : error ? 'No se pudieron cargar los resultados.' : 'No se encontraron centros.'"
          @request="({ pagination }) => buscar(pagination.page)"
        >
          <template #body-cell-accion="celda">
            <q-td :props="celda">
              <q-btn flat dense color="primary" label="Seleccionar" @click="seleccionar(celda.row)" />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cerrar" color="secondary" @click="abierto = false" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
// SPEC 052: buscador de centros de los filtros de cabecera, con el mismo comportamiento que el de unidades orgánicas.
import { api } from 'src/services/api'
import { useBusquedaPaginada } from 'src/composables/useBusquedaPaginada'

const emit = defineEmits(['seleccionar'])
const abierto = defineModel({ type: Boolean, default: false })
const { consulta, textoValido, filas: centros, buscando, error, paginacion, buscar } = useBusquedaPaginada(abierto,
  (q, pagina) => api(`/centros/buscar?${new URLSearchParams({ q, pagina })}`))
const columnas = [
  { name: 'codigo', label: 'Código', field: 'codigo', align: 'left' },
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left' },
  { name: 'unidadOrganica', label: 'Unidad orgánica', field: (fila) => fila.unidadOrganica || '—', align: 'left' },
  { name: 'direccion', label: 'Dirección', field: (fila) => fila.direccion || '—', align: 'left' },
  { name: 'accion', label: 'Selección', field: 'codigo', align: 'left' }
]

function seleccionar ({ codigo, nombre }) {
  emit('seleccionar', { codigo, nombre })
  abierto.value = false
}
</script>
