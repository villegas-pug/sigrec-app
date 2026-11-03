<template>
  <form-dialog
    :model-value="modelValue"
    :titulo="TITULOS[modo]"
    :subtitulo="bienActivo ? `${bienActivo.nombre} · ${bienActivo.id}` : 'Los campos con * son obligatorios'"
    :ancho="640"
    :etiqueta-enviar="TITULOS[modo]"
    :color-enviar="modo === 'baja' ? 'negative' : 'primary'"
    :modificado="modificado"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <selector-ubicacion-bien
      v-if="!bien"
      v-model="form.bienId"
      v-model:car-id="form.carId"
      v-model:ambiente-id="form.ambienteId"
      :filtro="esCandidato"
      :sin-candidatos="SIN_CANDIDATOS[modo]"
      @update:model-value="aplicarBien"
    />

    <note-banner v-if="modo === 'reposicion'" tono="in">
      Solo se reponen bienes dados de baja que aún no tienen una reposición vigente. Para reponer un bien activo,
      dé de baja primero (desde «Dar de baja» o desde el incidente).
    </note-banner>

    <template v-if="modo === 'verificacion'">
      <q-input v-model="form.fecha" outlined dense type="date" stack-label label="Fecha de la verificación *" :hint="HINT_FECHA_CORTE" :rules="[requerido, noFutura]">
        <template #append><boton-dictado v-model="form.fecha" tipo="fecha" /></template>
      </q-input>
      <q-option-group v-model="form.resultado" :options="OPCIONES_RESULTADO" />
      <q-input v-model="form.nota" outlined dense type="textarea" autogrow label="Observación de la verificación">
        <template #append><boton-dictado v-model="form.nota" /></template>
      </q-input>
    </template>

    <template v-if="modo === 'baja'">
      <div v-if="bienActivo" class="sg-box">
        <div class="sg-muted">Se dará de baja</div>
        <span class="text-weight-bold">{{ bienActivo.nombre }} · {{ bienActivo.id }}</span>
        <span class="sg-muted">{{ textoUbicacion(ubicacionDeBien(bienActivo)) }}</span>
        <div class="sg-chips">
          <status-chip v-bind="condicion(bienActivo.condicion)" :label="`Condición: ${condicion(bienActivo.condicion).label}`" />
          <status-chip v-bind="SITUACIONES[bienActivo.situacion]" />
        </div>
      </div>
      <q-input v-model="form.fecha" outlined dense type="date" stack-label label="Fecha de la baja *" :hint="HINT_FECHA_CORTE" :rules="[requerido, noFutura]">
        <template #append><boton-dictado v-model="form.fecha" tipo="fecha" /></template>
      </q-input>
      <q-input v-model="form.motivo" outlined dense label="Motivo de la baja *" :rules="[requerido]">
        <template #append><boton-dictado v-model="form.motivo" /></template>
      </q-input>
      <q-input v-model="form.detalle" outlined dense type="textarea" autogrow label="Sustento o detalle">
        <template #append><boton-dictado v-model="form.detalle" /></template>
      </q-input>
      <note-banner v-if="hijosActivos.length" tono="wa" icono="warning">
        La baja no se aplica a los bienes asociados. Quedarán marcados para revisar su situación uno por uno:
        {{ hijosActivos.map(etiquetaComponente).join(', ') }}.
      </note-banner>
    </template>

    <template v-if="modo === 'reposicion'">
      <div v-if="bienActivo" class="sg-grid-2">
        <div class="sg-box sg-box--dashed">
          <div class="sg-muted">Sale: bien reemplazado</div>
          <span class="text-weight-bold">{{ bienActivo.nombre }} · {{ bienActivo.id }}</span>
          <span class="sg-muted">{{ textoUbicacion(ubicacionDeBien(bienActivo)) }}</span>
          <span class="sg-muted">Dado de baja el {{ fecha(bajaPrevia?.fecha) }}</span>
        </div>
        <div class="sg-box">
          <div class="sg-muted">Ingresa: bien nuevo</div>
          <span class="text-weight-bold">{{ form.nombre || '—' }} · {{ form.rotulo || '—' }}</span>
          <span class="sg-muted">Destino: {{ textoUbicacion(ubicacionDeBien(bienActivo)) }}</span>
          <span v-if="bienActivo.asociadoA" class="sg-muted">Componente de {{ bienActivo.asociadoA.bienId }} ({{ bienActivo.asociadoA.posicion ?? 'posición no informada' }})</span>
        </div>
      </div>
      <q-input v-model="form.fecha" outlined dense type="date" stack-label label="Fecha de la reposición *" :hint="HINT_FECHA_CORTE" :rules="[requerido, noFutura, noAnteriorABaja]">
        <template #append><boton-dictado v-model="form.fecha" tipo="fecha" /></template>
      </q-input>
      <q-input v-model="form.rotulo" outlined dense label="Rótulo SIGREC del bien nuevo *" :rules="[requerido, rotuloLibre]">
        <template #append><boton-dictado v-model="form.rotulo" tipo="codigo" /></template>
      </q-input>
      <q-input v-model="form.nombre" outlined dense label="Nombre *" :rules="[requerido]">
        <template #append><boton-dictado v-model="form.nombre" /></template>
      </q-input>
      <q-input v-model="form.codigoPatrimonial" outlined dense label="Código patrimonial">
        <template #append><boton-dictado v-model="form.codigoPatrimonial" tipo="codigo" /></template>
      </q-input>
      <campo-adquisicion v-model="form.fechaAdquisicion" label="Adquisición del bien nuevo" />
      <div class="row q-col-gutter-md">
        <q-input v-model.number="form.costo" class="col-12 col-sm-6" outlined dense type="number" min="0" label="Costo original (S/)">
          <template #append><boton-dictado v-model="form.costo" tipo="numero" /></template>
        </q-input>
        <q-input v-model.number="form.vidaUtilAnios" class="col-12 col-sm-6" outlined dense type="number" min="1" label="Vida útil (años)">
          <template #append><boton-dictado v-model="form.vidaUtilAnios" tipo="numero" /></template>
        </q-input>
      </div>
      <div v-if="hijosActivos.length">
        <div class="sg-kv__label q-mb-xs">Componentes que pasan al bien nuevo</div>
        <div v-for="h in hijosActivos" :key="h.id" class="row items-center q-gutter-x-sm">
          <q-checkbox v-model="form.componentesIds" :val="h.id" :label="etiquetaComponente(h)" />
          <status-chip v-bind="condicion(h.condicion)" />
          <status-chip v-bind="SITUACIONES[h.situacion]" />
          <status-chip v-if="h.revisionPendiente" tono="wa" label="Situación por revisar" />
        </div>
        <div class="sg-muted">Los componentes sin marcar siguen asociados al bien dado de baja, pendientes de revisión.</div>
      </div>
    </template>
  </form-dialog>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import StatusChip from 'components/common/StatusChip.vue'
import SelectorUbicacionBien from 'components/bienes/SelectorUbicacionBien.vue'
import CampoAdquisicion from 'components/common/CampoAdquisicion.vue'
import { useBorrador } from 'src/composables/useBorrador'
import { db, bienPorId, textoUbicacion, tipoPorId, ubicacionDeBien } from 'src/services/datos'
import { bajaDe, darDeBaja, informarVerificacion, registrarReposicion, reposicionDe, rotuloSugerido } from 'src/services/acciones'
import { FECHA_CORTE } from 'src/config/demo'
import { SITUACIONES, condicion } from 'src/config/catalogos'
import { HINT_FECHA_CORTE, noAnteriorA, noFutura, requerido } from 'src/utils/validaciones'
import { fecha } from 'src/utils/formato'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // verificacion | baja | reposicion (los incidentes se registran con IncidenteDialog).
  modo: { type: String, required: true },
  // Bien desde cuya ficha se actúa. Sin él, el diálogo pide elegirlo: Centro › Ambiente › Bien.
  bien: { type: Object, default: null },
  // Centro de contexto (p. ej. el filtrado en Incidencias); null = el usuario lo elige.
  carInicial: { type: String, default: null }
})

const emit = defineEmits(['update:modelValue', 'hecho'])
const $q = useQuasar()

const TITULOS = {
  verificacion: 'Informar verificación',
  baja: 'Dar de baja',
  reposicion: 'Registrar reposición'
}
const OPCIONES_RESULTADO = [
  { label: 'Coincide con lo informado', value: 'coincide' },
  { label: 'Se encontraron diferencias', value: 'diferencias' }
]

const SIN_CANDIDATOS = {
  verificacion: 'No hay bienes para verificar en este ambiente.',
  baja: 'No hay bienes activos para dar de baja en este ambiente.',
  reposicion: 'No hay bienes dados de baja pendientes de reposición en este ambiente. Un bien activo debe darse de baja antes de reponerlo.'
}

const rotuloLibre = (v) => !bienPorId(v) || 'Ya existe un bien con ese rótulo'

const form = reactive({})
const { modificado, fijar } = useBorrador(form, { excluir: ['carId'] })

// Bien sobre el que se actúa: el de la ficha o, desde Incidencias, el elegido en el selector.
const bienActivo = computed(() => props.bien ?? bienPorId(form.bienId) ?? null)

const hijosActivos = computed(() =>
  bienActivo.value ? db.bienes.filter((b) => b.asociadoA?.bienId === bienActivo.value.id && b.situacion === 'activo') : []
)

const etiquetaComponente = (h) => `${h.nombre} ${h.id}${h.asociadoA?.posicion ? ` (${h.asociadoA.posicion})` : ''}`

// Baja: bienes activos. Reposición: bienes dados de baja sin una reposición vigente. Verificación: cualquier bien no anulado.
function esCandidato (b) {
  if (props.modo === 'baja') return b.situacion === 'activo'
  if (props.modo === 'reposicion') return b.situacion === 'baja' && !reposicionDe(b.id)
  return b.situacion !== 'anulado'
}

const bajaPrevia = computed(() => (bienActivo.value ? bajaDe(bienActivo.value.id) : null))
const noAnteriorABaja = noAnteriorA(() => bajaPrevia.value?.fecha, 'No puede ser anterior a la fecha de la baja')

// Los valores sugeridos de la reposición dependen del bien elegido.
function aplicarBien () {
  const bien = bienActivo.value
  Object.assign(form, {
    rotulo: bien ? rotuloSugerido(bien.ambienteId, bien.tipoId) : '',
    nombre: bien?.nombre ?? '',
    vidaUtilAnios: bien ? bien.vidaUtilAnios ?? tipoPorId(bien.tipoId)?.vidaUtilSugerida ?? null : null,
    componentesIds: []
  })
}

function reiniciar () {
  Object.keys(form).forEach((k) => delete form[k])
  Object.assign(form, {
    bienId: props.bien?.id ?? null,
    carId: props.carInicial,
    ambienteId: null,
    fecha: FECHA_CORTE,
    resultado: 'coincide',
    nota: '',
    motivo: '',
    detalle: '',
    codigoPatrimonial: '',
    fechaAdquisicion: FECHA_CORTE.slice(0, 7),
    costo: null
  })
  aplicarBien()
  fijar()
}

watch(() => props.modelValue, (abierto) => {
  if (abierto) reiniciar()
})

function guardar () {
  const bien = bienActivo.value
  let mensaje = ''
  let nuevoId = null
  if (props.modo === 'verificacion') {
    informarVerificacion(bien, form)
    mensaje = 'Verificación registrada.'
  } else if (props.modo === 'baja') {
    darDeBaja(bien, form)
    mensaje = hijosActivos.value.length ? 'Baja registrada. Revise los bienes asociados.' : 'Baja registrada.'
  } else if (props.modo === 'reposicion') {
    nuevoId = registrarReposicion(bien, form).id
    mensaje = `Reposición registrada: ${nuevoId}.`
  }
  $q.notify({ type: 'positive', message: mensaje })
  emit('update:modelValue', false)
  emit('hecho', nuevoId)
}
</script>
