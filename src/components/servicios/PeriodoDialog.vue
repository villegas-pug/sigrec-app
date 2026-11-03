<template>
  <form-dialog
    :model-value="modelValue"
    :titulo="consulta ? 'Detalle del período' : 'Informar situación del período'"
    :subtitulo="`${centro.nombre} · ${TIPOS_SERVICIO[servicio.tipo]} · ${celda?.etiqueta ?? ''} ${anio}`"
    :ancho="520"
    :modificado="modificado"
    :solo-lectura="consulta"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <div class="sg-box">
      <span class="sg-kv__label">Proveedor</span>
      <span class="text-weight-bold">{{ servicio.proveedor }}</span>
      <span>Suministro: {{ servicio.suministro || 'No informado' }}</span>
      <span v-if="servicio.contacto?.telefono" class="sg-muted">Teléfono: {{ servicio.contacto.telefono }}<template v-if="servicio.contacto.nombre"> · {{ servicio.contacto.nombre }}</template></span>
      <span v-else-if="servicio.contacto?.nombre" class="sg-muted">Contacto: {{ servicio.contacto.nombre }}</span>
      <span v-else class="sg-muted">Contacto del proveedor no informado.</span>
    </div>

    <!-- Consulta -->
    <template v-if="consulta">
      <div class="sg-chips"><status-chip :tono="ESTADOS_PERIODO[celda.estado].tono" :label="ESTADOS_PERIODO[celda.estado].label" /></div>
      <div v-if="celda.estado === 'pendiente'" class="column q-gutter-y-xs">
        <span><span class="sg-kv__label">Vencimiento: </span>{{ celda.vence ? fecha(celda.vence) : 'no informado' }}</span>
        <span><span class="sg-kv__label">Motivo: </span>{{ celda.motivo ?? 'no informado' }}</span>
        <span v-if="celda.detalle" class="sg-muted">{{ celda.detalle }}</span>
      </div>
      <div v-else-if="celda.estado === 'pagado'" class="column q-gutter-y-xs">
        <template>
          <span><span class="sg-kv__label">Fecha de pago: </span>{{ celda.pago?.fecha ? fecha(celda.pago.fecha) : 'no informada' }}</span>
          <span><span class="sg-kv__label">Importe: </span>{{ celda.pago?.importe != null ? soles(celda.pago.importe) : 'no informado' }}</span>
          <span><span class="sg-kv__label">Sustento: </span>{{ celda.pago?.sustento ?? 'no informado' }}</span>
        </template>
      </div>
      <span v-else-if="celda.estado === 'sin_info'" class="sg-muted">Sin información de pago: no equivale a un pendiente confirmado.</span>
      <span v-else class="sg-muted">El período aún no vence.</span>
      <div v-if="!soloLectura" class="row q-gutter-sm"><q-btn outline color="secondary" label="Actualizar pago" @click="consulta = false" /><q-btn flat color="secondary" label="Corregir situación" @click="consulta = false" /></div>
    </template>

    <!-- Registro -->
    <template v-else>
      <q-option-group v-model="form.estado" :options="OPCIONES_ESTADO" />

      <template v-if="form.estado === 'pendiente'">
        <q-input v-model="form.vence" outlined dense type="date" stack-label label="Fecha de vencimiento (si se conoce)" />
        <q-input v-model="form.motivo" outlined dense label="Motivo del pendiente" hint="Opcional. Ej.: recibo observado, falta de fondos" />
        <q-input v-model="form.detalle" outlined dense type="textarea" autogrow label="Detalle" />
      </template>

      <template v-else-if="form.estado === 'pagado'">
        <div class="row q-col-gutter-md">
          <q-input v-model="form.pagoFecha" class="col-12 col-sm-6" outlined dense type="date" stack-label label="Fecha de pago" :hint="HINT_FECHA_CORTE" :rules="[requerido, noFutura]" />
          <q-input v-model.number="form.pagoImporte" class="col-12 col-sm-6" outlined dense type="number" min="0" step="0.01" label="Importe (S/) *" :rules="[mayorQueCero]" />
        </div>
        <q-input v-model="form.pagoSustento" outlined dense label="Sustento *" :rules="[(v) => !!v?.trim() || 'Campo obligatorio']" />
      </template>

      <note-banner v-else tono="ne" icono="help">Sin información no equivale a un pendiente confirmado: no se registra como deuda.</note-banner>

      <note-banner v-if="retrocede" tono="wa" icono="warning">
        Este cambio deja una corrección en los hechos del servicio.
      </note-banner>
    </template>

    <note-banner tono="in">Informar el pago de un período no restablece el servicio ni ejecuta el pago.</note-banner>
  </form-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import StatusChip from 'components/common/StatusChip.vue'
import { useBorrador } from 'src/composables/useBorrador'
import { carPorId } from 'src/services/datos'
import { informarPeriodo } from 'src/services/acciones'
import { ESTADOS_PERIODO, TIPOS_SERVICIO } from 'src/config/catalogos'
import { HINT_FECHA_CORTE, noFutura, requerido, mayorQueCero } from 'src/utils/validaciones'
import { fecha, soles } from 'src/utils/formato'

const OPCIONES_ESTADO = [
  { label: 'Pagado', value: 'pagado' },
  { label: 'Pendiente conocido', value: 'pendiente' },
  { label: 'Sin información', value: 'sin_info' }
]

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  servicio: { type: Object, required: true },
  celda: { type: Object, default: null },
  anio: { type: Number, required: true },
  // Solo consulta: el perfil no informa períodos o el servicio está anulado.
  soloLectura: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])
const $q = useQuasar()
const consulta = ref(false)

const form = reactive({ estado: 'pagado', vence: '', motivo: '', detalle: '', pagoFecha: '', pagoImporte: null, pagoSustento: '' })
const { modificado, fijar } = useBorrador(form)

const centro = computed(() => carPorId(props.servicio.carId))

// El estado de partida es el de la celda; «por venir» no existe como opción y parte de «pagado».
const estadoInicial = computed(() => (props.celda?.estado === 'por_venir' ? 'pagado' : props.celda?.estado ?? 'pagado'))
const retrocede = computed(
  () => (props.celda?.estado === 'pagado' && form.estado !== 'pagado') || (props.celda?.estado === 'pendiente' && form.estado === 'sin_info')
)

// `immediate`: la página monta este diálogo al elegir la primera celda, ya abierto.
watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  const c = props.celda
  consulta.value = props.soloLectura || c?.estado === 'pagado'
  Object.assign(form, {
    estado: estadoInicial.value,
    vence: c?.vence ?? '',
    motivo: c?.motivo ?? '',
    detalle: c?.detalle ?? '',
    pagoFecha: c?.pago?.fecha ?? '',
    pagoImporte: c?.pago?.importe ?? null,
    pagoSustento: c?.pago?.sustento ?? ''
  })
  fijar()
}, { immediate: true })

function guardar () {
  informarPeriodo(props.servicio, props.anio, props.celda.numero, {
    estado: form.estado,
    vence: form.vence,
    motivo: form.motivo,
    detalle: form.detalle,
    pago: { fecha: form.pagoFecha, importe: form.pagoImporte, sustento: form.pagoSustento }
  })
  $q.notify({ type: 'positive', message: 'Situación del período registrada.' })
  emit('update:modelValue', false)
}
</script>
