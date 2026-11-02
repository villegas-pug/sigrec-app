<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #acciones>
          <q-btn outline color="secondary" icon="route" label="Itinerarios" :to="{ name: 'movilidad', query: vehiculoId ? { vehiculo: vehiculoId } : {} }" />
          <q-btn v-if="puedeHacer('combustible.informar')" unelevated color="primary" icon="local_gas_station" label="Informar combustible" :disable="!vehiculo" @click="abrir" />
        </template>
      </page-header>

      <vehiculo-selector v-model="vehiculoId" :vehiculos="vehiculosEnAmbito" />

      <template v-if="vehiculo">
        <div class="sg-kpi-panel">
          <kpi-card icono="local_gas_station" tono="azul" :valor="litros(sumar('carga'))" etiqueta="Cargado al vehículo" nota="Combustible ingresado al tanque; no equivale a consumo" />
          <kpi-card icono="speed" tono="ambar" :valor="litros(sumar('consumo'))" etiqueta="Consumo declarado en recorridos" nota="Cada recorrido se cuenta una sola vez" />
          <kpi-card icono="rule" tono="verde" :valor="`${comparables.length} de ${conConsumo.length}`" etiqueta="Recorridos comparables" nota="Con distancia, rendimiento y consumo declarado" />
        </div>

        <note-banner tono="ne" icono="straighten">
          Todas las cantidades se expresan en litros. Cargas y consumos se muestran por separado y no se restan entre sí sin una regla acordada.
        </note-banner>

        <section-card titulo="Registros de combustible" sin-relleno>
          <div class="sg-table-wrap">
            <table class="sg-table">
              <thead>
                <tr><th scope="col">Fecha</th><th scope="col">Significado</th><th scope="col" class="sg-num">Cantidad</th><th scope="col">Relacionado con</th><th scope="col">Sustento</th></tr>
              </thead>
              <tbody>
                <tr v-for="r in registros" :key="r.id">
                  <td>{{ fecha(r.fecha) }}</td>
                  <td><status-chip :tono="r.tipo === 'carga' ? 'in' : 'ne'" :label="r.tipo === 'carga' ? 'Carga al vehículo' : 'Consumo declarado'" /></td>
                  <td class="sg-num">{{ litros(r.cantidad) }}</td>
                  <td>
                    <template v-if="r.itinerarioId">
                      {{ r.itinerarioId }}
                      <span v-if="itinerarioPorId(r.itinerarioId)?.realizado?.km != null" class="sg-muted"> · {{ itinerarioPorId(r.itinerarioId).realizado.km }} km</span>
                      <span v-else class="text-weight-bold" style="color: var(--sg-warning)"> · sin distancia</span>
                    </template>
                    <span v-else class="sg-muted">{{ vehiculo.id }} · sin recorrido asociado</span>
                  </td>
                  <td>{{ r.sustento || '—' }}</td>
                </tr>
                <tr v-if="!registros.length"><td colspan="5" class="sg-muted">Sin registros de combustible.</td></tr>
              </tbody>
            </table>
          </div>
        </section-card>

        <section-card titulo="Comparación por recorrido" subtitulo="Estimación = distancia realizada ÷ rendimiento de referencia (orientativo)" sin-relleno>
          <div class="sg-table-wrap">
            <table class="sg-table">
              <thead>
                <tr><th scope="col">Recorrido</th><th scope="col" class="sg-num">Consumo declarado</th><th scope="col" class="sg-num">Estimado</th><th scope="col" class="sg-num">Diferencia</th><th scope="col">Lectura</th></tr>
              </thead>
              <tbody>
                <tr v-for="{ it, ev } in conConsumo" :key="it.id">
                  <td>{{ it.id }}<div class="sg-muted">{{ fecha(it.fecha) }} · {{ it.proposito }}</div></td>
                  <td class="sg-num">{{ litros(ev.consumo) }}</td>
                  <td class="sg-num">{{ ev.estimadoL != null ? litros(ev.estimadoL) : '—' }}</td>
                  <td class="sg-num">{{ ev.diferenciaL != null ? litros(ev.diferenciaL) : '—' }}</td>
                  <td>
                    <span v-if="ev.estado === 'comparable'">{{ ev.kmRealizados }} km ÷ {{ ev.rendimiento }} km/L = {{ litros(ev.estimadoL) }}.</span>
                    <span v-else>No comparable: falta {{ ev.faltantes.join(' y ') }}. No se concluye sobreconsumo ni irregularidad.</span>
                  </td>
                </tr>
                <tr v-if="!conConsumo.length"><td colspan="5" class="sg-muted">Sin consumos declarados.</td></tr>
              </tbody>
            </table>
          </div>
        </section-card>
      </template>
    </div>

    <q-dialog v-model="dialogo.abierto">
      <q-card style="width: 520px; max-width: 92vw">
        <q-card-section>
          <h2 class="text-h6 text-weight-bold q-my-none">Informar combustible</h2>
          <p class="sg-muted q-mb-none">{{ vehiculo?.id }} · {{ vehiculo?.combustible }}</p>
        </q-card-section>
        <q-card-section>
          <q-form class="column q-gutter-y-md" @submit="guardar">
            <q-option-group v-model="dialogo.tipo" inline :options="[{ label: 'Carga al vehículo', value: 'carga' }, { label: 'Consumo declarado en un recorrido', value: 'consumo' }]" />
            <div class="row q-col-gutter-md">
              <q-input v-model="dialogo.fecha" class="col-12 col-sm-6" outlined dense type="date" stack-label label="Fecha *" :rules="[(v) => !!v || 'Campo obligatorio']" />
              <q-input v-model.number="dialogo.cantidad" class="col-12 col-sm-6" outlined dense type="number" min="0" step="0.1" label="Cantidad *" suffix="L" :rules="[(v) => Number.isFinite(v) && v > 0 || 'Indique una cantidad mayor que cero']" />
            </div>
            <q-select
              v-if="dialogo.tipo === 'consumo'"
              v-model="dialogo.itinerarioId"
              :options="opcionesItinerario"
              emit-value
              map-options
              outlined
              dense
              label="Recorrido *"
              hint="Solo recorridos realizados sin consumo declarado, para no contarlos dos veces"
              :rules="[(v) => !!v || 'Seleccione el recorrido']"
            />
            <q-input v-model="dialogo.sustento" outlined dense label="Sustento (vale, declaración…)" />
            <div class="row justify-end q-gutter-sm">
              <q-btn flat color="secondary" label="Cancelar" v-close-popup />
              <q-btn unelevated color="primary" type="submit" label="Registrar" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { usePerfil } from 'src/composables/usePerfil'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import KpiCard from 'components/common/KpiCard.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import VehiculoSelector from 'components/movilidad/VehiculoSelector.vue'
import { useVehiculoSeleccionado } from 'src/composables/useVehiculoSeleccionado'
import { itinerarioPorId, vehiculoPorId } from 'src/services/datos'
import { evaluarItinerario, itinerariosDeVehiculo, registrosDeVehiculo } from 'src/services/combustible'
import { registrarCombustible } from 'src/services/acciones'
import { FECHA_CORTE } from 'src/config/demo'
import { fecha, litros } from 'src/utils/formato'

const $q = useQuasar()
const route = useRoute()
const { puedeHacer } = usePerfil()
const { vehiculoId, vehiculosEnAmbito } = useVehiculoSeleccionado(route.query.vehiculo)
const vehiculo = computed(() => (vehiculoId.value ? vehiculoPorId(vehiculoId.value) : null))

const registros = computed(() => (vehiculo.value ? registrosDeVehiculo(vehiculo.value.id) : []))
const sumar = (tipo) => registros.value.filter((r) => r.tipo === tipo).reduce((s, r) => s + r.cantidad, 0)

const evaluados = computed(() =>
  vehiculo.value ? itinerariosDeVehiculo(vehiculo.value.id).map((it) => ({ it, ev: evaluarItinerario(it, vehiculo.value) })) : []
)
const conConsumo = computed(() => evaluados.value.filter((e) => e.it.consumoDeclaradoL != null))
const comparables = computed(() => conConsumo.value.filter((e) => e.ev.estado === 'comparable'))

const opcionesItinerario = computed(() =>
  evaluados.value
    .filter(({ it }) => it.realizado && it.consumoDeclaradoL == null)
    .map(({ it }) => ({ label: `${it.id} · ${fecha(it.fecha)} · ${it.proposito}`, value: it.id }))
)

const dialogo = reactive({ abierto: false, tipo: 'carga', fecha: FECHA_CORTE, cantidad: null, itinerarioId: null, sustento: '' })

function abrir () {
  Object.assign(dialogo, { abierto: true, tipo: 'carga', fecha: FECHA_CORTE, cantidad: null, itinerarioId: null, sustento: '' })
}

function guardar () {
  registrarCombustible({
    vehiculoId: vehiculo.value.id,
    fecha: dialogo.fecha,
    tipo: dialogo.tipo,
    cantidad: dialogo.cantidad,
    itinerarioId: dialogo.tipo === 'consumo' ? dialogo.itinerarioId : null,
    sustento: dialogo.sustento || null
  })
  dialogo.abierto = false
  $q.notify({ type: 'positive', message: dialogo.tipo === 'carga' ? 'Carga registrada.' : 'Consumo declarado registrado.' })
}
</script>
