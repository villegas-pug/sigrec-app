<template>
  <form-dialog
    :model-value="modelValue"
    :icono-enviar="vehiculo ? 'save' : 'add'"
    :titulo="vehiculo ? 'Actualizar vehículo' : 'Registrar vehículo'"
    :subtitulo="vehiculo ? vehiculo.id : 'Los campos con * son obligatorios'"
    :etiqueta-enviar="vehiculo ? 'Guardar cambios' : 'Registrar vehículo'"
    :modificado="modificado"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <div class="row q-col-gutter-md">
      <q-select v-model="form.carId" class="col-12 col-sm-6" :options="opcionesCar" emit-value map-options outlined dense label="Centro *" :rules="[requerido]">
        <template #append><boton-dictado v-model="form.carId" tipo="opcion" :opciones="opcionesCar" emit-value /></template>
      </q-select>
      <q-input v-model="form.tipo" class="col-12 col-sm-6" outlined dense label="Tipo *" hint="Ej.: Camioneta, Minivan" :rules="[requerido]">
        <template #append><boton-dictado v-model="form.tipo" /></template>
      </q-input>
      <q-input v-model="form.placa" class="col-12 col-sm-6" outlined dense label="Placa *" :rules="[requerido, placaLibre]">
        <template #append><boton-dictado v-model="form.placa" tipo="codigo" /></template>
      </q-input>
      <q-input v-model="form.chofer" class="col-12 col-sm-6" outlined dense label="Chofer relacionado" hint="Vacío si no está asignado">
        <template #append><boton-dictado v-model="form.chofer" local /></template>
      </q-input>
      <q-input v-model="form.combustible" class="col-12 col-sm-6" outlined dense label="Combustible *" hint="Ej.: Gasohol 90, Diésel B5" :rules="[requerido]">
        <template #append><boton-dictado v-model="form.combustible" /></template>
      </q-input>
      <q-input v-model.number="form.rendimientoKmL" class="col-12 col-sm-6" outlined dense type="number" min="0" step="0.1" label="Rendimiento de referencia (km/L)" hint="Vacío si no se conoce">
        <template #append><boton-dictado v-model="form.rendimientoKmL" tipo="numero" /></template>
      </q-input>
    </div>
    <div class="sg-kv__label">Estado y mantenimiento</div>
    <div class="row q-col-gutter-md">
      <q-select v-model="form.estadoOperativo" class="col-12 col-sm-6" :options="OPCIONES_ESTADO_VEHICULO" emit-value map-options clearable outlined dense label="Estado operativo" hint="Vacío si no se ha informado">
        <template #append><boton-dictado v-model="form.estadoOperativo" tipo="opcion" :opciones="OPCIONES_ESTADO_VEHICULO" emit-value /></template>
      </q-select>
      <!-- El último mantenimiento no se captura aquí: sale de los mantenimientos registrados (SPEC 011). -->
      <div class="col-12 col-sm-6 column justify-center">
        <span class="sg-kv__label">Último mantenimiento</span>
        <span v-if="ultimaFecha">{{ fecha(ultimaFecha) }}</span>
        <span v-else class="sg-muted">Sin mantenimientos registrados</span>
        <span class="sg-muted">Se actualiza con «Registrar mantenimiento» del vehículo.</span>
      </div>
      <template v-if="requiereAtencion">
        <q-input v-model="form.motivoMantenimiento" class="col-12 col-sm-8" outlined dense label="Motivo del mantenimiento o de la detención" hint="Ej.: frenos, caja de cambios, falta de presupuesto">
          <template #append><boton-dictado v-model="form.motivoMantenimiento" /></template>
        </q-input>
        <q-input v-model.number="form.presupuestoEstimado" class="col-12 col-sm-4" outlined dense type="number" min="0" step="0.01" label="Presupuesto estimado (S/)" hint="Vacío si aún no se estimó" :rules="[opcionalMayorQueCero]">
          <template #append><boton-dictado v-model="form.presupuestoEstimado" tipo="numero" /></template>
        </q-input>
      </template>
    </div>
    <note-banner v-if="vehiculo && form.carId !== vehiculo.carId" tono="in">
      Al cambiar de centro el vehículo conserva su código ({{ vehiculo.id }}) y sus itinerarios.
    </note-banner>
  </form-dialog>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import { useBorrador } from 'src/composables/useBorrador'
import { usePerfil } from 'src/composables/usePerfil'
import { db } from 'src/services/datos'
import { controlDeVehiculo } from 'src/services/mantenimientos'
import { FECHA_CORTE } from 'src/config/demo'
import { fecha } from 'src/utils/formato'
import { actualizarVehiculo, numeroONulo, registrarVehiculo, vehiculoSugerido } from 'src/services/acciones'
import { ESTADOS_VEHICULO_CON_ATENCION, OPCIONES_ESTADO_VEHICULO } from 'src/config/catalogos'
import { opcionalMayorQueCero, requerido } from 'src/utils/validaciones'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // null = alta de un vehículo nuevo.
  vehiculo: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'hecho'])
const $q = useQuasar()
const { carsEnAmbito } = usePerfil()

const ultimaFecha = computed(() => (props.vehiculo ? controlDeVehiculo(props.vehiculo, FECHA_CORTE).ultimaFecha : null))

const opcionesCar = computed(() => carsEnAmbito.value.map((c) => ({ label: c.nombre, value: c.id })))
const normalizarPlaca = (v) => String(v ?? '').trim().toUpperCase()
const placaLibre = (v) =>
  !db.vehiculos.some((x) => x.id !== props.vehiculo?.id && !x.anulacion && normalizarPlaca(x.placa) === normalizarPlaca(v)) || 'Ya existe un vehículo con esa placa'

const form = reactive({})
const { modificado, fijar } = useBorrador(form)

// El motivo y el presupuesto solo aplican si el vehículo requiere mantenimiento o está detenido.
const requiereAtencion = computed(() => ESTADOS_VEHICULO_CON_ATENCION.includes(form.estadoOperativo))

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  const v = props.vehiculo
  Object.assign(form, {
    carId: v?.carId ?? opcionesCar.value[0]?.value ?? null,
    tipo: v?.tipo ?? '',
    placa: v?.placa ?? '',
    chofer: v?.chofer ?? '',
    combustible: v?.combustible ?? '',
    rendimientoKmL: v?.rendimientoKmL ?? null,
    estadoOperativo: v?.estadoOperativo ?? null,
    motivoMantenimiento: v?.mantenimiento?.motivo ?? '',
    presupuestoEstimado: v?.mantenimiento?.presupuestoEstimado ?? null
  })
  fijar()
})

function guardar () {
  const conAtencion = requiereAtencion.value
  const mantenimiento = {
    motivo: conAtencion ? form.motivoMantenimiento?.trim() || null : null,
    presupuestoEstimado: conAtencion ? numeroONulo(form.presupuestoEstimado) : null
  }
  const datos = {
    carId: form.carId,
    tipo: form.tipo,
    placa: normalizarPlaca(form.placa),
    chofer: form.chofer || null,
    combustible: form.combustible,
    rendimientoKmL: numeroONulo(form.rendimientoKmL),
    estadoOperativo: form.estadoOperativo || null,
    mantenimiento: Object.values(mantenimiento).some((x) => x != null) ? mantenimiento : null
  }
  let id
  if (props.vehiculo) {
    actualizarVehiculo(props.vehiculo, datos)
    id = props.vehiculo.id
  } else {
    id = registrarVehiculo({ id: vehiculoSugerido(form.carId), ...datos }).id
  }
  $q.notify({ type: 'positive', message: props.vehiculo ? `Vehículo ${id} actualizado.` : `Vehículo ${id} registrado.` })
  emit('update:modelValue', false)
  emit('hecho', id)
}
</script>
