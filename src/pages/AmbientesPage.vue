<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #acciones>
          <q-btn unelevated color="primary" icon="add_alert" label="Registrar novedad" :disable="!ambiente" @click="abrirNovedad" />
        </template>
      </page-header>

      <div class="sg-filters">
        <q-select v-model="carId" :options="opcionesCar" emit-value map-options outlined dense label="Establecimiento (CAR)" />
      </div>

      <section-card titulo="Ambientes del local" :subtitulo="subtitulo" sin-relleno>
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
              </tr>
            </thead>
            <tbody>
              <tr v-for="amb in ambientes" :key="amb.id" :class="{ 'sg-row--selected': amb.id === ambienteId }">
                <td>
                  <button type="button" class="sg-row-btn" @click="ambienteId = amb.id">{{ amb.nombre }}</button>
                  <div class="sg-muted">Piso {{ amb.piso }}</div>
                </td>
                <td>{{ amb.areaM2 }} m², {{ plural(amb.ventanas, 'ventana', 'ventanas') }}, {{ plural(amb.puertas, 'puerta', 'puertas') }}</td>
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
                  <router-link :to="{ name: 'bienes', query: { car: carId } }">{{ activos(amb) }}</router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section-card>

      <section-card v-if="ambiente" :titulo="`${ambiente.nombre} · novedades y antecedentes`" :subtitulo="textoUbicacion(ubicacionDeAmbiente(ambiente.id))">
        <div class="sg-grid-2">
          <div class="column q-gutter-y-sm">
            <h3 class="sg-kv__label q-my-none">Novedades</h3>
            <div v-for="n in ambiente.novedades" :key="n.id" class="sg-box">
              <div class="sg-chips items-center">
                <status-chip :tono="n.atendida ? 'ok' : 'da'" :label="n.atendida ? 'Atendida' : 'Abierta'" />
                <span class="text-weight-bold">{{ n.titulo }}</span>
              </div>
              <span>{{ n.detalle }} Ubicación: {{ n.ubicacion }}.</span>
              <span class="sg-muted">Informada el {{ fecha(n.fecha) }} por {{ n.informadoPor }}</span>
              <div v-if="n.requiereEvaluacion" class="sg-chips">
                <status-chip tono="in" label="Necesidad de infraestructura: requiere evaluación" />
                <status-chip tono="si" label="Costo no estimado" />
              </div>
            </div>
            <p v-if="!ambiente.novedades.length" class="sg-muted">Sin novedades registradas.</p>
          </div>
          <div class="column q-gutter-y-sm">
            <h3 class="sg-kv__label q-my-none">Antecedentes de intervenciones</h3>
            <div v-for="(i, idx) in ambiente.intervenciones" :key="idx" class="sg-box row items-center justify-between">
              <span>{{ i.descripcion }}</span>
              <span v-if="i.fecha" class="text-weight-bold">{{ fecha(i.fecha) }}</span>
              <status-chip v-else tono="si" label="Fecha no informada" />
            </div>
            <p v-if="!ambiente.intervenciones.length" class="sg-muted">Sin antecedentes de intervenciones.</p>
          </div>
        </div>
      </section-card>
    </div>

    <q-dialog v-model="novedad.abierta">
      <q-card style="width: 560px; max-width: 92vw">
        <q-card-section>
          <h2 class="text-h6 text-weight-bold q-my-none">Registrar novedad</h2>
          <p class="sg-muted q-mb-none">{{ ambiente?.nombre }}</p>
        </q-card-section>
        <q-card-section>
          <q-form class="column q-gutter-y-md" @submit="guardarNovedad">
            <q-input v-model="novedad.titulo" outlined dense label="Novedad *" :rules="[(v) => !!v || 'Indique la novedad']" />
            <q-input v-model="novedad.detalle" outlined dense type="textarea" autogrow label="Detalle" />
            <q-input v-model="novedad.ubicacion" outlined dense label="Ubicación dentro del ambiente" />
            <q-checkbox v-model="novedad.requiereEvaluacion" label="Requiere evaluación de infraestructura" />
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
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { ambientePorId, ambientesDeCar, bienesDeAmbiente, localesDeCar, textoUbicacion, ubicacionDeAmbiente } from 'src/services/datos'
import { registrarNovedad } from 'src/services/acciones'
import { condicion } from 'src/config/catalogos'
import { fecha, plural } from 'src/utils/formato'

const $q = useQuasar()
const route = useRoute()
const { carsEnAmbito, enAmbitoCar } = usePerfil()

const opcionesCar = computed(() => carsEnAmbito.value.map((c) => ({ label: c.nombre, value: c.id })))
const carId = ref(enAmbitoCar(route.query.car) ? route.query.car : carsEnAmbito.value[0]?.id)
const ambientes = computed(() => (carId.value ? ambientesDeCar(carId.value) : []))
const ambienteId = ref(ambientes.value[0]?.id ?? null)
const ambiente = computed(() => (ambienteId.value ? ambientePorId(ambienteId.value) : null))

watch(carsEnAmbito, (cars) => {
  if (!cars.some((c) => c.id === carId.value)) carId.value = cars[0]?.id
})
watch(carId, () => {
  ambienteId.value = ambientes.value[0]?.id ?? null
})

const subtitulo = computed(() => {
  const local = carId.value ? localesDeCar(carId.value)[0] : null
  return local ? `${local.id} · ${local.nombre}` : ''
})

const abiertas = (amb) => amb.novedades.filter((n) => !n.atendida)
const activos = (amb) => bienesDeAmbiente(amb.id).filter((b) => b.situacion === 'activo').length

const novedad = reactive({ abierta: false, titulo: '', detalle: '', ubicacion: '', requiereEvaluacion: false })

function abrirNovedad () {
  Object.assign(novedad, { abierta: true, titulo: '', detalle: '', ubicacion: '', requiereEvaluacion: false })
}

function guardarNovedad () {
  registrarNovedad(ambiente.value, {
    tipo: 'dano',
    titulo: novedad.titulo,
    detalle: novedad.detalle,
    ubicacion: novedad.ubicacion || 'No informada',
    requiereEvaluacion: novedad.requiereEvaluacion
  })
  novedad.abierta = false
  $q.notify({ type: 'positive', message: 'Novedad registrada.' })
}
</script>
