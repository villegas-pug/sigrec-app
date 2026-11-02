<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #acciones>
          <q-btn v-if="puedeHacer('vehiculo.registrar')" unelevated color="primary" icon="add" label="Registrar vehículo" @click="abrir(null)" />
        </template>
      </page-header>

      <section-card titulo="Movilidad por centro" :subtitulo="`${plural(vehiculosEnAmbito.length, 'vehículo', 'vehículos')} · ${perfil.ambito.descripcion}`" sin-relleno>
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
              <tr v-for="v in vehiculosEnAmbito" :key="v.id">
                <td><span class="text-weight-bold">{{ v.tipo }} · {{ v.id }}</span><div class="sg-muted">Placa {{ v.placa }}</div></td>
                <td>{{ carPorId(v.carId).nombre }}</td>
                <td>
                  <template v-if="v.chofer">{{ v.chofer }}</template>
                  <status-chip v-else tono="si" label="No asignado" />
                </td>
                <td>{{ v.combustible }} · litros</td>
                <td>
                  <template v-if="v.rendimientoKmL">{{ v.rendimientoKmL }} km/L</template>
                  <status-chip v-else tono="si" label="No informado" />
                </td>
                <td class="sg-num">{{ itinerariosDeVehiculo(v.id).length }}</td>
                <td class="text-right no-wrap">
                  <q-btn v-if="puedeAcceder('movilidad')" flat dense color="secondary" icon="route" label="Itinerarios" :to="{ name: 'movilidad', query: { vehiculo: v.id } }" />
                  <q-btn v-if="puedeAcceder('combustible')" flat dense color="secondary" icon="local_gas_station" label="Combustible" :to="{ name: 'combustible', query: { vehiculo: v.id } }" />
                  <q-btn v-if="puedeHacer('vehiculo.actualizar')" flat dense color="secondary" icon="edit" label="Actualizar" @click="abrir(v)" />
                </td>
              </tr>
              <tr v-for="c in centrosSinMovilidad" :key="c.id">
                <td><status-chip tono="si" label="Sin movilidad registrada" /></td>
                <td>{{ c.nombre }}</td>
                <td colspan="5" class="sg-muted">No se ha informado ningún vehículo para este centro.</td>
              </tr>
              <tr v-if="!vehiculosEnAmbito.length && !centrosSinMovilidad.length"><td colspan="7" class="sg-muted">Sin vehículos en el ámbito del perfil.</td></tr>
            </tbody>
          </table>
        </div>
      </section-card>

      <note-banner tono="in">
        El rendimiento de referencia es orientativo y solo sirve para estimar el combustible de un recorrido; no es una norma de consumo.
      </note-banner>
    </div>

    <vehiculo-dialog v-model="dialogo.abierto" :vehiculo="dialogo.vehiculo" />
  </q-page>
</template>

<script setup>
import { computed, reactive } from 'vue'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import VehiculoDialog from 'components/movilidad/VehiculoDialog.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { carPorId } from 'src/services/datos'
import { itinerariosDeVehiculo } from 'src/services/combustible'
import { plural } from 'src/utils/formato'

const { perfil, carsEnAmbito, vehiculosEnAmbito, puedeAcceder, puedeHacer } = usePerfil()

// Un perfil limitado a ciertos vehículos (chofer) no ve los centros sin movilidad.
const centrosSinMovilidad = computed(() =>
  perfil.value.ambito.vehiculoIds ? [] : carsEnAmbito.value.filter((c) => !vehiculosEnAmbito.value.some((v) => v.carId === c.id))
)

const dialogo = reactive({ abierto: false, vehiculo: null })

function abrir (vehiculo) {
  dialogo.vehiculo = vehiculo
  dialogo.abierto = true
}
</script>
