<template>
  <form-dialog
    :model-value="modelValue"
    :titulo="registro ? 'Actualizar registro de combustible' : 'Informar combustible'"
    :subtitulo="`${vehiculo.id} · ${vehiculo.combustible}`"
    :ancho="520"
    :etiqueta-enviar="registro ? 'Guardar cambios' : 'Registrar'"
    :modificado="modificado"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <q-option-group v-model="form.tipo" inline :options="opcionesTipo" />
    <note-banner v-if="!opcionesItinerario.length" tono="in" icono="route">
      No hay recorridos realizados sin consumo declarado, así que no se puede declarar un consumo.
      Para hacerlo, primero informe la ejecución de un recorrido.
      <router-link v-if="puedeAcceder('itinerarios')" :to="{ name: 'itinerarios', query: { vehiculo: vehiculo.id } }" class="text-weight-bold">Ir a informar la ejecución</router-link>
    </note-banner>
    <div class="row q-col-gutter-md">
      <q-input v-model="form.fecha" class="col-12 col-sm-6" outlined dense type="date" stack-label label="Fecha *" :rules="[requerido, noFutura]">
        <template #append><boton-dictado v-model="form.fecha" tipo="fecha" /></template>
      </q-input>
      <q-input v-model.number="form.cantidad" class="col-12 col-sm-6" outlined dense type="number" min="0" step="0.1" label="Cantidad *" suffix="L" :rules="[mayorQueCero]">
        <template #append><boton-dictado v-model="form.cantidad" tipo="numero" /></template>
      </q-input>
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
      :disable="!opcionesItinerario.length"
      :rules="[requerido]">
      <template #append><boton-dictado v-model="form.itinerarioId" tipo="opcion" :opciones="opcionesItinerario" emit-value :disable="!opcionesItinerario.length" /></template>
    </q-select>
    <q-input v-model="form.sustento" outlined dense label="Sustento (vale, declaración…)">
      <template #append><boton-dictado v-model="form.sustento" /></template>
    </q-input>
  </form-dialog>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useBorrador } from 'src/composables/useBorrador'
import { actualizarCombustible, registrarCombustible } from 'src/services/acciones'
import { itinerariosDeVehiculo } from 'src/services/combustible'
import { FECHA_CORTE } from 'src/config/demo'
import { fecha as formatoFecha } from 'src/utils/formato'
import { mayorQueCero, noFutura, requerido } from 'src/utils/validaciones'


const props = defineProps({
  modelValue: { type: Boolean, default: false },
  vehiculo: { type: Object, required: true },
  // null = registro nuevo.
  registro: { type: Object, default: null },
  // Recorrido cuyo consumo se declara (p. ej. desde Itinerarios): abre el formulario como consumo de ese recorrido.
  itinerarioInicial: { type: String, default: null }
})

const emit = defineEmits(['update:modelValue'])
const $q = useQuasar()

const { puedeAcceder } = usePerfil()
const form = reactive({ tipo: 'carga', fecha: FECHA_CORTE, cantidad: null, itinerarioId: null, sustento: '' })
const { modificado, fijar } = useBorrador(form)

// Recorridos realizados sin consumo declarado; al corregir un consumo se conserva su propio recorrido.
const opcionesItinerario = computed(() =>
  itinerariosDeVehiculo(props.vehiculo.id)
    .filter((it) => it.realizado && (it.consumoDeclaradoL == null || it.id === props.registro?.itinerarioId))
    .map((it) => ({ label: `${it.id} · ${formatoFecha(it.fecha)} · ${it.proposito}`, value: it.id }))
)

// Sin recorridos elegibles no se puede declarar un consumo: la opción se deshabilita y se explica la salida.
const opcionesTipo = computed(() => [
  { label: 'Carga al vehículo', value: 'carga' },
  { label: 'Consumo declarado en un recorrido', value: 'consumo', disable: !opcionesItinerario.value.length }
])

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  const r = props.registro
  const desdeRecorrido = !r && opcionesItinerario.value.some((o) => o.value === props.itinerarioInicial)
  Object.assign(form, {
    tipo: r?.tipo ?? (desdeRecorrido ? 'consumo' : 'carga'),
    fecha: r?.fecha ?? FECHA_CORTE,
    cantidad: r?.cantidad ?? null,
    itinerarioId: r?.itinerarioId ?? (desdeRecorrido ? props.itinerarioInicial : null),
    sustento: r?.sustento ?? ''
  })
  fijar()
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
