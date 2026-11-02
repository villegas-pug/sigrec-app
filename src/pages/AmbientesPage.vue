<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #acciones>
          <q-btn v-if="puedeHacer('ambiente.registrar')" outline color="secondary" icon="add_home" label="Registrar ambiente" :disable="!local" @click="abrirAmbiente(null)" />
          <q-btn v-if="puedeHacer('ambiente.novedad')" unelevated color="primary" icon="add_alert" label="Registrar novedad" :disable="!ambiente" @click="abrirNovedad" />
        </template>
      </page-header>

      <div class="sg-filters">
        <q-select v-model="carId" :options="opcionesCar" emit-value map-options outlined dense label="Centro" />
      </div>

      <section-card titulo="Ambientes del centro" :subtitulo="subtitulo" sin-relleno>
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
                  <div class="sg-muted">Piso {{ amb.piso ?? '—' }}</div>
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
              </tr>
              <tr v-if="!ambientes.length"><td colspan="6" class="sg-muted">El centro aún no tiene ambientes registrados.</td></tr>
            </tbody>
          </table>
        </div>
      </section-card>

      <section-card v-if="ambiente" :titulo="`${ambiente.nombre} · novedades y antecedentes`" :subtitulo="textoUbicacion(ubicacionDeAmbiente(ambiente.id))">
        <template #acciones>
          <q-btn v-if="puedeHacer('ambiente.actualizar')" outline color="secondary" icon="edit" label="Actualizar ambiente" @click="abrirAmbiente(ambiente)" />
          <q-btn v-if="puedeHacer('ambiente.intervencion')" outline color="secondary" icon="format_paint" label="Registrar intervención" @click="abrirIntervencion" />
        </template>
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
              <span v-if="n.atencion" class="sg-muted">Atendida el {{ fecha(n.atencion.fecha) }}<template v-if="n.atencion.detalle">: {{ n.atencion.detalle }}</template></span>
              <div v-if="n.requiereEvaluacion && !n.atendida" class="sg-chips">
                <status-chip tono="in" label="Necesidad de infraestructura: requiere evaluación" />
                <status-chip tono="si" label="Costo no estimado" />
              </div>
              <div v-if="!n.atendida && puedeHacer('novedad.atender')">
                <q-btn flat dense color="secondary" icon="task_alt" label="Marcar como atendida" @click="abrirAtencion(n)" />
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

    <ambiente-dialog v-if="local" v-model="dialogoAmbiente.abierto" :local="local" :ambiente="dialogoAmbiente.ambiente" @hecho="(id) => (ambienteId = id)" />

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

    <q-dialog v-model="intervencion.abierta">
      <q-card style="width: 480px; max-width: 92vw">
        <q-card-section>
          <h2 class="text-h6 text-weight-bold q-my-none">Registrar intervención</h2>
          <p class="sg-muted q-mb-none">{{ ambiente?.nombre }}</p>
        </q-card-section>
        <q-card-section>
          <q-form class="column q-gutter-y-md" @submit="guardarIntervencion">
            <q-input v-model="intervencion.descripcion" outlined dense label="Intervención *" hint="Ej.: Pintado de muros, cambio de chapa" :rules="[(v) => !!v || 'Campo obligatorio']" />
            <q-input v-model="intervencion.fecha" outlined dense type="month" stack-label label="Mes" hint="Vacío si no se conoce" />
            <q-checkbox v-model="intervencion.esPintado" label="Es un pintado (actualiza el último pintado si es más reciente)" />
            <div class="row justify-end q-gutter-sm">
              <q-btn flat color="secondary" label="Cancelar" v-close-popup />
              <q-btn unelevated color="primary" type="submit" label="Registrar" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="atencion.abierta">
      <q-card style="width: 480px; max-width: 92vw">
        <q-card-section>
          <h2 class="text-h6 text-weight-bold q-my-none">Marcar novedad como atendida</h2>
          <p class="sg-muted q-mb-none">{{ atencion.novedad?.titulo }}</p>
        </q-card-section>
        <q-card-section class="column q-gutter-y-md">
          <q-input v-model="atencion.detalle" outlined dense type="textarea" autogrow label="Cómo se atendió" />
          <note-banner v-if="atencion.novedad?.requiereEvaluacion" tono="in">
            La necesidad de infraestructura asociada dejará de figurar en evaluación.
          </note-banner>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat color="secondary" label="Cancelar" v-close-popup />
          <q-btn unelevated color="primary" label="Marcar como atendida" @click="guardarAtencion" />
        </q-card-actions>
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
import NoteBanner from 'components/common/NoteBanner.vue'
import AmbienteDialog from 'components/centros/AmbienteDialog.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { ambientePorId, ambientesDeCar, bienesDeAmbiente, localesDeCar, textoUbicacion, ubicacionDeAmbiente } from 'src/services/datos'
import { atenderNovedad, registrarIntervencion, registrarNovedad } from 'src/services/acciones'
import { condicion } from 'src/config/catalogos'
import { fecha, plural } from 'src/utils/formato'

const $q = useQuasar()
const route = useRoute()
const { carsEnAmbito, enAmbitoCar, puedeAcceder, puedeHacer } = usePerfil()

const opcionesCar = computed(() => carsEnAmbito.value.map((c) => ({ label: c.nombre, value: c.id })))
const carId = ref(enAmbitoCar(route.query.car) ? route.query.car : carsEnAmbito.value[0]?.id)
const local = computed(() => (carId.value ? localesDeCar(carId.value)[0] ?? null : null))
const ambientes = computed(() => (carId.value ? ambientesDeCar(carId.value) : []))
const ambienteId = ref(ambientes.value.find((a) => a.id === route.query.ambiente)?.id ?? ambientes.value[0]?.id ?? null)
const ambiente = computed(() => (ambienteId.value ? ambientePorId(ambienteId.value) : null))

watch(carsEnAmbito, (cars) => {
  if (!cars.some((c) => c.id === carId.value)) carId.value = cars[0]?.id
})
watch(carId, () => {
  ambienteId.value = ambientes.value[0]?.id ?? null
})

const subtitulo = computed(() => (local.value ? `Local ${local.value.id} · ${local.value.nombre}` : 'Sin local registrado'))

const caracteristicas = (amb) =>
  [
    amb.areaM2 != null ? `${amb.areaM2} m²` : null,
    amb.ventanas != null ? plural(amb.ventanas, 'ventana', 'ventanas') : null,
    amb.puertas != null ? plural(amb.puertas, 'puerta', 'puertas') : null
  ].filter(Boolean).join(', ') || 'No informadas'

const abiertas = (amb) => amb.novedades.filter((n) => !n.atendida)
const activos = (amb) => bienesDeAmbiente(amb.id).filter((b) => b.situacion === 'activo').length

const dialogoAmbiente = reactive({ abierto: false, ambiente: null })

function abrirAmbiente (amb) {
  dialogoAmbiente.ambiente = amb
  dialogoAmbiente.abierto = true
}

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

const intervencion = reactive({ abierta: false, descripcion: '', fecha: '', esPintado: false })

function abrirIntervencion () {
  Object.assign(intervencion, { abierta: true, descripcion: '', fecha: '', esPintado: false })
}

function guardarIntervencion () {
  registrarIntervencion(ambiente.value, intervencion)
  intervencion.abierta = false
  $q.notify({ type: 'positive', message: 'Intervención registrada.' })
}

const atencion = reactive({ abierta: false, novedad: null, detalle: '' })

function abrirAtencion (n) {
  Object.assign(atencion, { abierta: true, novedad: n, detalle: '' })
}

function guardarAtencion () {
  atenderNovedad(atencion.novedad, atencion)
  atencion.abierta = false
  $q.notify({ type: 'positive', message: 'Novedad marcada como atendida.' })
}
</script>
