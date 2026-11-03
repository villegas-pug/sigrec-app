<template>
  <form-dialog
    :model-value="modelValue"
    titulo="Actualizar ficha del centro"
    :subtitulo="`${centro.id} · los campos vacíos quedan como información pendiente.`"
    :ancho="680"
    etiqueta-enviar="Guardar cambios"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <q-input v-model="form.nombre" outlined dense label="Nombre del centro *" :rules="[requerido]">
      <template #append><boton-dictado v-model="form.nombre" /></template>
    </q-input>

    <div class="sg-kv__label">Inmueble donde funciona</div>
    <q-input v-model="form.direccion" outlined dense label="Dirección">
      <template #append><boton-dictado v-model="form.direccion" /></template>
    </q-input>
    <div class="row q-col-gutter-md">
      <q-input v-model="form.fundacion" class="col-12 col-sm-4" outlined dense label="Referencia de fundación">
        <template #append><boton-dictado v-model="form.fundacion" /></template>
      </q-input>
      <q-input v-model="form.fundacionNota" class="col-12 col-sm-8" outlined dense label="Sustento de la referencia">
        <template #append><boton-dictado v-model="form.fundacionNota" /></template>
      </q-input>
    </div>
    <q-option-group v-model="form.condicion" inline :options="OPCIONES_INMUEBLE" />
    <div v-if="form.condicion === 'alquilado'" class="row q-col-gutter-md">
      <q-input v-model="form.arrendador" class="col-12 col-sm-7" outlined dense label="Arrendador">
        <template #append><boton-dictado v-model="form.arrendador" local /></template>
      </q-input>
      <q-input v-model="form.contratoHasta" class="col-12 col-sm-5" outlined dense type="date" stack-label label="Contrato vigente hasta">
        <template #append><boton-dictado v-model="form.contratoHasta" tipo="fecha" /></template>
      </q-input>
    </div>
    <q-input v-model="form.litigios" outlined dense label="Litigios conocidos">
      <template #append><boton-dictado v-model="form.litigios" /></template>
    </q-input>

    <div class="sg-kv__label">Construcción e infraestructura</div>
    <div class="row q-col-gutter-md">
      <q-input v-model="form.material" class="col-12 col-sm-6" outlined dense label="Material de construcción">
        <template #append><boton-dictado v-model="form.material" /></template>
      </q-input>
      <q-input v-model="form.antiguedad" class="col-12 col-sm-6" outlined dense label="Antigüedad" hint="Ej.: Aprox. 30 años">
        <template #append><boton-dictado v-model="form.antiguedad" /></template>
      </q-input>
      <q-input v-model.number="form.pisos" class="col-6 col-sm-3" outlined dense type="number" min="1" label="Pisos">
        <template #append><boton-dictado v-model="form.pisos" tipo="numero" /></template>
      </q-input>
      <q-input v-model.number="form.areaM2" class="col-6 col-sm-3" outlined dense type="number" min="0" label="Área (m²)">
        <template #append><boton-dictado v-model="form.areaM2" tipo="numero" /></template>
      </q-input>
      <q-select v-model="form.estado" class="col-12 col-sm-6" :options="OPCIONES_CONDICION" emit-value map-options clearable outlined dense label="Estado general">
        <template #append><boton-dictado v-model="form.estado" tipo="opcion" :opciones="OPCIONES_CONDICION" emit-value /></template>
      </q-select>
    </div>
    <q-input v-model="form.caracteristicas" outlined dense type="textarea" autogrow label="Características">
      <template #append><boton-dictado v-model="form.caracteristicas" /></template>
    </q-input>
  </form-dialog>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import { actualizarCentro, numeroONulo } from 'src/services/acciones'
import { OPCIONES_CONDICION, OPCIONES_INMUEBLE } from 'src/config/catalogos'
import { requerido } from 'src/utils/validaciones'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  centro: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue'])
const $q = useQuasar()

const form = reactive({})

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  const { centro } = props
  const i = centro.inmueble
  const c = i.construccion
  Object.assign(form, {
    nombre: centro.nombre,
    direccion: i.direccion ?? '',
    fundacion: i.fundacion?.referencia ?? '',
    fundacionNota: i.fundacion?.nota ?? '',
    condicion: i.condicion,
    arrendador: i.arrendador ?? '',
    contratoHasta: i.contratoHasta ?? '',
    litigios: i.litigios ?? '',
    material: c.material ?? '',
    antiguedad: c.antiguedad ?? '',
    pisos: c.pisos,
    areaM2: c.areaM2,
    estado: c.estado,
    caracteristicas: c.caracteristicas ?? ''
  })
})

function guardar () {
  const alquilado = form.condicion === 'alquilado'
  actualizarCentro(props.centro, {
    nombre: form.nombre,
    inmueble: {
      direccion: form.direccion || null,
      fundacion: { referencia: form.fundacion || null, nota: form.fundacionNota || null },
      condicion: form.condicion,
      arrendador: alquilado ? form.arrendador || null : null,
      contratoHasta: alquilado ? form.contratoHasta || null : null,
      litigios: form.litigios || null,
      construccion: {
        ...props.centro.inmueble.construccion,
        material: form.material || null,
        antiguedad: form.antiguedad || null,
        pisos: numeroONulo(form.pisos),
        areaM2: numeroONulo(form.areaM2) || null,
        estado: form.estado || null,
        caracteristicas: form.caracteristicas || null
      }
    }
  })
  $q.notify({ type: 'positive', message: 'Ficha del centro actualizada.' })
  emit('update:modelValue', false)
}
</script>
