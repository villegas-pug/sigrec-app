<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #acciones>
          <q-btn outline color="secondary" icon="local_gas_station" label="Combustible" :to="{ name: 'combustible' }" />
          <q-btn unelevated color="primary" icon="add_road" label="Registrar itinerario" :disable="!vehiculo" @click="abrirItinerario" />
        </template>
      </page-header>

      <vehiculo-selector v-model="vehiculoId" :vehiculos="vehiculosEnAmbito" />

      <section-card v-if="vehiculo" titulo="Itinerarios" subtitulo="Previsto y realizado se muestran por separado cuando ambos se informan" sin-relleno>
        <div class="sg-table-wrap">
          <table class="sg-table">
            <thead>
              <tr>
                <th scope="col">Itinerario</th>
                <th scope="col">Propósito y destinos</th>
                <th scope="col">Previsto</th>
                <th scope="col">Realizado</th>
                <th scope="col" class="sg-num">Consumo declarado</th>
                <th scope="col">Estimación</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="fila in filas" :key="fila.it.id" :class="{ 'sg-row--selected': fila.it.id === itinerarioId }">
                <td><button type="button" class="sg-row-btn" @click="itinerarioId = fila.it.id">{{ fila.it.id }}</button><div class="sg-muted">{{ fecha(fila.it.fecha) }}</div></td>
                <td>{{ fila.it.proposito }}<div class="sg-muted">{{ fila.it.destinos.join(' → ') }}</div></td>
                <td>
                  <template v-if="fila.it.previsto">{{ tramo(fila.it.previsto) }}</template>
                  <status-chip v-else tono="si" label="No programado" />
                </td>
                <td>
                  <template v-if="fila.it.realizado">
                    {{ fila.it.realizado.salida }}–{{ fila.it.realizado.llegada }}
                    <div v-if="fila.it.realizado.km != null" class="sg-muted">{{ fila.it.realizado.km }} km</div>
                    <div v-else class="text-weight-bold" style="color: var(--sg-warning)">Distancia no informada</div>
                  </template>
                  <status-chip v-else tono="si" label="No informado" />
                </td>
                <td class="sg-num">
                  <template v-if="fila.it.consumoDeclaradoL != null">{{ litros(fila.it.consumoDeclaradoL) }}</template>
                  <status-chip v-else tono="si" label="No informado" />
                </td>
                <td><status-chip v-bind="etiquetaEvaluacion(fila.ev)" /></td>
              </tr>
              <tr v-if="!filas.length"><td colspan="6" class="sg-muted">Sin itinerarios registrados.</td></tr>
            </tbody>
          </table>
        </div>
      </section-card>

      <section-card v-if="seleccion" :titulo="`Estimación explicada · ${seleccion.it.id}`" :subtitulo="seleccion.it.proposito">
        <template v-if="!seleccion.it.realizado" #acciones>
          <q-btn unelevated color="primary" icon="flag" label="Informar ejecución" @click="abrirEjecucion" />
        </template>

        <template v-if="seleccion.ev.estado === 'comparable'">
          <div class="sg-calc" role="group" :aria-label="`${seleccion.ev.kmRealizados} km entre ${seleccion.ev.rendimiento} km por litro da ${litros(seleccion.ev.estimadoL)} estimados`">
            <div class="sg-calc__term"><span class="sg-kv__label">Distancia realizada</span><b>{{ seleccion.ev.kmRealizados }} km</b></div>
            <span class="sg-calc__op" aria-hidden="true">÷</span>
            <div class="sg-calc__term"><span class="sg-kv__label">Referencia</span><b>{{ seleccion.ev.rendimiento }} km/L</b></div>
            <span class="sg-calc__op" aria-hidden="true">=</span>
            <div class="sg-calc__term" style="border-color: var(--sg-blue)"><span class="sg-kv__label">Estimado</span><b>{{ litros(seleccion.ev.estimadoL) }}</b></div>
          </div>
          <p class="q-mt-md">
            Consumo declarado: <strong>{{ litros(seleccion.ev.consumo) }}</strong> ·
            <status-chip :tono="Math.abs(seleccion.ev.diferenciaL) < 0.05 ? 'ok' : 'in'" :label="`Diferencia: ${litros(seleccion.ev.diferenciaL)}`" />
          </p>
          <note-banner tono="in">
            La referencia es orientativa. Las cargas al vehículo son combustible ingresado al tanque y no se comparan con un recorrido.
          </note-banner>
        </template>

        <template v-else>
          <p v-if="seleccion.ev.estado === 'solo_previsto' && seleccion.ev.estimadoPrevistoL != null">
            Estimación del recorrido previsto: <strong>{{ litros(seleccion.ev.estimadoPrevistoL) }}</strong> ({{ seleccion.it.previsto.km }} km ÷ {{ seleccion.ev.rendimiento }} km/L). Se comparará cuando se informe la ejecución.
          </p>
          <p>Información faltante para comparar:</p>
          <ul class="q-mt-none">
            <li v-for="f in seleccion.ev.faltantes" :key="f">{{ f }}</li>
          </ul>
          <note-banner tono="ne" icono="help">
            Sin esta información no se puede estimar el combustible del recorrido. No se concluye sobreconsumo ni irregularidad.
          </note-banner>
        </template>
      </section-card>
    </div>

    <q-dialog v-model="dialogo.abierto">
      <q-card style="width: 600px; max-width: 94vw">
        <q-card-section>
          <h2 class="text-h6 text-weight-bold q-my-none">{{ dialogo.modo === 'nuevo' ? 'Registrar itinerario' : 'Informar ejecución' }}</h2>
          <p class="sg-muted q-mb-none">{{ vehiculo?.id }} · {{ vehiculo?.chofer }}</p>
        </q-card-section>
        <q-card-section>
          <q-form class="column q-gutter-y-md" @submit="guardar">
            <template v-if="dialogo.modo === 'nuevo'">
              <div class="row q-col-gutter-md">
                <q-input v-model="dialogo.fecha" class="col-12 col-sm-4" outlined dense type="date" stack-label label="Fecha *" :rules="[requerido]" />
                <q-input v-model="dialogo.proposito" class="col-12 col-sm-8" outlined dense label="Propósito *" :rules="[requerido]" />
              </div>
              <q-input v-model="dialogo.destinos" outlined dense label="Destinos, separados por comas *" hint="Ej.: CAR, Centro de salud, CAR" :rules="[requerido]" />
              <div class="sg-kv__label">Previsto</div>
              <div class="row q-col-gutter-md">
                <q-input v-model="dialogo.previsto.salida" class="col-4" outlined dense type="time" stack-label label="Salida" />
                <q-input v-model="dialogo.previsto.llegada" class="col-4" outlined dense type="time" stack-label label="Llegada" />
                <q-input v-model.number="dialogo.previsto.km" class="col-4" outlined dense type="number" min="0" label="Distancia (km)" />
              </div>
              <q-checkbox v-model="dialogo.conRealizado" label="El recorrido ya se realizó" />
            </template>
            <template v-if="dialogo.modo === 'ejecucion' || dialogo.conRealizado">
              <div class="sg-kv__label">Realizado</div>
              <div class="row q-col-gutter-md">
                <q-input v-model="dialogo.realizado.salida" class="col-4" outlined dense type="time" stack-label label="Salida" />
                <q-input v-model="dialogo.realizado.llegada" class="col-4" outlined dense type="time" stack-label label="Llegada" />
                <q-input v-model.number="dialogo.realizado.km" class="col-4" outlined dense type="number" min="0" label="Distancia (km)" hint="Vacío si no se conoce" />
              </div>
            </template>
            <div class="row justify-end q-gutter-sm">
              <q-btn flat color="secondary" label="Cancelar" v-close-popup />
              <q-btn unelevated color="primary" type="submit" label="Guardar" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import VehiculoSelector from 'components/movilidad/VehiculoSelector.vue'
import { useVehiculoSeleccionado } from 'src/composables/useVehiculoSeleccionado'
import { vehiculoPorId } from 'src/services/datos'
import { evaluarItinerario, itinerariosDeVehiculo } from 'src/services/combustible'
import { informarEjecucion, numeroONulo, registrarItinerario } from 'src/services/acciones'
import { EVALUACIONES_COMBUSTIBLE } from 'src/config/catalogos'
import { FECHA_CORTE } from 'src/config/demo'
import { fecha, litros } from 'src/utils/formato'

const $q = useQuasar()
const { vehiculoId, vehiculosEnAmbito } = useVehiculoSeleccionado()
const vehiculo = computed(() => (vehiculoId.value ? vehiculoPorId(vehiculoId.value) : null))

const requerido = (v) => !!v || 'Campo obligatorio'

const filas = computed(() =>
  vehiculo.value ? itinerariosDeVehiculo(vehiculo.value.id).map((it) => ({ it, ev: evaluarItinerario(it, vehiculo.value) })) : []
)

const itinerarioId = ref(null)
watch(filas, (lista) => {
  if (!lista.some((f) => f.it.id === itinerarioId.value)) itinerarioId.value = lista[0]?.it.id ?? null
}, { immediate: true })
const seleccion = computed(() => filas.value.find((f) => f.it.id === itinerarioId.value) ?? null)

const tramo = (t) => `${t.salida ?? '—'}–${t.llegada ?? '—'}${t.km != null ? ` · ${t.km} km` : ''}`

function etiquetaEvaluacion (ev) {
  const base = EVALUACIONES_COMBUSTIBLE[ev.estado]
  if (ev.estado === 'comparable') return { ...base, label: `${base.label} · ${litros(ev.estimadoL)} estimados` }
  if (ev.estado === 'solo_previsto') return { ...base, label: ev.estimadoPrevistoL != null ? `${base.label} · ${litros(ev.estimadoPrevistoL)}` : base.label }
  return { ...base, label: `${base.label} · falta ${ev.faltantes[0]}` }
}

const dialogo = reactive({
  abierto: false,
  modo: 'nuevo',
  fecha: FECHA_CORTE,
  proposito: '',
  destinos: '',
  previsto: { salida: '', llegada: '', km: null },
  conRealizado: false,
  realizado: { salida: '', llegada: '', km: null }
})

function abrirItinerario () {
  Object.assign(dialogo, {
    abierto: true,
    modo: 'nuevo',
    fecha: FECHA_CORTE,
    proposito: '',
    destinos: '',
    previsto: { salida: '', llegada: '', km: null },
    conRealizado: false,
    realizado: { salida: '', llegada: '', km: null }
  })
}

function abrirEjecucion () {
  const previsto = seleccion.value.it.previsto
  Object.assign(dialogo, {
    abierto: true,
    modo: 'ejecucion',
    realizado: { salida: previsto?.salida ?? '', llegada: previsto?.llegada ?? '', km: null }
  })
}

function guardar () {
  if (dialogo.modo === 'ejecucion') {
    informarEjecucion(seleccion.value.it, dialogo.realizado)
    $q.notify({ type: 'positive', message: 'Ejecución del recorrido registrada.' })
  } else {
    const { previsto, realizado } = dialogo
    const tienePrevisto = previsto.salida || previsto.llegada || Number.isFinite(previsto.km)
    const nuevo = registrarItinerario({
      vehiculoId: vehiculo.value.id,
      fecha: dialogo.fecha,
      proposito: dialogo.proposito,
      destinos: dialogo.destinos.split(',').map((d) => d.trim()).filter(Boolean),
      previsto: tienePrevisto ? { salida: previsto.salida || null, llegada: previsto.llegada || null, km: numeroONulo(previsto.km) } : null,
      realizado: dialogo.conRealizado ? { salida: realizado.salida || null, llegada: realizado.llegada || null, km: numeroONulo(realizado.km) } : null
    })
    itinerarioId.value = nuevo.id
    $q.notify({ type: 'positive', message: `Itinerario ${nuevo.id} registrado.` })
  }
  dialogo.abierto = false
}
</script>
