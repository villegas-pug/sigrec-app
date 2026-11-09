<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #acciones>
          <q-btn v-if="puedeHacer('vehiculo.registrar')" unelevated color="primary" icon="add" label="Registrar vehículo" :disable="!carsEnAmbito.length" @click="abrir(null)" />
        </template>
      </page-header>

      <registro-no-disponible v-if="vehiculoNoDisponible" entidad="El vehículo" :id="vehiculoPedido" :volver="{ name: 'vehiculos' }" etiqueta-volver="Ver todos los vehículos" />
      <note-banner v-else-if="itinerarioOrigen" tono="in" icono="route">
        Viene del recorrido <strong>{{ itinerarioOrigen.id }}</strong>: complete aquí el rendimiento de referencia del vehículo.
        <router-link v-if="puedeAcceder('itinerarios')" :to="{ name: 'itinerarios', query: { vehiculo: itinerarioOrigen.vehiculoId, itinerario: itinerarioOrigen.id } }" class="text-weight-bold">Volver al recorrido</router-link>
      </note-banner>

      <div class="sg-kpi-panel">
        <kpi-card icono="check_circle" tono="verde" :valor="resumen.operativos" etiqueta="Vehículos operativos" :nota="resumen.sinInformar ? `${plural(resumen.sinInformar, 'vehículo', 'vehículos')} sin estado informado` : `de ${resumen.total} vigentes`" />
        <kpi-card icono="build" tono="ambar" :valor="resumen.requierenAtencion" etiqueta="Requieren atención" :nota="`${plural(resumen.detenidos, 'detenido', 'detenidos')} · ${resumen.requierenMantenimiento} por mantenimiento`" />
        <kpi-card icono="payments" tono="azul" :valor="soles(resumen.presupuestoEstimado)" etiqueta="Presupuesto estimado" :nota="resumen.sinEstimar ? `${plural(resumen.sinEstimar, 'vehículo', 'vehículos')} sin estimar: no suman` : 'Mantenimiento de los vehículos con atención'" />
      </div>

      <div class="sg-filters">
        <q-select v-model="estadoFiltro" :options="OPCIONES_FILTRO_ESTADO" emit-value map-options outlined dense label="Estado operativo">
          <template #append><boton-dictado v-model="estadoFiltro" tipo="opcion" :opciones="OPCIONES_FILTRO_ESTADO" emit-value /></template>
        </q-select>
      </div>

      <section-card titulo="Movilidad por centro" :subtitulo="`${plural(vehiculosVisibles.length, 'vehículo', 'vehículos')} · ${perfil.ambito.descripcion}`" sin-relleno>
        <template #acciones>
          <filtro-inactivos v-model="mostrarInactivos" />
        </template>
        <div v-if="!compacto" class="sg-table-wrap">
          <table class="sg-table">
            <thead>
              <tr>
                <th scope="col">Vehículo</th>
                <th scope="col">Centro</th>
                <th scope="col">Chofer relacionado</th>
                <th scope="col">Estado operativo</th>
                <th scope="col">Combustible</th>
                <th scope="col">Rendimiento de referencia</th>
                <th scope="col" class="sg-num">Itinerarios</th>
                <th scope="col"><span class="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in vehiculosVisibles" :key="v.id" :class="{ 'sg-row--selected': v.id === vehiculoDestacado }">
                <td>
                  <span class="text-weight-bold">{{ v.tipo }} · {{ v.id }}</span>
                  <div class="sg-muted">Placa {{ v.placa }}</div>
                  <status-chip v-if="v.anulacion" v-bind="CHIP_ANULADO" />
                </td>
                <td>{{ carPorId(v.carId).nombre }}</td>
                <td>
                  <template v-if="v.chofer">{{ v.chofer }}</template>
                  <status-chip v-else tono="si" label="No asignado" />
                </td>
                <td>
                  <status-chip v-bind="estadoVehiculo(v.estadoOperativo)" />
                  <div v-if="requiereAtencion(v)" class="sg-muted">
                    <template v-if="v.mantenimiento?.motivo">{{ v.mantenimiento.motivo }} · </template>
                    <template v-if="v.mantenimiento?.presupuestoEstimado != null">{{ soles(v.mantenimiento.presupuestoEstimado) }}</template>
                    <template v-else>Presupuesto sin estimar</template>
                  </div>
                  <div v-if="controlVeh(v).ultimaFecha" class="sg-muted">Último mantenimiento: {{ fecha(controlVeh(v).ultimaFecha) }}</div>
                  <status-chip v-if="controlVeh(v).proxima" v-bind="ESTADOS_CONTROL[controlVeh(v).estado]" :label="`Próximo: ${fecha(controlVeh(v).proxima)}`" />
                </td>
                <td>{{ v.combustible }} · {{ v.unidad === 'L' ? 'litros' : v.unidad }}</td>
                <td>
                  <template v-if="v.rendimientoKmL">{{ v.rendimientoKmL }} km/L</template>
                  <status-chip v-else tono="si" label="No informado" />
                </td>
                <td class="sg-num">{{ itinerariosDeVehiculo(v.id).length }}</td>
                <td class="text-right no-wrap">
                  <q-btn v-if="puedeAcceder('itinerarios') && !v.anulacion" flat dense color="secondary" icon="route" label="Itinerarios" class="gt-xs" :to="{ name: 'itinerarios', query: { vehiculo: v.id } }" />
                  <q-btn v-if="puedeAcceder('combustible') && !v.anulacion" flat dense color="secondary" icon="local_gas_station" label="Combustible" class="gt-xs" :to="{ name: 'combustible', query: { vehiculo: v.id } }" />
                  <menu-acciones :items="accionesVehiculo(v)" :etiqueta="`Acciones del vehículo ${v.id}`" />
                </td>
              </tr>
              <tr v-for="c in centrosSinMovilidad" :key="c.id">
                <td><status-chip tono="si" label="Sin movilidad registrada" /></td>
                <td>{{ c.nombre }}</td>
                <td colspan="6" class="sg-muted">No se ha informado ningún vehículo para este centro.</td>
              </tr>
              <tr v-if="!vehiculosVisibles.length && !centrosSinMovilidad.length"><td colspan="8" class="sg-muted">{{ estadoFiltro === TODOS ? 'Sin vehículos en el ámbito del perfil.' : 'Ningún vehículo tiene el estado seleccionado.' }}</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Móvil y tableta: una tarjeta por vehículo, con sus accesos a la vista. -->
        <div v-else class="column q-gutter-y-md q-px-md q-pb-md">
          <div v-for="v in vehiculosVisibles" :key="v.id" class="sg-box" :class="{ 'sg-box--resaltada': v.id === vehiculoDestacado }">
            <div class="row items-start no-wrap justify-between">
              <div class="column">
                <span class="text-weight-bold">{{ v.tipo }} · {{ v.id }}</span>
                <span class="sg-muted">Placa {{ v.placa }} · {{ carPorId(v.carId).nombre }}</span>
              </div>
              <menu-acciones :items="accionesVehiculo(v)" :etiqueta="`Acciones del vehículo ${v.id}`" />
            </div>
            <div class="sg-chips">
              <status-chip v-if="v.anulacion" v-bind="CHIP_ANULADO" />
              <status-chip v-bind="estadoVehiculo(v.estadoOperativo)" />
              <status-chip v-if="!v.chofer" tono="si" label="Chofer no asignado" />
              <status-chip v-if="!v.rendimientoKmL" tono="si" label="Rendimiento no informado" />
            </div>
            <span v-if="requiereAtencion(v)" class="sg-muted">
              <template v-if="v.mantenimiento?.motivo">{{ v.mantenimiento.motivo }} · </template>
              <template v-if="v.mantenimiento?.presupuestoEstimado != null">{{ soles(v.mantenimiento.presupuestoEstimado) }} estimados</template>
              <template v-else>Presupuesto sin estimar</template>
            </span>
            <span v-if="controlVeh(v).ultimaFecha" class="sg-muted">Último mantenimiento: {{ fecha(controlVeh(v).ultimaFecha) }}</span>
            <div v-if="controlVeh(v).proxima" class="sg-chips"><status-chip v-bind="ESTADOS_CONTROL[controlVeh(v).estado]" :label="`Próximo: ${fecha(controlVeh(v).proxima)}`" /></div>
            <span v-if="v.chofer" class="sg-muted">Chofer: {{ v.chofer }}</span>
            <span class="sg-muted">{{ v.combustible }} · {{ v.unidad === 'L' ? 'litros' : v.unidad }}<template v-if="v.rendimientoKmL"> · {{ v.rendimientoKmL }} km/L</template></span>
            <span class="sg-muted">{{ plural(itinerariosDeVehiculo(v.id).length, 'itinerario', 'itinerarios') }}</span>
            <div v-if="!v.anulacion" class="row q-gutter-sm">
              <q-btn v-if="puedeAcceder('itinerarios')" dense outline no-caps color="secondary" icon="route" label="Itinerarios" :to="{ name: 'itinerarios', query: { vehiculo: v.id } }" />
              <q-btn v-if="puedeAcceder('combustible')" dense outline no-caps color="secondary" icon="local_gas_station" label="Combustible" :to="{ name: 'combustible', query: { vehiculo: v.id } }" />
            </div>
          </div>
          <div v-for="c in centrosSinMovilidad" :key="c.id" class="sg-box sg-box--dashed">
            <status-chip tono="si" label="Sin movilidad registrada" />
            <span class="text-weight-bold">{{ c.nombre }}</span>
            <span class="sg-muted">No se ha informado ningún vehículo para este centro.</span>
          </div>
          <p v-if="!vehiculosVisibles.length && !centrosSinMovilidad.length" class="sg-muted q-mb-none">{{ estadoFiltro === TODOS ? 'Sin vehículos en el ámbito del perfil.' : 'Ningún vehículo tiene el estado seleccionado.' }}</p>
        </div>
      </section-card>

      <note-banner tono="in">
        El rendimiento de referencia es orientativo y solo sirve para estimar el combustible de un recorrido; no es una norma de consumo.
      </note-banner>
    </div>

    <vehiculo-dialog v-model="dialogo.abierto" :vehiculo="dialogo.vehiculo" />
    <mantenimiento-dialog v-if="mantenimiento.centro" v-model="mantenimiento.abierto" :centro="mantenimiento.centro" tipo-inicial="mantenimiento_vehiculo" :vehiculo-id="mantenimiento.vehiculoId" />
    <anular-dialog v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
  </q-page>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import KpiCard from 'components/common/KpiCard.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import RegistroNoDisponible from 'components/common/RegistroNoDisponible.vue'
import MenuAcciones from 'components/common/MenuAcciones.vue'
import FiltroInactivos from 'components/common/FiltroInactivos.vue'
import AnularDialog from 'components/common/AnularDialog.vue'
import VehiculoDialog from 'components/movilidad/VehiculoDialog.vue'
import MantenimientoDialog from 'components/centros/MantenimientoDialog.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useAnulacion } from 'src/composables/useAnulacion'
import { carPorId, itinerarioPorId, vigente } from 'src/services/datos'
import { itinerariosDeVehiculo } from 'src/services/combustible'
import { anular } from 'src/services/acciones'
import { requiereAtencion, resumirEstadoVehiculos } from 'src/services/vehiculos'
import { controlDeVehiculo } from 'src/services/mantenimientos'
import { CHIP_ANULADO, ESTADOS_CONTROL, ESTADOS_VEHICULO, OPCIONES_ESTADO_VEHICULO, TODOS, estadoVehiculo } from 'src/config/catalogos'
import { FECHA_CORTE } from 'src/config/demo'
import { fecha, plural, soles } from 'src/utils/formato'
import { parametro } from 'src/utils/navegacion'

const $q = useQuasar()
const router = useRouter()
const route = useRoute()
const { perfil, carsEnAmbito, vehiculosDelAmbito, puedeAcceder, puedeHacer } = usePerfil()
const { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion } = useAnulacion()

const mostrarInactivos = ref(false)
const vehiculos = computed(() => vehiculosDelAmbito(mostrarInactivos.value))

// Filtro por estado operativo. «sin_informar» agrupa los vehículos sin estado registrado.
const OPCIONES_FILTRO_ESTADO = [
  { label: 'Todos', value: TODOS },
  ...OPCIONES_ESTADO_VEHICULO,
  { label: 'No informado', value: 'sin_informar' }
]
const estadoFiltro = ref(TODOS)
const vehiculosVisibles = computed(() =>
  estadoFiltro.value === TODOS
    ? vehiculos.value
    : vehiculos.value.filter((v) => (estadoFiltro.value === 'sin_informar' ? !ESTADOS_VEHICULO[v.estadoOperativo] : v.estadoOperativo === estadoFiltro.value))
)
// El resumen no depende del filtro de estado: siempre describe todos los vehículos vigentes del ámbito.
const resumen = computed(() => resumirEstadoVehiculos(vehiculos.value))

// Un perfil limitado a ciertos vehículos (chofer) no ve los centros sin movilidad.
const centrosSinMovilidad = computed(() =>
  perfil.value.ambito.vehiculoIds || estadoFiltro.value !== TODOS ? [] : carsEnAmbito.value.filter((c) => !vehiculos.value.some((v) => v.carId === c.id && vigente(v)))
)

// En móvil y tableta las tablas anchas pasan a tarjetas, para no desplazar la página en horizontal.
const compacto = computed(() => $q.screen.lt.md)

// Enlaces profundos (?vehiculo=&itinerario=): se resalta el vehículo y, si se llega desde un recorrido, se abre su ficha para completar
// el rendimiento y se ofrece volver a ese recorrido. Un vehículo fuera del ámbito del perfil no se muestra ni se sustituye por otro.
const vehiculoPedido = parametro(route.query.vehiculo)
const vehiculoSolicitado = computed(() => (vehiculoPedido ? vehiculosDelAmbito(true).find((v) => v.id === vehiculoPedido) ?? null : null))
if (vehiculoSolicitado.value?.anulacion) mostrarInactivos.value = true
const vehiculoNoDisponible = !!vehiculoPedido && !vehiculoSolicitado.value
const vehiculoDestacado = vehiculoSolicitado.value?.id ?? null
const itinerarioOrigen = !vehiculoNoDisponible && vehiculoPedido && parametro(route.query.itinerario) ? itinerarioPorId(parametro(route.query.itinerario)) : null

const dialogo = reactive({ abierto: false, vehiculo: null })

// El control del vehículo combina la ficha y los mantenimientos registrados; el historial completo está en la ficha del centro.
const controlVeh = (v) => controlDeVehiculo(v, FECHA_CORTE)
const mantenimiento = reactive({ abierto: false, centro: null, vehiculoId: null })
function registrarMantenimientoDe (v) {
  Object.assign(mantenimiento, { centro: carPorId(v.carId), vehiculoId: v.id, abierto: true })
}

function abrir (vehiculo) {
  dialogo.vehiculo = vehiculo
  dialogo.abierto = true
}

onMounted(() => {
  if (itinerarioOrigen && vehiculoSolicitado.value && vigente(vehiculoSolicitado.value) && puedeHacer('vehiculo.actualizar')) abrir(vehiculoSolicitado.value)
})

const accionesVehiculo = (v) => [
  // En móvil los accesos a Itinerarios y Combustible (botones ocultos) se ofrecen en el menú.
  { label: 'Ver itinerarios', icono: 'route', visible: !compacto.value && $q.screen.lt.sm && puedeAcceder('itinerarios') && !v.anulacion, accion: () => router.push({ name: 'itinerarios', query: { vehiculo: v.id } }) },
  { label: 'Ver combustible', icono: 'local_gas_station', visible: !compacto.value && $q.screen.lt.sm && puedeAcceder('combustible') && !v.anulacion, accion: () => router.push({ name: 'combustible', query: { vehiculo: v.id } }) },
  { label: 'Actualizar vehículo', icono: 'edit', visible: puedeHacer('vehiculo.actualizar') && vigente(v), accion: () => abrir(v) },
  { label: 'Registrar mantenimiento', icono: 'build', visible: puedeHacer('mantenimiento.registrar') && vigente(v), accion: () => registrarMantenimientoDe(v) },
  {
    label: 'Anular vehículo',
    icono: 'block',
    peligro: true,
    visible: puedeHacer('vehiculo.anular') && vigente(v),
    accion: () => pedirAnulacion({
      titulo: 'Anular vehículo',
      subtitulo: `${v.tipo} · ${v.id} · placa ${v.placa}`,
      aviso: 'Sus itinerarios y registros de combustible se conservan como antecedente, pero dejan de contar mientras el vehículo esté anulado.',
      mensaje: 'Vehículo anulado.',
      ejecutar: (datos) => anular(v, datos)
    })
  },
  {
    label: 'Reactivar vehículo',
    icono: 'restore',
    visible: puedeHacer('vehiculo.anular') && !vigente(v),
    accion: () => pedirReactivacion({ entidad: 'vehiculo', registro: v, nombre: 'Vehículo' })
  }
]
</script>
