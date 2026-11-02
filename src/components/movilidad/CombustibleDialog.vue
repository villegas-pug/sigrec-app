<template>
  <form-dialog
    :model-value="modelValue"
    :titulo="registro ? 'Actualizar registro de combustible' : 'Informar combustible'"
    :subtitulo="`${vehiculo.id} · ${vehiculo.combustible}`"
    :ancho="520"
    :etiqueta-enviar="registro ? 'Guardar cambios' : 'Registrar'"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <q-option-group v-model="form.tipo" inline :options="OPCIONES_TIPO" />
    <div class="row q-col-gutter-md">
      <q-input v-model="form.fecha" class="col-12 col-sm-6" outlined dense type="date" stack-label label="Fecha *" :rules="[requerido, noFutura]" />
      <q-input v-model.number="form.cantidad" class="col-12 col-sm-6" outlined dense type="number" min="0" step="0.1" label="Cantidad *" suffix="L" :rules="[mayorQueCero]" />
    </div>
    <q-select
      v-if="form.tipo === 'consumo'"
      v-model="form.itinerarioId"
      :options="opcionesItinerario"
      emit-value
      map-options
      outlined
      dense
      label="Recorrido *"
      hint="Solo recorridos realizados sin consumo declarado, para no contarlos dos veces"
      :rules="[requerido]"
    />
    <q-input v-model="form.sustento" outlined dense label="Sustento (vale, declaración…)" />
  </form-dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import { actualizarCombustible, registrarCombustible } from 'src/services/acciones'
import { itinerariosDeVehiculo } from 'src/services/combustible'
import { FECHA_CORTE } from 'src/config/demo'
import { fecha as formatoFecha } from 'src/utils/formato'
import { mayorQueCero, noFutura, requerido } from 'src/utils/validaciones'

const OPCIONES_TIPO = [
  { label: 'Carga al vehículo', value: 'carga' },
  { label: 'Consumo declarado en un recorrido', value: 'consumo' }
]

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  vehiculo: { type: Object, required: true },
  // null = registro nuevo.
  registro: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue'])
const $q = useQuasar()

const form = reactive({ tipo: 'carga', fecha: FECHA_CORTE, cantidad: null, itinerarioId: null, sustento: '' })

// Recorridos realizados sin consumo declarado; al corregir un consumo se conserva su propio recorrido.
const opcionesItinerario = computed(() =>
  itinerariosDeVehiculo(props.vehiculo.id)
    .filter((it) => it.realizado && (it.consumoDeclaradoL == null || it.id === props.registro?.itinerarioId))
    .map((it) => ({ label: `${it.id} · ${formatoFecha(it.fecha)} · ${it.proposito}`, value: it.id }))
)

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  const r = props.registro
  Object.assign(form, {
    tipo: r?.tipo ?? 'carga',
    fecha: r?.fecha ?? FECHA_CORTE,
    cantidad: r?.cantidad ?? null,
    itinerarioId: r?.itinerarioId ?? null,
    sustento: r?.sustento ?? ''
  })
})

function guardar () {
  const datos = {
    fecha: form.fecha,
    tipo: form.tipo,
    cantidad: form.cantidad,
    itinerarioId: form.tipo === 'consumo' ? form.itinerarioId : null,
    sustento: form.sustento || null
  }
  if (props.registro) actualizarCombustible(props.registro, datos)
  else registrarCombustible({ vehiculoId: props.vehiculo.id, ...datos })
  $q.notify({ type: 'positive', message: props.registro ? 'Registro de combustible actualizado.' : form.tipo === 'carga' ? 'Carga registrada.' : 'Consumo declarado registrado.' })
  emit('update:modelValue', false)
}
</script>
