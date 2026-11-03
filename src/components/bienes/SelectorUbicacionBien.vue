<template>
  <div class="column q-gutter-y-md">
    <div class="row q-col-gutter-md">
      <q-select
        :model-value="carId"
        class="col-12 col-sm-6"
        :options="opcionesCar"
        emit-value
        map-options
        outlined
        dense
        label="Centro *"
        :readonly="ubicacionFija"
        :rules="[requerido]"
        @update:model-value="alCambiarCentro"
      />
      <q-select
        :model-value="ambienteId"
        class="col-12 col-sm-6"
        :options="opcionesAmbiente"
        emit-value
        map-options
        outlined
        dense
        label="Ambiente *"
        :readonly="ubicacionFija"
        :disable="!carId"
        :hint="carId ? '' : 'Elija primero el centro.'"
        :rules="[requerido]"
        @update:model-value="alCambiarAmbiente"
      />
    </div>

    <q-select
      :model-value="modelValue"
      :options="opcionesBien"
      :multiple="multiple"
      :use-chips="multiple"
      emit-value
      map-options
      outlined
      dense
      :label="multiple ? 'Bienes afectados *' : 'Bien *'"
      :disable="!ambienteId"
      :hint="hintBien"
      :rules="[reglaBien]"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <template #option="{ itemProps, opt }">
        <q-item v-bind="itemProps">
          <q-item-section>
            <q-item-label>{{ opt.label }}</q-item-label>
            <q-item-label caption>
              {{ condicion(opt.bien.condicion).label }} · {{ SITUACIONES[opt.bien.situacion].label }}<template v-if="opt.bien.asociadoA"> · componente de {{ opt.bien.asociadoA.bienId }}</template>
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
  </div>
</template>

<script setup>
// Selección jerárquica Centro › Ambiente › Bien. Cambiar un nivel limpia los inferiores,
// de modo que no se puede quedar con un bien que no pertenece a la ubicación mostrada.
import { computed, watch } from 'vue'
import { usePerfil } from 'src/composables/usePerfil'
import { ambientesDeCar, bienesDeAmbiente } from 'src/services/datos'
import { SITUACIONES, condicion } from 'src/config/catalogos'
import { requerido } from 'src/utils/validaciones'
import { plural } from 'src/utils/formato'

const props = defineProps({
  // Bien (id) o, con `multiple`, arreglo de ids.
  modelValue: { type: [String, Array], default: null },
  carId: { type: String, default: null },
  ambienteId: { type: String, default: null },
  multiple: { type: Boolean, default: false },
  // Qué bienes se pueden elegir. Por defecto, los activos.
  filtro: { type: Function, default: (b) => b.situacion === 'activo' },
  // Centro y ambiente solo se muestran (p. ej. al corregir un hecho ya registrado).
  ubicacionFija: { type: Boolean, default: false },
  sinCandidatos: { type: String, default: 'No hay bienes elegibles en este ambiente.' }
})

const emit = defineEmits(['update:modelValue', 'update:carId', 'update:ambienteId'])
const { carsEnAmbito } = usePerfil()

const vacio = () => (props.multiple ? [] : null)

const opcionesCar = computed(() => carsEnAmbito.value.map((c) => ({ label: c.nombre, value: c.id })))

// Un ambiente sin bienes elegibles se muestra deshabilitado, con su conteo.
const opcionesAmbiente = computed(() =>
  (props.carId ? ambientesDeCar(props.carId) : []).map((a) => {
    const n = bienesDeAmbiente(a.id).filter(props.filtro).length
    return { label: `${a.nombre} (${plural(n, 'bien elegible', 'bienes elegibles')})`, value: a.id, disable: n === 0 && !props.ubicacionFija }
  })
)

const bienesElegibles = computed(() => (props.ambienteId ? bienesDeAmbiente(props.ambienteId).filter(props.filtro) : []))
const opcionesBien = computed(() => bienesElegibles.value.map((b) => ({ label: `${b.nombre} · ${b.id}`, value: b.id, bien: b })))

const hintBien = computed(() => {
  if (!props.ambienteId) return 'Elija primero el ambiente.'
  return bienesElegibles.value.length ? '' : props.sinCandidatos
})

const reglaBien = (v) => (props.multiple ? (v?.length > 0 || 'Indique al menos un bien') : requerido(v))

function alCambiarCentro (id) {
  emit('update:carId', id)
  emit('update:ambienteId', null)
  emit('update:modelValue', vacio())
}

function alCambiarAmbiente (id) {
  emit('update:ambienteId', id)
  emit('update:modelValue', vacio())
}

// Con un único centro en el ámbito no hay nada que decidir; el ambiente nunca se preselecciona.
watch([() => props.carId, carsEnAmbito], () => {
  if (!props.carId && !props.ubicacionFija && carsEnAmbito.value.length === 1) emit('update:carId', carsEnAmbito.value[0].id)
}, { immediate: true })
</script>
