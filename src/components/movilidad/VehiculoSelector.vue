<template>
  <section-card :titulo="vehiculo ? `${vehiculo.tipo} · ${vehiculo.id}` : 'Movilidad'" :subtitulo="vehiculo ? `${carPorId(vehiculo.carId).nombre} · ${plural(vehiculos.length, 'vehículo en el ámbito', 'vehículos en el ámbito')}` : 'Sin vehículos en el ámbito del perfil'">
    <template v-if="vehiculos.length > 1" #acciones>
      <q-select
        :model-value="modelValue"
        :options="opcionesVehiculo"
        emit-value
        map-options
        outlined
        dense
        label="Vehículo"
        style="min-width: min(260px, 100%)"
        @update:model-value="$emit('update:modelValue', $event)"
      >
        <template #append><boton-dictado :model-value="modelValue" tipo="opcion" :opciones="opcionesVehiculo" emit-value @update:model-value="$emit('update:modelValue', $event)" /></template>
      </q-select>
    </template>
    <div v-if="vehiculo" class="sg-kv-grid">
      <key-value etiqueta="Placa">{{ vehiculo.placa }}</key-value>
      <key-value etiqueta="Chofer relacionado">
        <template v-if="vehiculo.chofer">{{ vehiculo.chofer }}</template>
        <status-chip v-else tono="si" label="No asignado" />
      </key-value>
      <key-value etiqueta="Combustible · unidad">{{ vehiculo.combustible }} · {{ unidad }}</key-value>
      <key-value etiqueta="Rendimiento de referencia" nota="Orientativo; no es norma de consumo">
        <template v-if="vehiculo.rendimientoKmL">{{ vehiculo.rendimientoKmL }} km/L</template>
        <status-chip v-else tono="si" label="No informado" />
      </key-value>
      <div class="row items-center"><status-chip tono="pv" label="Qué se controla del combustible · Por validar" /></div>
    </div>
  </section-card>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed } from 'vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import KeyValue from 'components/common/KeyValue.vue'
import { carPorId, vehiculoPorId } from 'src/services/datos'
import { plural } from 'src/utils/formato'

const props = defineProps({
  modelValue: { type: String, default: null },
  vehiculos: { type: Array, required: true }
})

defineEmits(['update:modelValue'])

const opcionesVehiculo = computed(() => props.vehiculos.map((v) => ({ label: `${v.id} · ${carPorId(v.carId).nombre}`, value: v.id })))
const vehiculo = computed(() => (props.modelValue ? vehiculoPorId(props.modelValue) : null))
const unidad = computed(() => (vehiculo.value?.unidad === 'L' ? 'litros' : vehiculo.value?.unidad))
</script>
