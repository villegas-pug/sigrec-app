<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #acciones>
          <q-btn v-if="puedeHacer('ambiente.registrar')" outline color="secondary" icon="add_home" label="Registrar ambiente" :disable="!car" @click="abrirAmbiente(null)" />
          <q-btn v-if="puedeHacer('novedad.registrar')" unelevated color="primary" icon="add_alert" label="Registrar novedad" :disable="!ambienteActivo" @click="abrirNovedad(null)" />
        </template>
      </page-header>

      <div class="sg-filters">
        <q-select v-model="carId" :options="opcionesCar" emit-value map-options outlined dense label="Centro" />
        <div class="row items-center"><filtro-inactivos v-model="mostrarInactivos" /></div>
      </div>

      <section-card titulo="Ambientes del centro" :subtitulo="car ? `${car.nombre} · ${plural(ambientes.length, 'ambiente', 'ambientes')}` : 'Sin centro seleccionado'" sin-relleno>
        <div class="sg-table-wrap">
          <table class="sg-table">
            <thead>
              <tr>
                <th scope="col">Ambiente</th>
                <th scope="col">Características</th>
                <th scope="col">Condición</th>
                <th scope="col">Novedades abiertas</th>
                <th scope="col">Último pintado</th>
                <th scope="col" class="sg-num">Bienes activos</th>
                <th scope="col"><span class="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="amb in ambientes" :key="amb.id" :class="{ 'sg-row--selected': amb.id === ambienteId }">
                <td>
                  <button type="button" class="sg-row-btn" @click="seleccionar(amb.id)">{{ amb.nombre }}</button>
                  <div class="sg-muted">Piso {{ amb.piso ?? '—' }}</div>
                  <status-chip v-if="amb.anulacion" v-bind="CHIP_ANULADO" />
                </td>
                <td>{{ caracteristicas(amb) }}</td>
                <td><status-chip v-bind="condicion(amb.condicion)" /></td>
                <td>
                  <div class="sg-chips">
                    <status-chip v-for="n in abiertas(amb)" :key="n.id" tono="da" :label="n.titulo" />
                    <span v-if="!abiertas(amb).length" class="sg-muted">Sin novedades</span>
                  </div>
                </td>
                <td>
                  <template v-if="amb.ultimoPintado">{{ fecha(amb.ultimoPintado) }}</template>
                  <status-chip v-else tono="si" label="Fecha no informada" />
                </td>
                <td class="sg-num">
                  <router-link v-if="puedeAcceder('bienes')" :to="{ name: 'bienes', query: { car: carId, ambiente: amb.id } }">{{ activos(amb) }}</router-link>
                  <template v-else>{{ activos(amb) }}</template>
                </td>
                <td class="text-right"><menu-acciones :items="accionesAmbiente(amb)" :etiqueta="`Acciones de ${amb.nombre}`" /></td>
              </tr>
              <tr v-if="!ambientes.length"><td colspan="7" class="sg-muted">El centro aún no tiene ambientes registrados.</td></tr>
            </tbody>
          </table>
        </div>
      </section-card>

      <section-card v-if="ambiente" ref="detalleRef" :titulo="`${ambiente.nombre} · novedades y antecedentes`" :subtitulo="textoUbicacion(ubicacionDeAmbiente(ambiente.id))">
        <template #acciones>
          <q-btn v-if="puedeHacer('ambiente.actualizar')" outline color="secondary" icon="edit" label="Actualizar ambiente" :disable="!ambienteActivo" @click="abrirAmbiente(ambiente)" />
          <q-btn v-if="puedeHacer('intervencion.registrar')" outline color="secondary" icon="format_paint" label="Registrar intervención" :disable="!ambienteActivo" @click="abrirIntervencion(null)" />
        </template>
        <note-banner v-if="ambiente.anulacion" tono="ne" icono="block" class="q-mb-md">
          Ambiente anulado el {{ fecha(ambiente.anulacion.fecha) }} por {{ ambiente.anulacion.por }}. Motivo: {{ ambiente.anulacion.motivo }}
        </note-banner>
        <div class="sg-grid-2">
          <div class="column q-gutter-y-sm">
            <h3 class="sg-kv__label q-my-none">Novedades</h3>
            <div v-for="n in novedades" :key="n.id" class="sg-box">
              <div class="row items-start no-wrap justify-between">
                <div class="sg-chips items-center">
                  <status-chip :tono="n.atendida ? 'ok' : 'da'" :label="n.atendida ? 'Atendida' : 'Abierta'" />
                  <status-chip v-if="n.anulacion" v-bind="CHIP_ANULADO" />
                  <span class="text-weight-bold">{{ n.titulo }}</span>
                </div>
                <menu-acciones :items="accionesNovedad(n)" :etiqueta="`Acciones de la novedad ${n.titulo}`" />
              </div>
              <span class="sg-muted">{{ TIPOS_NOVEDAD[n.tipo] ?? n.tipo }}</span>
              <span>{{ n.detalle }} Ubicación: {{ n.ubicacion }}.</span>
              <span class="sg-muted">Informada el {{ fecha(n.fecha) }} por {{ n.informadoPor }}</span>
              <span v-if="n.atencion" class="sg-muted">Atendida el {{ fecha(n.atencion.fecha) }}<template v-if="n.atencion.detalle">: {{ n.atencion.detalle }}</template></span>
              <span v-if="n.anulacion" class="sg-muted">Anulada el {{ fecha(n.anulacion.fecha) }}: {{ n.anulacion.motivo }}</span>
              <div v-if="n.requiereEvaluacion && !n.atendida && !n.anulacion" class="sg-chips">
                <status-chip tono="in" label="Necesidad de infraestructura: requiere evaluación" />
                <status-chip tono="si" label="Costo no estimado" />
              </div>
            </div>
            <p v-if="!novedades.length" class="sg-muted">Sin novedades registradas.</p>
          </div>
          <div class="column q-gutter-y-sm">
            <h3 class="sg-kv__label q-my-none">Antecedentes de intervenciones</h3>
            <div v-for="(i, idx) in intervenciones" :key="idx" class="sg-box">
              <div class="row items-center no-wrap justify-between">
                <span>{{ i.descripcion }}</span>
                <span class="row items-center no-wrap">
                  <span v-if="i.fecha" class="text-weight-bold">{{ fecha(i.fecha) }}</span>
                  <status-chip v-else tono="si" label="Fecha no informada" />
                  <menu-acciones :items="accionesIntervencion(i)" :etiqueta="`Acciones de la intervención ${i.descripcion}`" />
                </span>
              </div>
              <div v-if="i.anulacion" class="sg-chips items-center">
                <status-chip v-bind="CHIP_ANULADO" />
                <span class="sg-muted">{{ i.anulacion.motivo }}</span>
              </div>
            </div>
            <p v-if="!intervenciones.length" class="sg-muted">Sin antecedentes de intervenciones.</p>
          </div>
        </div>
      </section-card>
    </div>

    <ambiente-dialog v-if="car" v-model="dialogoAmbiente.abierto" :centro="car" :ambiente="dialogoAmbiente.ambiente" @hecho="seleccionar" />
    <novedad-dialog v-if="ambiente" v-model="dialogoNovedad.abierto" :ambiente="ambiente" :novedad="dialogoNovedad.novedad" />
    <intervencion-dialog v-if="ambiente" v-model="dialogoIntervencion.abierto" :ambiente="ambiente" :intervencion="dialogoIntervencion.intervencion" />
    <atencion-dialog v-if="dialogoAtencion.novedad" v-model="dialogoAtencion.abierto" :novedad="dialogoAtencion.novedad" />
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
import NoteBanner from 'components/common/NoteBanner.vue'
import MenuAcciones from 'components/common/MenuAcciones.vue'
import FiltroInactivos from 'components/common/FiltroInactivos.vue'
import AnularDialog from 'components/common/AnularDialog.vue'
import AmbienteDialog from 'components/centros/AmbienteDialog.vue'
import NovedadDialog from 'components/centros/NovedadDialog.vue'
import IntervencionDialog from 'components/centros/IntervencionDialog.vue'
import AtencionDialog from 'components/centros/AtencionDialog.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useCentroSeleccionado } from 'src/composables/useCentroSeleccionado'
import { useAnulacion } from 'src/composables/useAnulacion'
import { ambientePorId, ambientesDeCar, bienesDeAmbiente, textoUbicacion, ubicacionDeAmbiente, vigente } from 'src/services/datos'
import { anular, dependenciasDeAmbiente } from 'src/services/acciones'
import { CHIP_ANULADO, TIPOS_NOVEDAD, condicion } from 'src/config/catalogos'
import { fecha, plural } from 'src/utils/formato'

const $q = useQuasar()
const route = useRoute()
const { puedeAcceder, puedeHacer } = usePerfil()
const { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion } = useAnulacion()
const { carId, car, opcionesCar } = useCentroSeleccionado(route.query.car)

const mostrarInactivos = ref(false)
const detalleRef = ref(null)

const ambientes = computed(() => (carId.value ? ambientesDeCar(carId.value, { inactivos: mostrarInactivos.value }) : []))
const ambienteId = ref(ambientes.value.find((a) => a.id === route.query.ambiente)?.id ?? ambientes.value[0]?.id ?? null)
const ambiente = computed(() => (ambienteId.value ? ambientePorId(ambienteId.value) : null))
const ambienteActivo = computed(() => !!ambiente.value && vigente(ambiente.value))

// Al cambiar de centro o de filtro se conserva el ambiente si sigue visible; si no, se elige el primero.
watch(ambientes, (lista) => {
  if (!lista.some((a) => a.id === ambienteId.value)) ambienteId.value = lista[0]?.id ?? null
})

const novedades = computed(() => (ambiente.value?.novedades ?? []).filter((n) => mostrarInactivos.value || vigente(n)))
const intervenciones = computed(() => (ambiente.value?.intervenciones ?? []).filter((i) => mostrarInactivos.value || vigente(i)))

const caracteristicas = (amb) =>
  [
    amb.areaM2 != null ? `${amb.areaM2} m²` : null,
    amb.ventanas != null ? plural(amb.ventanas, 'ventana', 'ventanas') : null,
    amb.puertas != null ? plural(amb.puertas, 'puerta', 'puertas') : null
  ].filter(Boolean).join(', ') || 'No informadas'

const abiertas = (amb) => amb.novedades.filter((n) => vigente(n) && !n.atendida)
const activos = (amb) => bienesDeAmbiente(amb.id).filter((b) => b.situacion === 'activo').length

// En pantallas pequeñas el detalle queda debajo de la tabla: se baja hasta él al elegir un ambiente.
async function seleccionar (id) {
  ambienteId.value = id
  if ($q.screen.lt.md) {
    await nextTick()
    detalleRef.value?.$el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const dialogoAmbiente = reactive({ abierto: false, ambiente: null })
const dialogoNovedad = reactive({ abierto: false, novedad: null })
const dialogoIntervencion = reactive({ abierto: false, intervencion: null })
const dialogoAtencion = reactive({ abierto: false, novedad: null })

const abrirAmbiente = (amb) => Object.assign(dialogoAmbiente, { abierto: true, ambiente: amb })
const abrirNovedad = (novedad) => Object.assign(dialogoNovedad, { abierto: true, novedad })
const abrirIntervencion = (intervencion) => Object.assign(dialogoIntervencion, { abierto: true, intervencion })
const abrirAtencion = (novedad) => Object.assign(dialogoAtencion, { abierto: true, novedad })

const accionesAmbiente = (amb) => [
  { label: 'Actualizar ambiente', icono: 'edit', visible: puedeHacer('ambiente.actualizar') && vigente(amb), accion: () => abrirAmbiente(amb) },
  {
    label: 'Anular ambiente',
    icono: 'block',
    peligro: true,
    visible: puedeHacer('ambiente.anular') && vigente(amb),
    accion: () => pedirAnulacion({
      titulo: 'Anular ambiente',
      subtitulo: `${amb.nombre} · ${amb.id}`,
      dependencias: dependenciasDeAmbiente(amb),
      aviso: 'Los bienes activos del ambiente deben trasladarse a otro ambiente o darse de baja antes de anularlo.',
      mensaje: 'Ambiente anulado.',
      ejecutar: (datos) => anular(amb, datos)
    })
  },
  {
    label: 'Reactivar ambiente',
    icono: 'restore',
    visible: puedeHacer('ambiente.anular') && !vigente(amb),
    accion: () => pedirReactivacion({ entidad: 'ambiente', registro: amb, nombre: 'Ambiente' })
  }
]

const accionesNovedad = (n) => [
  { label: 'Actualizar novedad', icono: 'edit', visible: puedeHacer('novedad.actualizar') && vigente(n), accion: () => abrirNovedad(n) },
  { label: 'Marcar como atendida', icono: 'task_alt', visible: puedeHacer('novedad.atender') && vigente(n) && !n.atendida, accion: () => abrirAtencion(n) },
  {
    label: 'Anular novedad',
    icono: 'block',
    peligro: true,
    visible: puedeHacer('novedad.anular') && vigente(n),
    accion: () => pedirAnulacion({
      titulo: 'Anular novedad',
      subtitulo: n.titulo,
      aviso: 'Una novedad anulada deja de generar necesidad de infraestructura.',
      mensaje: 'Novedad anulada.',
      ejecutar: (datos) => anular(n, datos)
    })
  },
  { label: 'Reactivar novedad', icono: 'restore', visible: puedeHacer('novedad.anular') && !vigente(n), accion: () => pedirReactivacion({ entidad: 'novedad', registro: n, nombre: 'Novedad' }) }
]

const accionesIntervencion = (i) => [
  { label: 'Actualizar intervención', icono: 'edit', visible: puedeHacer('intervencion.actualizar') && vigente(i), accion: () => abrirIntervencion(i) },
  {
    label: 'Anular intervención',
    icono: 'block',
    peligro: true,
    visible: puedeHacer('intervencion.anular') && vigente(i),
    accion: () => pedirAnulacion({
      titulo: 'Anular intervención',
      subtitulo: i.descripcion,
      mensaje: 'Intervención anulada.',
      ejecutar: (datos) => anular(i, datos)
    })
  },
  { label: 'Reactivar intervención', icono: 'restore', visible: puedeHacer('intervencion.anular') && !vigente(i), accion: () => pedirReactivacion({ entidad: 'intervencion', registro: i, nombre: 'Intervención' }) }
]
</script>
