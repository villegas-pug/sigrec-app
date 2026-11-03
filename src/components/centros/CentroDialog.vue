<template>
  <form-dialog
    :model-value="modelValue"
    titulo="Registrar centro"
    subtitulo="Se registra el centro con los datos de su inmueble. Los datos faltantes quedan como información pendiente."
    :ancho="600"
    etiqueta-enviar="Registrar centro"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <div class="row q-col-gutter-md">
      <q-input v-model="form.nombre" class="col-12 col-sm-8" outlined dense label="Nombre del centro *" :rules="[requerido]">
        <template #append><boton-dictado v-model="form.nombre" /></template>
      </q-input>
      <q-input
        v-model="form.id"
        class="col-12 col-sm-4"
        outlined
        dense
        label="Código *"
        hint="3 letras, único; no se modifica después"
        maxlength="3"
        :rules="[requerido, codigoValido, codigoLibre]"
        @update:model-value="(v) => (form.id = String(v ?? '').toUpperCase())">
        <template #append><boton-dictado v-model="form.id" /></template>
      </q-input>
    </div>
    <div class="sg-kv__label">Inmueble donde funciona</div>
    <q-input v-model="form.direccion" outlined dense label="Dirección *" :rules="[requerido]">
      <template #append><boton-dictado v-model="form.direccion" /></template>
    </q-input>
    <q-option-group v-model="form.condicion" inline :options="OPCIONES_INMUEBLE" />
    <template v-if="form.condicion === 'alquilado'">
      <q-input v-model="form.arrendador" outlined dense label="Arrendador">
        <template #append><boton-dictado v-model="form.arrendador" local /></template>
      </q-input>
      <q-input v-model="form.contratoHasta" outlined dense type="date" stack-label label="Contrato vigente hasta">
        <template #append><boton-dictado v-model="form.contratoHasta" tipo="fecha" /></template>
      </q-input>
    </template>
  </form-dialog>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import { carPorId } from 'src/services/datos'
import { registrarCentro } from 'src/services/acciones'
import { OPCIONES_INMUEBLE } from 'src/config/catalogos'
import { requerido } from 'src/utils/validaciones'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'hecho'])
const $q = useQuasar()

const codigoValido = (v) => /^[A-Z]{3}$/.test(v) || 'Use 3 letras'
const codigoLibre = (v) => !carPorId(v) || 'Ya existe un centro con ese código'

const form = reactive({})

watch(() => props.modelValue, (abierto) => {
  if (abierto) Object.assign(form, { nombre: '', id: '', direccion: '', condicion: 'propio', arrendador: '', contratoHasta: '' })
})

function guardar () {
  const alquilado = form.condicion === 'alquilado'
  const car = registrarCentro(
    { id: form.id, nombre: form.nombre },
    {
      direccion: form.direccion,
      condicion: form.condicion,
      arrendador: alquilado ? form.arrendador || null : null,
      contratoHasta: alquilado ? form.contratoHasta || null : null
    }
  )
  $q.notify({ type: 'positive', message: `${car.nombre} registrado. Continúe con sus ambientes.` })
  emit('update:modelValue', false)
  emit('hecho', car.id)
}
</script>
