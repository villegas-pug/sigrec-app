<template>
  <form-dialog
    :model-value="modelValue"
    :titulo="evento ? 'Actualizar incidente' : 'Registrar incidente'"
    :subtitulo="subtitulo"
    :ancho="620"
    :etiqueta-enviar="evento ? 'Guardar cambios' : 'Registrar incidente'"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <div v-if="!ubicacionFija" class="row q-col-gutter-md">
      <q-select v-model="form.carId" class="col-12 col-sm-6" :options="opcionesCar" emit-value map-options outlined dense label="Centro *" :rules="[requerido]" @update:model-value="alCambiarCentro" />
      <q-select v-model="form.ambienteId" class="col-12 col-sm-6" :options="opcionesAmbiente" emit-value map-options outlined dense label="Ambiente *" :rules="[requerido]" @update:model-value="form.bienIds = []" />
    </div>
    <div class="row q-col-gutter-md">
      <q-select v-model="form.tipo" class="col-12 col-sm-6" :options="OPCIONES_INCIDENTE" emit-value map-options outlined dense label="Hecho *" :rules="[requerido]" />
      <q-input v-model="form.fecha" class="col-12 col-sm-6" outlined dense type="date" stack-label label="Fecha del hecho *" :rules="[requerido, noFutura]" />
    </div>
    <q-input v-model="form.titulo" outlined dense label="Motivo *" :rules="[requerido]" />
    <q-input v-model="form.detalle" outlined dense type="textarea" autogrow label="Detalle" />
    <q-select
      v-model="form.bienIds"
      :options="opcionesBien"
      multiple
      emit-value
      map-options
      use-chips
      outlined
      dense
      label="Bienes afectados *"
      hint="Solo los bienes indicados quedan afectados; el resto del ambiente no cambia."
      :rules="[(v) => v.length > 0 || 'Indique al menos un bien']"
    />
    <q-input
      v-if="unidadesEditables"
      v-model.number="form.unidades"
      outlined
      dense
      type="number"
      min="1"
      :max="bienUnico.cantidad"
      :label="`Unidades afectadas (de ${bienUnico.cantidad})`"
      hint="Vacío = todas las unidades. Define cuántas unidades se reponen (regla por validar)."
      :rules="[unidadesValidas]"
    />
    <condicion-selector v-if="!evento" v-model="form.condicion" etiqueta="Nueva condición de los bienes afectados" clearable />
    <q-checkbox v-model="form.reportaNecesidad" label="Reportar necesidad de reposición (sin esperar el fin de la vida útil)" />
  </form-dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import CondicionSelector from 'components/common/CondicionSelector.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { ambientesDeCar, bienPorId, bienesDeAmbiente, textoUbicacion, ubicacionDeAmbiente } from 'src/services/datos'
import { actualizarIncidente, registrarIncidente } from 'src/services/acciones'
import { OPCIONES_INCIDENTE } from 'src/config/catalogos'
import { FECHA_CORTE } from 'src/config/demo'
import { noFutura, requerido } from 'src/utils/validaciones'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // null = incidente nuevo; si no, el hecho que se corrige.
  evento: { type: Object, default: null },
  // Bien desde cuya ficha se registra: fija el centro y el ambiente.
  bien: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'hecho'])
const $q = useQuasar()
const { carsEnAmbito } = usePerfil()

const form = reactive({})

const ubicacionFija = computed(() => !!props.evento || !!props.bien)
const opcionesCar = computed(() => carsEnAmbito.value.map((c) => ({ label: c.nombre, value: c.id })))
const opcionesAmbiente = computed(() => (form.carId ? ambientesDeCar(form.carId) : []).map((a) => ({ label: a.nombre, value: a.id })))

// Al corregir un hecho se conservan como opción los bienes ya reportados aunque hoy estén dados de baja.
const opcionesBien = computed(() =>
  (form.ambienteId ? bienesDeAmbiente(form.ambienteId) : [])
    .filter((b) => b.situacion === 'activo' || (form.bienIds ?? []).includes(b.id))
    .map((b) => ({ label: `${b.nombre} · ${b.id}`, value: b.id }))
)

const subtitulo = computed(() => (form.ambienteId ? textoUbicacion(ubicacionDeAmbiente(form.ambienteId)) : 'Los campos con * son obligatorios'))

// Las unidades afectadas solo aplican a un único bien de un lote.
const bienUnico = computed(() => (form.bienIds?.length === 1 ? bienPorId(form.bienIds[0]) : null))
const unidadesEditables = computed(() => (bienUnico.value?.cantidad ?? 1) > 1)
const unidadesValidas = (v) => v === '' || v == null || (Number.isInteger(v) && v >= 1 && v <= (bienUnico.value?.cantidad ?? 1)) || 'Indique un número entero dentro de la cantidad del bien'

function alCambiarCentro () {
  form.ambienteId = opcionesAmbiente.value[0]?.value ?? null
  form.bienIds = []
}

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  const { evento, bien } = props
  const ambienteId = evento?.ambienteId ?? bien?.ambienteId ?? null
  const carId = ambienteId ? ubicacionDeAmbiente(ambienteId).car.id : carsEnAmbito.value[0]?.id ?? null
  Object.assign(form, {
    carId,
    ambienteId: ambienteId ?? (carId ? ambientesDeCar(carId)[0]?.id ?? null : null),
    tipo: evento?.tipo ?? 'dano',
    fecha: evento?.fecha ?? FECHA_CORTE,
    titulo: evento?.titulo ?? '',
    detalle: evento?.detalle ?? '',
    bienIds: evento ? [...evento.bienIds] : bien ? [bien.id] : [],
    unidades: evento?.unidades ?? null,
    condicion: null,
    reportaNecesidad: evento?.reportaNecesidad ?? true
  })
})

function guardar () {
  const datos = {
    tipo: form.tipo,
    fecha: form.fecha,
    titulo: form.titulo,
    detalle: form.detalle,
    bienIds: form.bienIds,
    unidades: unidadesEditables.value ? form.unidades : null,
    reportaNecesidad: form.reportaNecesidad
  }
  if (props.evento) {
    actualizarIncidente(props.evento, datos)
    $q.notify({ type: 'positive', message: 'Incidente actualizado.' })
  } else {
    registrarIncidente({ ...datos, ambienteId: form.ambienteId, condicion: form.condicion })
    $q.notify({ type: 'positive', message: `Incidente registrado para ${form.bienIds.length} bien(es).` })
  }
  emit('update:modelValue', false)
  emit('hecho')
}
</script>
