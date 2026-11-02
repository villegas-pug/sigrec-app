<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #acciones>
          <q-btn
            v-if="puedeAcceder('registro') && puedeHacer('bien.registrar')"
            unelevated
            color="primary"
            icon="add"
            label="Registrar bien"
            :to="{ name: 'registro', query: contextoRegistro }"
          />
        </template>
      </page-header>

      <div class="sg-filters">
        <q-select v-model="carId" :options="opcionesCar" emit-value map-options outlined dense label="Centro" />
        <q-input v-model="texto" outlined dense clearable label="Buscar por nombre, rótulo o código patrimonial">
          <template #append><q-icon name="search" /></template>
        </q-input>
        <q-select v-model="situacion" :options="OPCIONES_SITUACION" emit-value map-options outlined dense label="Situación" />
      </div>

      <div class="sg-split">
        <section-card titulo="Ubicación" subtitulo="Centro › ambiente › bien › componente">
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
              <div class="row items-center q-gutter-x-sm q-gutter-y-xs">
                <q-icon :name="node.icono" size="18px" aria-hidden="true" />
                <span :class="{ 'text-weight-bold': node.id === seleccionado || node.tipo === 'centro' || node.id === ambienteDestacado }">{{ node.label }}</span>
                <span v-if="node.codigo" class="sg-muted">{{ node.codigo }}</span>
                <status-chip v-if="node.bien && node.bien.situacion === 'baja'" tono="ne" label="Baja" />
                <status-chip v-else-if="node.bien && node.bien.situacion === 'anulado'" v-bind="CHIP_ANULADO" />
                <status-chip v-else-if="node.bien && ['malo', 'inservible'].includes(node.bien.condicion)" v-bind="condicion(node.bien.condicion)" />
                <status-chip v-if="node.bien?.revisionPendiente" tono="wa" label="Revisar" />
              </div>
            </template>
          </q-tree>
          <p v-else class="sg-muted">No hay bienes que coincidan con los filtros.</p>
        </section-card>

        <div ref="fichaRef">
          <bien-ficha
            v-if="bien"
            :bien="bien"
            @accion="abrirAccion"
            @seleccionar="seleccionar"
            @mantener="mantener"
          />
          <section-card v-else titulo="Ficha del bien">
            <p class="sg-muted q-mb-none">Seleccione un bien en el árbol para ver su ficha, componentes y antecedentes.</p>
          </section-card>
        </div>
      </div>
    </div>

    <bien-accion-dialog v-if="bien" v-model="accion.abierta" :modo="accion.modo" :bien="bien" @hecho="seleccionar" />
    <bien-edicion-dialog v-if="bien" v-model="edicion.abierta" :modo="edicion.modo" :bien="bien" @hecho="seleccionar" />
    <incidente-dialog v-model="incidente.abierto" :bien="bien" />
    <anular-dialog v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
  </q-page>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import AnularDialog from 'components/common/AnularDialog.vue'
import BienFicha from 'components/bienes/BienFicha.vue'
import BienAccionDialog from 'components/bienes/BienAccionDialog.vue'
import BienEdicionDialog from 'components/bienes/BienEdicionDialog.vue'
import IncidenteDialog from 'components/bienes/IncidenteDialog.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useCentroSeleccionado } from 'src/composables/useCentroSeleccionado'
import { useAnulacion } from 'src/composables/useAnulacion'
import { ambientePorId, bienPorId, ubicacionDeAmbiente, ubicacionDeBien } from 'src/services/datos'
import { arbolDeCentros, nodoAmbienteId, nodoCentroId } from 'src/services/bienes'
import { anularBien, cerrarRevision, dependenciasDeBien, desasociarBien, reactivarBien } from 'src/services/acciones'
import { CHIP_ANULADO, TODOS, condicion } from 'src/config/catalogos'
import { BIEN_INICIAL_DEMO } from 'src/config/demo'

const OPCIONES_SITUACION = [
  { label: 'Activos', value: 'activo' },
  { label: 'Dados de baja', value: 'baja' },
  { label: 'Activos y dados de baja', value: TODOS },
  { label: 'Anulados (registro erróneo)', value: 'anulado' }
]

const $q = useQuasar()
const route = useRoute()
const { enAmbitoCar, puedeAcceder, puedeHacer } = usePerfil()
const { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion } = useAnulacion()

const centroDe = (b) => ubicacionDeBien(b).car.id

const ambienteRuta = ambientePorId(route.query.ambiente)
const bienInicial = bienPorId(route.query.bien) ?? (ambienteRuta ? null : bienPorId(BIEN_INICIAL_DEMO))
const bienValido = bienInicial && enAmbitoCar(centroDe(bienInicial)) ? bienInicial : null

// Sin centro en la URL se muestran todos los centros del ámbito; el bien inicial queda seleccionado igualmente.
const { carId, opcionesCar, carIdsVisibles } = useCentroSeleccionado(route.query.car, { todos: true })
const texto = ref('')
const situacion = ref(TODOS)
const seleccionado = ref(bienValido?.id ?? null)
const ambienteDestacado = ambienteRuta ? nodoAmbienteId(ambienteRuta.id) : null
const fichaRef = ref(null)

const arbol = computed(() => arbolDeCentros(carIdsVisibles.value, { texto: texto.value ?? '', situacion: situacion.value }))

// Ids de un nodo y de todos sus descendientes con hijos.
const idsExpandibles = (nodos) => nodos.flatMap((n) => (n.children?.length ? [n.id, ...idsExpandibles(n.children)] : []))

// Ruta de nodos hasta el bien seleccionado o el ambiente indicado en la URL (RF-01).
function rutaHasta (nodos, objetivo, camino = []) {
  for (const n of nodos) {
    if (n.id === objetivo) return camino
    const r = n.children?.length ? rutaHasta(n.children, objetivo, [...camino, n.id]) : null
    if (r) return r
  }
  return null
}

// Con búsqueda se expande todo; si no, los centros, el ambiente indicado y la ruta del bien seleccionado.
// Con un solo centro visible se expanden también sus ambientes y bienes.
const expandidos = ref([])
watch(arbol, (nodos) => {
  if (texto.value || nodos.length === 1) {
    expandidos.value = idsExpandibles(nodos)
    return
  }
  const destino = ambienteDestacado ?? seleccionado.value
  const ruta = destino ? rutaHasta(nodos, destino) ?? [] : []
  const ambiente = ambienteDestacado ? idsExpandibles(nodos.flatMap((n) => n.children).filter((a) => a.id === ambienteDestacado)) : []
  expandidos.value = [...new Set([...nodos.map((n) => n.id), ...ruta, ...ambiente])]
}, { immediate: true })

const bien = computed(() => {
  const candidato = seleccionado.value ? bienPorId(seleccionado.value) : null
  return candidato && carIdsVisibles.value.includes(centroDe(candidato)) ? candidato : null
})

// En pantallas pequeñas la ficha queda debajo del árbol: se baja hasta ella al elegir un bien.
watch(seleccionado, async (id) => {
  if (!id || !$q.screen.lt.md) return
  await nextTick()
  fichaRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
})

// El registro conserva el centro y el ambiente del bien seleccionado (o del centro filtrado).
const contextoRegistro = computed(() => {
  if (bien.value) return { car: centroDe(bien.value), ambiente: bien.value.ambienteId }
  const carAmbiente = ambienteRuta ? ubicacionDeAmbiente(ambienteRuta.id).car.id : null
  if (carAmbiente && carIdsVisibles.value.includes(carAmbiente)) return { car: carAmbiente, ambiente: ambienteRuta.id }
  return carId.value !== TODOS && carId.value ? { car: carId.value } : {}
})

function seleccionar (id) {
  if (!id) return
  seleccionado.value = id
  const b = bienPorId(id)
  if (b) {
    const ruta = rutaHasta(arbol.value, id) ?? [nodoCentroId(centroDe(b)), nodoAmbienteId(b.ambienteId)]
    expandidos.value = [...new Set([...expandidos.value, ...ruta])]
  }
}

const accion = reactive({ abierta: false, modo: 'verificacion' })
const edicion = reactive({ abierta: false, modo: 'datos' })
const incidente = reactive({ abierto: false })

function abrirAccion (modo) {
  const actual = bien.value
  if (modo === 'desasociar') {
    $q.dialog({
      title: 'Quitar asociación',
      message: `${actual.nombre} ${actual.id} dejará de ser componente. La relación anterior queda en sus antecedentes.`,
      persistent: true,
      cancel: { flat: true, label: 'Cancelar', color: 'secondary' },
      ok: { unelevated: true, label: 'Quitar asociación', color: 'primary' }
    }).onOk(() => {
      desasociarBien(actual)
      $q.notify({ type: 'positive', message: 'El bien deja de ser componente. La relación queda en sus antecedentes.' })
    })
    return
  }
  if (modo === 'incidente') {
    incidente.abierto = true
    return
  }
  if (modo === 'anular') {
    pedirAnulacion({
      titulo: 'Anular registro del bien',
      subtitulo: `${actual.nombre} · ${actual.id}`,
      dependencias: dependenciasDeBien(actual),
      aviso: 'Anular corrige un registro erróneo: el bien deja de contar en necesidades y avisos. Para retirar un bien que existió, use «Dar de baja».',
      mensaje: 'Registro del bien anulado.',
      ejecutar: (datos) => anularBien(actual, datos)
    })
    return
  }
  if (modo === 'reactivar') {
    pedirReactivacion({ entidad: 'bien', registro: actual, nombre: 'Bien', accion: reactivarBien })
    return
  }
  if (modo === 'datos' || modo === 'componente' || modo === 'trasladar') {
    edicion.modo = modo === 'trasladar' ? 'traslado' : modo
    edicion.abierta = true
    return
  }
  accion.modo = modo
  accion.abierta = true
}

function mantener () {
  cerrarRevision(bien.value)
  $q.notify({ type: 'positive', message: 'Situación revisada: el bien se mantiene activo.' })
}
</script>
