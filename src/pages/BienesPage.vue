<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #acciones>
          <q-btn v-if="puedeAcceder('registro')" outline color="secondary" icon="inventory" label="Aprovechar inventario previo" :to="{ name: 'registro' }" />
          <q-btn v-if="puedeAcceder('registro')" unelevated color="primary" icon="add" label="Registrar bien" :to="{ name: 'registro' }" />
        </template>
      </page-header>

      <div class="sg-filters">
        <q-select v-model="carId" :options="opcionesCar" emit-value map-options outlined dense label="Establecimiento (CAR)" />
        <q-input v-model="texto" outlined dense clearable label="Buscar por nombre, rótulo o código patrimonial">
          <template #append><q-icon name="search" /></template>
        </q-input>
        <q-select v-model="situacion" :options="OPCIONES_SITUACION" emit-value map-options outlined dense label="Situación" />
      </div>

      <div class="sg-split">
        <section-card titulo="Ubicación" subtitulo="Local › ambiente › bien › bien asociado">
          <q-tree
            v-if="arbol.length"
            v-model:selected="seleccionado"
            v-model:expanded="expandidos"
            :nodes="arbol"
            node-key="id"
            label-key="label"
            children-key="children"
            selected-color="secondary"
            no-selection-unset
          >
            <template #default-header="{ node }">
              <div class="row items-center no-wrap q-gutter-x-sm">
                <q-icon :name="node.icono" size="18px" aria-hidden="true" />
                <span :class="{ 'text-weight-bold': node.id === seleccionado }">{{ node.label }}</span>
                <span v-if="node.codigo" class="sg-muted">{{ node.codigo }}</span>
                <status-chip v-if="node.bien && node.bien.situacion === 'baja'" tono="ne" label="Baja" />
                <status-chip v-else-if="node.bien && ['malo', 'inservible'].includes(node.bien.condicion)" v-bind="condicion(node.bien.condicion)" />
                <status-chip v-if="node.bien?.revisionPendiente" tono="wa" label="Revisar" />
              </div>
            </template>
          </q-tree>
          <p v-else class="sg-muted">No hay bienes que coincidan con los filtros.</p>
        </section-card>

        <bien-ficha
          v-if="bien"
          :bien="bien"
          @accion="abrirAccion"
          @seleccionar="seleccionar"
          @mantener="mantener"
        />
        <section-card v-else titulo="Ficha del bien">
          <p class="sg-muted q-mb-none">Seleccione un bien en el árbol para ver su ficha, asociaciones y antecedentes.</p>
        </section-card>
      </div>
    </div>

    <bien-accion-dialog v-if="bien" v-model="accion.abierta" :modo="accion.modo" :bien="bien" @hecho="alTerminar" />
  </q-page>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import BienFicha from 'components/bienes/BienFicha.vue'
import BienAccionDialog from 'components/bienes/BienAccionDialog.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { bienPorId, ubicacionDeBien } from 'src/services/datos'
import { arbolDelCar } from 'src/services/bienes'
import { cerrarRevision } from 'src/services/acciones'
import { condicion } from 'src/config/catalogos'

const OPCIONES_SITUACION = [
  { label: 'Activos', value: 'activo' },
  { label: 'Dados de baja', value: 'baja' },
  { label: 'Todos', value: 'todos' }
]

const $q = useQuasar()
const route = useRoute()
const { carsEnAmbito, enAmbitoCar, puedeAcceder } = usePerfil()

const bienInicial = bienPorId(route.query.bien) ?? bienPorId('AMA-D1-C01-I')
const carInicial = bienInicial && enAmbitoCar(ubicacionDeBien(bienInicial).car.id) ? ubicacionDeBien(bienInicial).car.id : null

const opcionesCar = computed(() => carsEnAmbito.value.map((c) => ({ label: c.nombre, value: c.id })))
const carId = ref(enAmbitoCar(route.query.car) ? route.query.car : carInicial ?? carsEnAmbito.value[0]?.id)
const texto = ref('')
const situacion = ref('todos')
const seleccionado = ref(carInicial && carInicial === carId.value ? bienInicial.id : null)

const arbol = computed(() => (carId.value ? arbolDelCar(carId.value, { texto: texto.value ?? '', situacion: situacion.value }) : []))

// Ambientes y bienes con hijos se expanden para que la ubicación completa quede a la vista (RF-01).
const expandidos = ref([])
const idsExpandibles = (nodos) => nodos.flatMap((n) => (n.children?.length ? [n.id, ...idsExpandibles(n.children)] : []))
watch(arbol, (nodos) => {
  expandidos.value = idsExpandibles(nodos)
}, { immediate: true })

watch(carsEnAmbito, (cars) => {
  if (!cars.some((c) => c.id === carId.value)) carId.value = cars[0]?.id
})
watch(carId, () => {
  seleccionado.value = null
})

const bien = computed(() => {
  const candidato = seleccionado.value ? bienPorId(seleccionado.value) : null
  return candidato && ubicacionDeBien(candidato).car.id === carId.value ? candidato : null
})

function seleccionar (id) {
  seleccionado.value = id
}

const accion = reactive({ abierta: false, modo: 'verificacion' })

function abrirAccion (modo) {
  accion.modo = modo
  accion.abierta = true
}

function alTerminar (nuevoId) {
  if (nuevoId) seleccionado.value = nuevoId
}

function mantener () {
  cerrarRevision(bien.value)
  $q.notify({ type: 'positive', message: 'Situación revisada: el bien se mantiene activo.' })
}
</script>
