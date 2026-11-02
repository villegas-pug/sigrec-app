<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #acciones>
          <q-btn v-if="puedeHacer('servicio.registrar')" unelevated color="primary" icon="add" label="Registrar servicio" :disable="!local || !noRegistrados.length" @click="abrirServicio(null)" />
        </template>
      </page-header>

      <div class="sg-filters">
        <q-select v-model="carId" :options="opcionesCar" emit-value map-options outlined dense label="Establecimiento (CAR)" />
        <q-input :model-value="local ? `${local.id} · ${local.nombre}` : '—'" outlined dense readonly label="Local" />
        <q-select v-model="anio" :options="ANIOS_SERVICIOS" outlined dense label="Año" />
      </div>

      <note-banner tono="in">
        Informar un pago registra su situación para el control del servicio; no ejecuta el pago.
        Un período sin información no equivale a un pendiente confirmado.
        <template v-if="puedeHacer('servicio.periodo')">Seleccione una celda para informar su situación.</template>
      </note-banner>

      <section-card :titulo="`Períodos de pago · ${anio}`" sin-relleno>
        <template #acciones>
          <div class="sg-chips" aria-label="Leyenda">
            <status-chip v-for="(e, clave) in ESTADOS_PERIODO" :key="clave" :tono="e.tono" :label="e.label" />
          </div>
        </template>
        <div class="sg-table-wrap q-px-sm">
          <table class="sg-periodos">
            <thead>
              <tr>
                <th scope="col" style="text-align: left">Servicio</th>
                <th v-for="m in MESES_CORTOS" :key="m" scope="col">{{ m }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="fila in filas" :key="fila.servicio.id">
                <th scope="row">
                  <button type="button" class="sg-row-btn" @click="servicioId = fila.servicio.id">{{ TIPOS_SERVICIO[fila.servicio.tipo] }}</button>
                  <div class="sg-muted">
                    {{ fila.servicio.periodicidad === 'mensual' ? 'Mensual' : 'Trimestral' }}
                    <span v-if="fila.interrupcion" class="text-weight-bold" style="color: var(--sg-warning)"> · interrupción abierta</span>
                  </div>
                </th>
                <td v-for="celda in fila.celdas" :key="celda.numero" :colspan="celda.span">
                  <button
                    type="button"
                    class="sg-celda"
                    :class="`sg-celda--${celda.estado}`"
                    :aria-label="`${TIPOS_SERVICIO[fila.servicio.tipo]}, ${celda.etiqueta}: ${ESTADOS_PERIODO[celda.estado].label}`"
                    :disabled="!puedeHacer('servicio.periodo')"
                    @click="abrirPeriodo(fila.servicio, celda)"
                  >
                    <span>{{ celda.span > 1 ? `${celda.etiqueta} · ` : '' }}{{ ESTADOS_PERIODO[celda.estado].label }}</span>
                    <span v-if="celda.estado === 'pendiente'" class="sg-celda__sub">{{ celda.vence ? `vence ${fecha(celda.vence)}` : 'vencimiento no informado' }}</span>
                  </button>
                </td>
              </tr>
              <tr v-for="tipo in noRegistrados" :key="tipo">
                <th scope="row">{{ TIPOS_SERVICIO[tipo] }}</th>
                <td colspan="12">
                  <button v-if="puedeHacer('servicio.registrar')" type="button" class="sg-celda sg-celda--sin_info" @click="abrirServicio(null, tipo)">
                    Sin servicio registrado para este local · Registrar
                  </button>
                  <span v-else class="sg-celda sg-celda--sin_info" style="cursor: default">Sin servicio registrado para este local</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-for="aviso in avisosContinuidad" :key="aviso.servicio.id" class="q-px-md q-pb-md">
          <note-banner tono="wa" icono="warning">
            {{ aviso.nombre }}: el último período pagado no demuestra continuidad. {{ aviso.celdas.map((c) => c.etiqueta).join(', ') }} siguen sin información.
          </note-banner>
        </div>
      </section-card>

      <div class="sg-grid-2">
        <section-card titulo="Atención pendiente">
          <ul class="sg-timeline">
            <li v-for="(a, i) in avisos" :key="i" class="sg-timeline__item">
              <div class="column q-gutter-y-xs">
                <status-chip v-bind="ETIQUETAS_AVISO[a.clase]" />
                <span><strong>{{ a.nombre }}</strong> · {{ describir(a) }}</span>
              </div>
            </li>
            <li v-if="!avisos.length" class="sg-timeline__item sg-muted">Sin pendientes ni problemas informados.</li>
          </ul>
        </section-card>

        <section-card v-if="servicio" :titulo="`Ficha del servicio · ${TIPOS_SERVICIO[servicio.tipo]}`" :subtitulo="`${local.id} · ${local.nombre}`">
          <template #acciones>
            <q-btn v-if="puedeHacer('servicio.actualizar')" outline color="secondary" icon="edit" label="Actualizar ficha" @click="abrirServicio(servicio)" />
            <template v-if="puedeHacer('servicio.hecho')">
              <q-btn outline color="secondary" label="Informar restablecimiento" @click="abrirHecho('restablecimiento')" />
              <q-btn outline color="secondary" label="Informar interrupción" @click="abrirHecho('interrupcion')" />
            </template>
          </template>
          <div class="sg-kv-grid">
            <key-value etiqueta="Proveedor">{{ servicio.proveedor }}</key-value>
            <key-value etiqueta="N.º de suministro">{{ servicio.suministro }}</key-value>
            <key-value etiqueta="Contratación">{{ servicio.contratacion }}</key-value>
            <key-value etiqueta="Situación del suministro">
              <status-chip v-if="interrupcionAbierta(servicio)" tono="wa" label="Interrumpido · restablecimiento no informado" />
              <status-chip v-else tono="ok" label="Sin interrupción abierta" />
            </key-value>
            <key-value etiqueta="Observaciones de instalación">{{ servicio.observaciones || 'Sin observaciones' }}</key-value>
          </div>
          <h3 class="sg-kv__label q-mt-lg q-mb-sm">Hechos informados</h3>
          <ul class="sg-timeline">
            <li v-for="(h, i) in hechosOrdenados" :key="i" class="sg-timeline__item">
              <span class="sg-timeline__date">{{ fecha(h.fecha) }}</span>
              <div class="column">
                <span><status-chip v-bind="HECHOS[h.tipo]" /> {{ h.detalle }}</span>
                <span v-if="h.tipo === 'pago'" class="sg-muted">El pago no registra restablecimiento del servicio.</span>
              </div>
            </li>
            <li v-if="!hechosOrdenados.length" class="sg-timeline__item sg-muted">Sin hechos informados.</li>
          </ul>
        </section-card>
      </div>
    </div>

    <servicio-dialog
      v-if="local"
      v-model="dialogoServicio.abierto"
      :local="local"
      :servicio="dialogoServicio.servicio"
      :tipos-disponibles="noRegistrados"
      :tipo-inicial="dialogoServicio.tipo"
      @hecho="(id) => (servicioId = id)"
    />

    <q-dialog v-model="periodo.abierto">
      <q-card style="width: 460px; max-width: 92vw">
        <q-card-section>
          <h2 class="text-h6 text-weight-bold q-my-none">Informar situación del período</h2>
          <p class="sg-muted q-mb-none">{{ periodo.servicio && TIPOS_SERVICIO[periodo.servicio.tipo] }} · {{ periodo.celda?.etiqueta }} {{ anio }}</p>
        </q-card-section>
        <q-card-section class="column q-gutter-y-md">
          <q-option-group v-model="periodo.estado" :options="OPCIONES_ESTADO" />
          <q-input v-if="periodo.estado === 'pendiente'" v-model="periodo.vence" outlined dense type="date" stack-label label="Fecha de vencimiento (si se conoce)" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat color="secondary" label="Cancelar" v-close-popup />
          <q-btn unelevated color="primary" label="Guardar" @click="guardarPeriodo" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="hecho.abierto">
      <q-card style="width: 460px; max-width: 92vw">
        <q-card-section>
          <h2 class="text-h6 text-weight-bold q-my-none">Informar {{ hecho.tipo === 'interrupcion' ? 'interrupción' : 'restablecimiento' }}</h2>
          <p class="sg-muted q-mb-none">{{ servicio && TIPOS_SERVICIO[servicio.tipo] }}</p>
        </q-card-section>
        <q-card-section class="column q-gutter-y-md">
          <q-input v-model="hecho.fecha" outlined dense type="date" stack-label label="Fecha" />
          <q-input v-model="hecho.detalle" outlined dense type="textarea" autogrow label="Detalle" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat color="secondary" label="Cancelar" v-close-popup />
          <q-btn unelevated color="primary" label="Registrar" @click="guardarHecho" />
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
import KeyValue from 'components/common/KeyValue.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import ServicioDialog from 'components/servicios/ServicioDialog.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { localesDeCar, servicioPorId } from 'src/services/datos'
import { avisosDeServicios, celdasDelServicio, interrupcionAbierta, serviciosDeCar, tiposNoRegistrados } from 'src/services/servicios'
import { informarHechoServicio, informarPeriodo } from 'src/services/acciones'
import { ESTADOS_PERIODO, MESES_CORTOS, TIPOS_SERVICIO } from 'src/config/catalogos'
import { ANIOS_SERVICIOS, FECHA_CORTE } from 'src/config/demo'
import { fecha } from 'src/utils/formato'

const ETIQUETAS_AVISO = {
  pendiente_vence: { tono: 'da', label: 'Pendiente con vencimiento' },
  pendiente_sin_fecha: { tono: 'wa', label: 'Pendiente sin fecha' },
  interrupcion: { tono: 'wa', label: 'Interrupción abierta' },
  sin_info: { tono: 'si', label: 'Sin información' }
}
const HECHOS = {
  interrupcion: { tono: 'wa', label: 'Interrupción informada' },
  restablecimiento: { tono: 'ok', label: 'Restablecimiento informado' },
  pago: { tono: 'in', label: 'Pago informado' }
}
const OPCIONES_ESTADO = [
  { label: 'Pagado', value: 'pagado' },
  { label: 'Pendiente conocido', value: 'pendiente' },
  { label: 'Sin información', value: 'sin_info' }
]

const $q = useQuasar()
const route = useRoute()
const { carsEnAmbito, enAmbitoCar, puedeHacer } = usePerfil()

const dialogoServicio = reactive({ abierto: false, servicio: null, tipo: null })

function abrirServicio (srv, tipo = null) {
  Object.assign(dialogoServicio, { abierto: true, servicio: srv, tipo })
}

const opcionesCar = computed(() => carsEnAmbito.value.map((c) => ({ label: c.nombre, value: c.id })))
const carId = ref(enAmbitoCar(route.query.car) ? route.query.car : carsEnAmbito.value[0]?.id)
const anio = ref(ANIOS_SERVICIOS.at(-1))
const local = computed(() => (carId.value ? localesDeCar(carId.value)[0] : null))
const servicios = computed(() => (carId.value ? serviciosDeCar(carId.value) : []))
const noRegistrados = computed(() => tiposNoRegistrados(servicios.value))

watch(carsEnAmbito, (cars) => {
  if (!cars.some((c) => c.id === carId.value)) carId.value = cars[0]?.id
})

const filas = computed(() =>
  servicios.value.map((servicio) => ({
    servicio,
    celdas: celdasDelServicio(servicio, anio.value, FECHA_CORTE),
    interrupcion: interrupcionAbierta(servicio)
  }))
)

const avisos = computed(() => avisosDeServicios(servicios.value, anio.value, FECHA_CORTE))

// Un período pagado posterior a huecos sin información no prueba continuidad (regla provisional 12).
const avisosContinuidad = computed(() =>
  avisos.value.filter((a) => {
    if (a.clase !== 'sin_info') return false
    const ultimoPagado = Math.max(0, ...(a.servicio.periodos[anio.value]?.pagados ?? []))
    return a.celdas.some((c) => c.numero < ultimoPagado)
  })
)

function describir (aviso) {
  const celda = aviso.celdas[0]
  if (aviso.clase === 'pendiente_vence') return `${celda.etiqueta} pendiente. Vence el ${fecha(celda.vence)}.`
  if (aviso.clase === 'pendiente_sin_fecha') return `${celda.etiqueta} pendiente. Sin fecha aplicable no se señala vencimiento.`
  if (aviso.clase === 'interrupcion') return `Interrupción desde el ${fecha(aviso.interrupcion.fecha)}, sin restablecimiento informado.`
  return `${aviso.celdas.length} período(s) sin información: ${aviso.celdas.map((c) => c.etiqueta).join(', ')}.`
}

const servicioId = ref(null)
watch(servicios, (lista) => {
  if (!lista.some((s) => s.id === servicioId.value)) {
    servicioId.value = (lista.find((s) => interrupcionAbierta(s)) ?? lista[0])?.id ?? null
  }
}, { immediate: true })
const servicio = computed(() => (servicioId.value ? servicioPorId(servicioId.value) : null))
const hechosOrdenados = computed(() => [...(servicio.value?.hechos ?? [])].sort((a, b) => b.fecha.localeCompare(a.fecha)))

const periodo = reactive({ abierto: false, servicio: null, celda: null, estado: 'pagado', vence: '' })

function abrirPeriodo (srv, celda) {
  Object.assign(periodo, {
    abierto: true,
    servicio: srv,
    celda,
    estado: celda.estado === 'por_venir' ? 'pagado' : celda.estado,
    vence: celda.vence ?? ''
  })
}

function guardarPeriodo () {
  informarPeriodo(periodo.servicio, anio.value, periodo.celda.numero, periodo)
  periodo.abierto = false
  $q.notify({ type: 'positive', message: 'Situación del período registrada.' })
}

const hecho = reactive({ abierto: false, tipo: 'interrupcion', fecha: FECHA_CORTE, detalle: '' })

function abrirHecho (tipo) {
  Object.assign(hecho, { abierto: true, tipo, fecha: FECHA_CORTE, detalle: '' })
}

function guardarHecho () {
  informarHechoServicio(servicio.value, { tipo: hecho.tipo, fecha: hecho.fecha, detalle: hecho.detalle || 'Sin detalle informado.' })
  hecho.abierto = false
  $q.notify({ type: 'positive', message: 'Hecho del servicio registrado.' })
}
</script>
