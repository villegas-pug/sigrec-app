<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header />
      <p class="sg-muted">Consulta general de incidentes, bajas y reposiciones. Las operaciones se realizan desde las fichas de Gestión de centros.</p>

      <registro-no-disponible v-if="hechoNoDisponible" entidad="El hecho" :id="hechoPedido" :volver="{ name: 'incidencias' }" etiqueta-volver="Ver todos los hechos" />

      <div class="sg-filters">
        <q-select v-model="carId" :options="opcionesCar" emit-value map-options outlined dense label="Centro">
          <template #append><boton-dictado v-model="carId" tipo="opcion" :opciones="opcionesCar" emit-value /></template>
        </q-select>
        <q-select v-model="filtros.ambienteId" :options="opcionesAmbiente" emit-value map-options outlined dense label="Ambiente" :disable="carId === TODOS" :hint="carId === TODOS ? 'Elija un centro' : ''">
          <template #append><boton-dictado v-model="filtros.ambienteId" tipo="opcion" :opciones="opcionesAmbiente" emit-value :disable="carId === TODOS" /></template>
        </q-select>
        <q-input v-model="filtros.texto" outlined dense clearable label="Recurso (bien, rótulo o ambiente)">
          <template #append><boton-dictado v-model="filtros.texto" /></template>
        </q-input>
        <q-select v-model="filtros.tipo" :options="opcionesTipo" emit-value map-options outlined dense label="Hecho">
          <template #append><boton-dictado v-model="filtros.tipo" tipo="opcion" :opciones="opcionesTipo" emit-value /></template>
        </q-select>
        <q-select v-model="filtros.necesidad" :options="OPCIONES_NECESIDAD" emit-value map-options outlined dense label="Necesidad">
          <template #append><boton-dictado v-model="filtros.necesidad" tipo="opcion" :opciones="OPCIONES_NECESIDAD" emit-value /></template>
        </q-select>
        <q-select v-model="filtros.anio" :options="opcionesAnio" emit-value map-options outlined dense label="Período">
          <template #append><boton-dictado v-model="filtros.anio" tipo="opcion" :opciones="opcionesAnio" emit-value /></template>
        </q-select>
        <div class="row items-center q-gutter-x-sm">
          <filtro-inactivos v-model="mostrarInactivos" />
          <q-btn flat dense color="secondary" icon="filter_alt_off" label="Limpiar filtros" @click="limpiarFiltros" />
        </div>
      </div>

      <section-card titulo="Hechos registrados" :subtitulo="`${plural(eventos.length, 'hecho', 'hechos')} · del más reciente al más antiguo`" sin-relleno>
        <div class="sg-table-wrap">
          <table class="sg-table">
            <thead>
              <tr><th scope="col">Fecha</th><th scope="col">Hecho</th><th scope="col">Centro · ubicación</th><th scope="col">Recurso</th><th scope="col">Necesidad</th></tr>
            </thead>
            <tbody>
              <tr v-for="ev in eventos" :key="ev.id" :class="{ 'sg-row--selected': ev.id === eventoId }" :aria-current="ev.id === eventoId ? 'true' : undefined">
                <td>{{ fecha(ev.fecha) }}</td>
                <td>
                  <status-chip v-bind="TIPOS_EVENTO[ev.tipo]" />
                  <status-chip v-if="ev.anulacion" v-bind="CHIP_ANULADO" class="q-ml-xs" />
                </td>
                <td>{{ ubicacion(ev).car.nombre }} · {{ ubicacion(ev).ambiente?.nombre ?? 'Centro' }}</td>
                <td><button type="button" class="sg-row-btn" @click="elegirDeLista(ev.id)"><q-icon name="visibility" size="16px" aria-hidden="true" class="q-mr-xs" />{{ ev.titulo }}</button><div class="sg-muted">{{ ev.bienIds.join(', ') }}</div></td>
                <td><status-chip :tono="estadoNecesidad(ev).tono" :label="estadoNecesidad(ev).label" /></td>
              </tr>
              <tr v-if="!eventos.length"><td colspan="5" class="sg-muted">Sin hechos para los filtros seleccionados.</td></tr>
            </tbody>
          </table>
        </div>
      </section-card>

      <detalle-hecho v-if="evento" ref="detalleRef" :evento="evento" @seleccionar="irAHecho">
        <template #acciones><q-btn v-if="anteriorInterno" flat dense no-caps color="secondary" icon="undo" :label="`Volver al hecho ${anteriorInterno.etiqueta}`" @click="regresarAnterior" /></template>
      </detalle-hecho>
    </div>

  </q-page>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed, nextTick, reactive, ref, toRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import RegistroNoDisponible from 'components/common/RegistroNoDisponible.vue'
import FiltroInactivos from 'components/common/FiltroInactivos.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useCentroSeleccionado } from 'src/composables/useCentroSeleccionado'
import { useEstadoNavegacion } from 'src/composables/useEstadoNavegacion'
import { useRecorridoInterno } from 'src/composables/useRecorridoInterno'
import { db, ambientesDeCar, bienPorId, ubicacionDeAmbiente } from 'src/services/datos'
import { calcularNecesidades } from 'src/services/necesidades'
import DetalleHecho from 'components/bienes/DetalleHecho.vue'
import { TIPOS_HECHO, ESTADOS, estadoNecesidad as estadoHecho, hechosRegistrados, ubicacionHecho } from 'src/services/incidencias'
import { CHIP_ANULADO, TIPOS_EVENTO, TODOS } from 'src/config/catalogos'
import { ANIO_REVISION } from 'src/config/demo'
import { fecha, plural } from 'src/utils/formato'
import { mostrarDetalle, parametro } from 'src/utils/navegacion'

const TIPOS_HISTORIAL = TIPOS_HECHO

// Estados de necesidad: el mismo significado en el listado y en el detalle.
const OPCIONES_NECESIDAD = [
  { label: 'Todas', value: TODOS },
  { label: ESTADOS.pendiente.label, value: 'pendiente' },
  { label: ESTADOS.atendida.label, value: 'atendida' },
  { label: ESTADOS.sin.label, value: 'sin' },
  { label: ESTADOS.anulado.label, value: 'anulado' }
]

const route = useRoute()
const { enAmbitoCar, carIdsEnAmbito } = usePerfil()
const { carId, opcionesCar } = useCentroSeleccionado(route.query.car, { todos: true })

// Centro utilizado por el filtro de ambientes del visor.
const carContexto = computed(() => (carId.value === TODOS ? null : carId.value))

const opcionesAmbiente = computed(() => [
  { label: 'Todos los ambientes', value: TODOS },
  ...(carContexto.value ? ambientesDeCar(carContexto.value).map((a) => ({ label: a.nombre, value: a.id })) : [])
])
const opcionesTipo = [{ label: 'Todos', value: TODOS }, ...TIPOS_HISTORIAL.map((t) => ({ label: TIPOS_EVENTO[t].label, value: t }))]
// Los años del filtro salen de los hechos registrados, del más reciente al más antiguo.
const opcionesAnio = computed(() => [
  { label: 'Todos los períodos', value: TODOS },
  ...[...new Set(db.eventos.map((ev) => ev.fecha.slice(0, 4)))].sort().reverse().map((a) => ({ label: a, value: a }))
])

const pendientes = computed(() => calcularNecesidades({ anio: ANIO_REVISION, carIds: carIdsEnAmbito.value }).pendientes)
const estadoNecesidad = (ev) => estadoHecho(ev, pendientes.value)

const filtros = reactive({ ambienteId: TODOS, texto: '', tipo: TODOS, necesidad: TODOS, anio: TODOS })
// Un hecho anulado pedido por enlace solo se ve con los inactivos.
const mostrarInactivos = ref(!!db.eventos.find((e) => e.id === parametro(route.query.hecho))?.anulacion)
const detalleRef = ref(null)

function limpiarFiltros () {
  hechoNoDisponible.value = false
  carId.value = opcionesCar.value[0]?.value ?? TODOS
  Object.assign(filtros, { ambienteId: TODOS, texto: '', tipo: TODOS, necesidad: TODOS, anio: TODOS })
  mostrarInactivos.value = false
}

const ubicacion = ubicacionHecho

const eventos = computed(() => {
  const t = (filtros.texto ?? '').toLowerCase()
  return hechosRegistrados({ inactivos: mostrarInactivos.value })
    .filter((ev) => {
      const u = ubicacion(ev)
      if (!enAmbitoCar(u.car.id)) return false
      if (carId.value !== TODOS && u.car.id !== carId.value) return false
      if (filtros.ambienteId !== TODOS && ev.ambienteId !== filtros.ambienteId) return false
      if (filtros.tipo !== TODOS && ev.tipo !== filtros.tipo) return false
      if (filtros.necesidad !== TODOS && estadoNecesidad(ev).clave !== filtros.necesidad) return false
      if (filtros.anio !== TODOS && !ev.fecha.startsWith(filtros.anio)) return false
      if (!t) return true
      const nombres = ev.bienIds.map((id) => bienPorId(id)?.nombre ?? '').join(' ')
      return [ev.titulo, u.ambiente?.nombre ?? 'Centro', nombres, ...ev.bienIds].some((v) => v.toLowerCase().includes(t))
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
})

// Enlace profundo (?hecho=): se selecciona ese hecho; si no existe o no se puede ver, se avisa y no se elige otro.
const hechoPedido = parametro(route.query.hecho)
const hechoNoDisponible = ref(!!hechoPedido && !eventos.value.some((e) => e.id === hechoPedido))
const eventoId = ref(hechoNoDisponible.value ? null : hechoPedido)

// Al volver con «Atrás» se recuperan los filtros y el hecho elegido. Va antes del watch de `carId` para no reiniciar el ambiente restaurado.
useEstadoNavegacion('incidencias', {
  carId,
  ambienteId: toRef(filtros, 'ambienteId'),
  texto: toRef(filtros, 'texto'),
  tipo: toRef(filtros, 'tipo'),
  necesidad: toRef(filtros, 'necesidad'),
  anio: toRef(filtros, 'anio'),
  mostrarInactivos,
  eventoId
})

// Hechos visitados desde el historial de un bien, para «Volver al hecho ‹anterior›» (SPEC 011, Ola 5).
const recorrido = useRecorridoInterno('incidencias')
const anteriorInterno = recorrido.anterior

// El ambiente pertenece a un centro: al cambiar de centro deja de aplicar.
watch(carId, () => { filtros.ambienteId = TODOS })

watch(eventos, (lista) => {
  if (hechoNoDisponible.value) return
  if (!lista.some((e) => e.id === eventoId.value)) eventoId.value = lista[0]?.id ?? null
}, { immediate: true })

// El detalle queda debajo de la tabla: al elegir un hecho se resalta su fila y, si el detalle no está a la vista, se baja hasta él.
function seleccionar (id) {
  hechoNoDisponible.value = false
  eventoId.value = id
  mostrarDetalle(detalleRef)
}

const evento = computed(() => eventos.value.find((e) => e.id === eventoId.value) ?? null)
// Salta a un hecho del historial; si un filtro lo oculta, los limpia primero.
// Antes de saltar se recuerdan el hecho y los filtros actuales, para «Volver al hecho ‹anterior›» (SPEC 011, Ola 5).
function irAHecho (id) {
  if (evento.value && id !== eventoId.value) {
    recorrido.apilar(
      { eventoId: eventoId.value, carId: carId.value, filtros: { ...filtros }, mostrarInactivos: mostrarInactivos.value },
      `«${evento.value.titulo}»`
    )
  }
  if (!eventos.value.some((e) => e.id === id)) limpiarFiltros()
  seleccionar(id)
}

// Elegir un hecho en la tabla es la navegación principal de la pantalla: olvida los saltos anteriores.
function elegirDeLista (id) {
  recorrido.vaciar()
  seleccionar(id)
}

// Restaura el hecho y los filtros previos al salto. El cambio de centro reinicia el ambiente, por eso los filtros van después.
async function regresarAnterior () {
  const previo = recorrido.regresar()
  if (!previo) return
  carId.value = previo.carId
  mostrarInactivos.value = previo.mostrarInactivos
  await nextTick()
  Object.assign(filtros, previo.filtros)
  seleccionar(previo.eventoId)
}

</script>
