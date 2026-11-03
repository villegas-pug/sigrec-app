<template>
  <form-dialog
    :model-value="modelValue"
    :titulo="evento ? 'Actualizar incidente' : 'Registrar incidente'"
    :subtitulo="subtitulo"
    :ancho="620"
    :etiqueta-enviar="evento ? 'Guardar cambios' : 'Registrar incidente'"
    :modificado="modificado"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <selector-ubicacion-bien
      v-model="form.bienIds"
      v-model:car-id="form.carId"
      v-model:ambiente-id="form.ambienteId"
      multiple
      :ubicacion-fija="ubicacionFija"
      :filtro="esElegible"
    />
    <div class="sg-muted" style="margin-top: -8px">Solo los bienes indicados quedan afectados; el resto del ambiente no cambia.</div>
    <div class="row q-col-gutter-md">
      <q-select v-model="form.tipo" class="col-12 col-sm-6" :options="OPCIONES_INCIDENTE" emit-value map-options outlined dense label="Hecho *" :rules="[requerido]">
        <template #append><boton-dictado v-model="form.tipo" tipo="opcion" :opciones="OPCIONES_INCIDENTE" emit-value /></template>
      </q-select>
      <q-input v-model="form.fecha" class="col-12 col-sm-6" outlined dense type="date" stack-label label="Fecha del hecho *" :hint="HINT_FECHA_CORTE" :rules="[requerido, noFutura]">
        <template #append><boton-dictado v-model="form.fecha" tipo="fecha" /></template>
      </q-input>
    </div>
    <q-input v-model="form.titulo" outlined dense label="Motivo *" :rules="[requerido]">
      <template #append><boton-dictado v-model="form.titulo" /></template>
    </q-input>
    <q-input v-model="form.detalle" outlined dense type="textarea" autogrow label="Detalle">
      <template #append><boton-dictado v-model="form.detalle" /></template>
    </q-input>
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
      :rules="[unidadesValidas]">
      <template #append><boton-dictado v-model="form.unidades" tipo="numero" /></template>
    </q-input>
    <template v-if="!evento">
      <q-toggle v-if="form.bienIds?.length > 1" v-model="porBien" label="Indicar condición por bien" />
      <div v-if="porBien && form.bienIds?.length > 1" class="column q-gutter-y-sm">
        <div v-for="id in form.bienIds" :key="id" class="sg-box">
          <div class="sg-chips">
            <span class="text-weight-bold">{{ bienPorId(id).nombre }} · {{ id }}</span>
            <status-chip v-bind="condicion(bienPorId(id).condicion)" :label="`Actual: ${condicion(bienPorId(id).condicion).label}`" />
          </div>
          <condicion-selector v-model="form.condiciones[id]" clearable />
        </div>
      </div>
      <condicion-selector v-else v-model="form.condicion" etiqueta="Nueva condición de los bienes afectados" clearable />
    </template>
    <q-checkbox v-model="form.reportaNecesidad" label="Reportar necesidad de reposición (sin esperar el fin de la vida útil)" />
  </form-dialog>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import CondicionSelector from 'components/common/CondicionSelector.vue'
import StatusChip from 'components/common/StatusChip.vue'
import SelectorUbicacionBien from 'components/bienes/SelectorUbicacionBien.vue'
import { useBorrador } from 'src/composables/useBorrador'
import { bienPorId, textoUbicacion, ubicacionDeAmbiente } from 'src/services/datos'
import { actualizarIncidente, registrarIncidente } from 'src/services/acciones'
import { OPCIONES_INCIDENTE, condicion } from 'src/config/catalogos'
import { FECHA_CORTE } from 'src/config/demo'
import { HINT_FECHA_CORTE, noFutura, requerido } from 'src/utils/validaciones'
import { plural } from 'src/utils/formato'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // null = incidente nuevo; si no, el hecho que se corrige.
  evento: { type: Object, default: null },
  // Bien desde cuya ficha se registra: fija el centro y el ambiente.
  bien: { type: Object, default: null },
  // Centro de contexto (p. ej. el filtrado en Incidencias); null = el usuario lo elige.
  carInicial: { type: String, default: null }
})

const emit = defineEmits(['update:modelValue', 'hecho'])
const $q = useQuasar()

const form = reactive({})
const { modificado, fijar } = useBorrador(form, { excluir: ['carId'] })

const ubicacionFija = computed(() => !!props.evento || !!props.bien)
const porBien = ref(false)

// Al corregir un hecho se conservan como opción los bienes ya reportados aunque hoy estén dados de baja.
const esElegible = (b) => b.situacion === 'activo' || (form.bienIds ?? []).includes(b.id)

const subtitulo = computed(() => (form.ambienteId ? textoUbicacion(ubicacionDeAmbiente(form.ambienteId)) : 'Los campos con * son obligatorios'))

// Las unidades afectadas solo aplican a un único bien de un lote.
const bienUnico = computed(() => (form.bienIds?.length === 1 ? bienPorId(form.bienIds[0]) : null))
const unidadesEditables = computed(() => (bienUnico.value?.cantidad ?? 1) > 1)
const unidadesValidas = (v) => v === '' || v == null || (Number.isInteger(v) && v >= 1 && v <= (bienUnico.value?.cantidad ?? 1)) || 'Indique un número entero dentro de la cantidad del bien'

// Las condiciones por bien solo se conservan para los bienes aún seleccionados.
watch(() => form.bienIds, (ids) => {
  for (const id of Object.keys(form.condiciones ?? {})) if (!(ids ?? []).includes(id)) delete form.condiciones[id]
}, { deep: true })

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  const { evento, bien } = props
  // El hecho o el bien fijan la ubicación; si no, se hereda el contexto de la pantalla (centro filtrado) sin elegir ambiente.
  const ambienteId = evento?.ambienteId ?? bien?.ambienteId ?? null
  const carId = ambienteId ? ubicacionDeAmbiente(ambienteId).car.id : props.carInicial
  porBien.value = false
  Object.assign(form, {
    carId: carId ?? null,
    ambienteId,
    tipo: evento?.tipo ?? 'dano',
    fecha: evento?.fecha ?? FECHA_CORTE,
    titulo: evento?.titulo ?? '',
    detalle: evento?.detalle ?? '',
    bienIds: evento ? [...evento.bienIds] : bien ? [bien.id] : [],
    unidades: evento?.unidades ?? null,
    condicion: null,
    condiciones: {},
    reportaNecesidad: evento?.reportaNecesidad ?? true
  })
  fijar()
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
    registrarIncidente({
      ...datos,
      ambienteId: form.ambienteId,
      condicion: porBien.value ? null : form.condicion,
      condiciones: porBien.value ? form.condiciones : {}
    })
    $q.notify({ type: 'positive', message: `Incidente registrado para ${plural(form.bienIds.length, 'bien', 'bienes')}.` })
  }
  emit('update:modelValue', false)
  emit('hecho')
}
</script>
