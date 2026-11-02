<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #acciones>
          <q-btn v-if="puedeHacer('vehiculo.registrar')" unelevated color="primary" icon="add" label="Registrar vehículo" :disable="!carsEnAmbito.length" @click="abrir(null)" />
        </template>
      </page-header>

      <section-card titulo="Movilidad por centro" :subtitulo="`${plural(vehiculos.length, 'vehículo', 'vehículos')} · ${perfil.ambito.descripcion}`" sin-relleno>
        <template #acciones>
          <filtro-inactivos v-model="mostrarInactivos" />
        </template>
        <div class="sg-table-wrap">
          <table class="sg-table">
            <thead>
              <tr>
                <th scope="col">Vehículo</th>
                <th scope="col">Centro</th>
                <th scope="col">Chofer relacionado</th>
                <th scope="col">Combustible</th>
                <th scope="col">Rendimiento de referencia</th>
                <th scope="col" class="sg-num">Itinerarios</th>
                <th scope="col"><span class="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in vehiculos" :key="v.id">
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
                <td colspan="5" class="sg-muted">No se ha informado ningún vehículo para este centro.</td>
              </tr>
              <tr v-if="!vehiculos.length && !centrosSinMovilidad.length"><td colspan="7" class="sg-muted">Sin vehículos en el ámbito del perfil.</td></tr>
            </tbody>
          </table>
        </div>
      </section-card>

      <note-banner tono="in">
        El rendimiento de referencia es orientativo y solo sirve para estimar el combustible de un recorrido; no es una norma de consumo.
      </note-banner>
    </div>

    <vehiculo-dialog v-model="dialogo.abierto" :vehiculo="dialogo.vehiculo" />
    <anular-dialog v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
  </q-page>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import MenuAcciones from 'components/common/MenuAcciones.vue'
import FiltroInactivos from 'components/common/FiltroInactivos.vue'
import AnularDialog from 'components/common/AnularDialog.vue'
import VehiculoDialog from 'components/movilidad/VehiculoDialog.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useAnulacion } from 'src/composables/useAnulacion'
import { carPorId, vigente } from 'src/services/datos'
import { itinerariosDeVehiculo } from 'src/services/combustible'
import { anular } from 'src/services/acciones'
import { CHIP_ANULADO } from 'src/config/catalogos'
import { plural } from 'src/utils/formato'

const $q = useQuasar()
const router = useRouter()
const { perfil, carsEnAmbito, vehiculosDelAmbito, puedeAcceder, puedeHacer } = usePerfil()
const { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion } = useAnulacion()

const mostrarInactivos = ref(false)
const vehiculos = computed(() => vehiculosDelAmbito(mostrarInactivos.value))

// Un perfil limitado a ciertos vehículos (chofer) no ve los centros sin movilidad.
const centrosSinMovilidad = computed(() =>
  perfil.value.ambito.vehiculoIds ? [] : carsEnAmbito.value.filter((c) => !vehiculos.value.some((v) => v.carId === c.id && vigente(v)))
)

const dialogo = reactive({ abierto: false, vehiculo: null })

function abrir (vehiculo) {
  dialogo.vehiculo = vehiculo
  dialogo.abierto = true
}

const accionesVehiculo = (v) => [
  // En móvil los accesos a Itinerarios y Combustible (botones ocultos) se ofrecen en el menú.
  { label: 'Ver itinerarios', icono: 'route', visible: $q.screen.lt.sm && puedeAcceder('itinerarios') && !v.anulacion, accion: () => router.push({ name: 'itinerarios', query: { vehiculo: v.id } }) },
  { label: 'Ver combustible', icono: 'local_gas_station', visible: $q.screen.lt.sm && puedeAcceder('combustible') && !v.anulacion, accion: () => router.push({ name: 'combustible', query: { vehiculo: v.id } }) },
  { label: 'Actualizar vehículo', icono: 'edit', visible: puedeHacer('vehiculo.actualizar') && vigente(v), accion: () => abrir(v) },
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
