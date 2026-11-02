<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="width: 560px; max-width: 94vw">
      <q-card-section>
        <h2 class="text-h6 text-weight-bold q-my-none">{{ vehiculo ? 'Actualizar vehículo' : 'Registrar vehículo' }}</h2>
        <p class="sg-muted q-mb-none">{{ vehiculo ? vehiculo.id : 'Los campos con * son obligatorios' }}</p>
      </q-card-section>
      <q-card-section>
        <q-form class="column q-gutter-y-md" @submit="guardar">
          <div class="row q-col-gutter-md">
            <q-select v-if="!vehiculo" v-model="form.carId" class="col-12 col-sm-6" :options="opcionesCar" emit-value map-options outlined dense label="Centro *" :rules="[requerido]" />
            <q-input v-model="form.tipo" class="col-12 col-sm-6" outlined dense label="Tipo *" hint="Ej.: Camioneta, Minivan" :rules="[requerido]" />
            <q-input v-model="form.placa" class="col-12 col-sm-6" outlined dense label="Placa *" :rules="[requerido, placaLibre]" />
            <q-input v-model="form.chofer" class="col-12 col-sm-6" outlined dense label="Chofer relacionado" hint="Vacío si no está asignado" />
            <q-input v-model="form.combustible" class="col-12 col-sm-6" outlined dense label="Combustible *" hint="Ej.: Gasohol 90, Diésel B5" :rules="[requerido]" />
            <q-input v-model.number="form.rendimientoKmL" class="col-12 col-sm-6" outlined dense type="number" min="0" step="0.1" label="Rendimiento de referencia (km/L)" hint="Vacío si no se conoce" />
          </div>
          <div class="row justify-end q-gutter-sm">
            <q-btn flat color="secondary" label="Cancelar" v-close-popup />
            <q-btn unelevated color="primary" type="submit" :label="vehiculo ? 'Guardar cambios' : 'Registrar vehículo'" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import { usePerfil } from 'src/composables/usePerfil'
import { db } from 'src/services/datos'
import { actualizarVehiculo, numeroONulo, registrarVehiculo, vehiculoSugerido } from 'src/services/acciones'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // null = alta de un vehículo nuevo.
  vehiculo: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'hecho'])
const $q = useQuasar()
const { carsEnAmbito } = usePerfil()

const opcionesCar = computed(() => carsEnAmbito.value.map((c) => ({ label: c.nombre, value: c.id })))
const requerido = (v) => !!v || 'Campo obligatorio'
const normalizarPlaca = (v) => String(v ?? '').trim().toUpperCase()
const placaLibre = (v) =>
  !db.vehiculos.some((x) => x.id !== props.vehiculo?.id && normalizarPlaca(x.placa) === normalizarPlaca(v)) || 'Ya existe un vehículo con esa placa'

const form = reactive({})

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  const v = props.vehiculo
  Object.assign(form, {
    carId: v?.carId ?? opcionesCar.value[0]?.value ?? null,
    tipo: v?.tipo ?? '',
    placa: v?.placa ?? '',
    chofer: v?.chofer ?? '',
    combustible: v?.combustible ?? '',
    rendimientoKmL: v?.rendimientoKmL ?? null
  })
})

function guardar () {
  const datos = {
    tipo: form.tipo,
    placa: normalizarPlaca(form.placa),
    chofer: form.chofer || null,
    combustible: form.combustible,
    rendimientoKmL: numeroONulo(form.rendimientoKmL)
  }
  let id
  if (props.vehiculo) {
    actualizarVehiculo(props.vehiculo, datos)
    id = props.vehiculo.id
  } else {
    id = registrarVehiculo({ id: vehiculoSugerido(form.carId), carId: form.carId, ...datos }).id
  }
  $q.notify({ type: 'positive', message: props.vehiculo ? `Vehículo ${id} actualizado.` : `Vehículo ${id} registrado.` })
  emit('update:modelValue', false)
  emit('hecho', id)
}
</script>
