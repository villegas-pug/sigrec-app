<template>
  <form-dialog
    :model-value="modelValue"
    icono-enviar="add"
    titulo="Registrar centro"
    subtitulo="Se registra el centro con los datos de su inmueble. Los datos faltantes quedan como información pendiente."
    :ancho="600"
    etiqueta-enviar="Registrar centro"
    :modificado="modificado"
    @update:model-value="$emit('update:modelValue', $event)"
    :deshabilitar-enviar="guardando"
    @enviar="guardar"
  >
    <div v-if="Object.keys(errores).length" class="sg-box" role="alert">
      <div>Revise los siguientes campos:</div>
      <ul class="q-my-xs q-pl-md">
        <li v-for="(mensaje, campo) in errores" :key="campo">{{ etiquetasError[campo] ?? campo }}: {{ mensaje }}</li>
      </ul>
    </div>
    <div class="row q-col-gutter-md">
      <q-input v-model="form.nombre" class="col-12 col-sm-8" outlined dense label="Nombre del centro *" :rules="[requerido, unidadOrganicaSeleccionada]" :error="!!(errores.nombre || errores.unidadOrganicaId)" :error-message="errores.nombre || errores.unidadOrganicaId">
        <template #append>
          <boton-dictado v-model="form.nombre" />
          <unidad-organica-selector
            v-model="form.unidadOrganica"
            :busqueda-inicial="form.nombre"
            obligatoria
            :deshabilitado="guardando"
            @seleccionar="completarDesdeUnidad"
          >
            <template #activador="{ abrir, deshabilitado, seleccionada }">
              <q-btn
                type="button"
                flat
                round
                dense
                color="primary"
                icon="search"
                :disable="deshabilitado"
                :aria-label="seleccionada ? 'Cambiar unidad orgánica' : 'Buscar unidad orgánica'"
                @click="abrir"
              >
                <q-tooltip>{{ seleccionada ? 'Cambiar unidad orgánica' : 'Buscar unidad orgánica' }}</q-tooltip>
              </q-btn>
            </template>
          </unidad-organica-selector>
        </template>
      </q-input>
      <q-input
        v-model="form.id"
        class="col-12 col-sm-4"
        outlined
        dense
        label="Código *"
        hint="3 letras o números, único; no se modifica después"
        maxlength="3"
        :error="!!errores.id"
        :error-message="errores.id"
        :rules="[requerido, codigoValido, codigoLibre]"
        @update:model-value="(v) => (form.id = String(v ?? '').toUpperCase())">
        <template #append><boton-dictado v-model="form.id" /></template>
      </q-input>
    </div>
    <div class="sg-kv__label">Inmueble donde funciona</div>
    <q-input v-model="form.direccion" outlined dense label="Dirección *" :rules="[requerido]" :error="!!errores['inmueble.direccion']" :error-message="errores['inmueble.direccion']">
      <template #append><boton-dictado v-model="form.direccion" /></template>
    </q-input>
    <q-option-group v-model="form.condicion" inline :options="OPCIONES_INMUEBLE" />
    <template v-if="form.condicion === 'alquilado'">
      <q-input v-model="form.arrendador" outlined dense label="Arrendador" :error="!!errores['inmueble.arrendador']" :error-message="errores['inmueble.arrendador']">
        <template #append><boton-dictado v-model="form.arrendador" local /></template>
      </q-input>
      <q-input v-model="form.contratoHasta" outlined dense type="date" stack-label label="Contrato vigente hasta" :error="!!errores['inmueble.contratoHasta']" :error-message="errores['inmueble.contratoHasta']">
        <template #append><boton-dictado v-model="form.contratoHasta" tipo="fecha" /></template>
      </q-input>
    </template>
  </form-dialog>
</template>

<script setup>
import { useGuardado } from 'src/composables/useGuardado'
import BotonDictado from 'components/common/BotonDictado.vue'
import { reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import UnidadOrganicaSelector from './UnidadOrganicaSelector.vue'
import { useBorrador } from 'src/composables/useBorrador'
import { carPorId } from 'src/services/datos'
import { registrarCentro } from 'src/services/acciones'
import { OPCIONES_INMUEBLE } from 'src/config/catalogos'
import { requerido } from 'src/utils/validaciones'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'hecho'])
const $q = useQuasar()

const codigoValido = (v) => /^[A-Z0-9]{3}$/.test(v) || 'Use 3 letras o números'
const codigoLibre = (v) => !carPorId(v) || 'Ya existe un centro con ese código'
const unidadOrganicaSeleccionada = () => form.unidadOrganica?.id != null || 'Seleccione una unidad orgánica.'

const form = reactive({})
const errores = reactive({})
const etiquetasError = { id: 'Código', nombre: 'Nombre del centro', unidadOrganicaId: 'Unidad orgánica', 'inmueble.direccion': 'Dirección', 'inmueble.condicion': 'Condición del inmueble', 'inmueble.arrendador': 'Arrendador', 'inmueble.contratoHasta': 'Contrato vigente hasta' }
const { modificado, fijar } = useBorrador(form)
function limpiarErrores () { for (const campo of Object.keys(errores)) delete errores[campo] }
watch(() => form.id, () => { delete errores.id })
watch(() => form.nombre, () => { delete errores.nombre })
watch(() => form.unidadOrganica?.id, () => { delete errores.unidadOrganicaId })
watch(() => form.direccion, () => { delete errores['inmueble.direccion'] })
watch(() => form.condicion, () => { delete errores['inmueble.condicion'] })
watch(() => form.arrendador, () => { delete errores['inmueble.arrendador'] })
watch(() => form.contratoHasta, () => { delete errores['inmueble.contratoHasta'] })

function completarDesdeUnidad (unidad) {
  form.nombre = unidad.nombre ?? ''
  form.id = String(unidad.codigo ?? '').trim().toUpperCase()
  form.direccion = unidad.direccion ?? ''
}

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  limpiarErrores()
  Object.assign(form, { nombre: '', id: '', unidadOrganica: null, direccion: '', condicion: 'propio', arrendador: '', contratoHasta: '' })
  fijar()
})

const { guardando, guardar } = useGuardado(async () => {
  const alquilado = form.condicion === 'alquilado'
  limpiarErrores()
  let car
  try {
    car = await registrarCentro(
    { id: form.id, nombre: form.nombre, unidadOrganicaId: form.unidadOrganica.id },
    {
      direccion: form.direccion,
      condicion: form.condicion,
      arrendador: alquilado ? form.arrendador || null : null,
      contratoHasta: alquilado ? form.contratoHasta || null : null
    }
    )
  } catch (error) {
    if (error.campos) Object.assign(errores, error.campos)
    throw error
  }
  $q.notify({ type: 'positive', message: `${car.nombre} registrado. Continúe con sus módulos y ambientes.` })
  emit('update:modelValue', false)
  emit('hecho', car.id)
})
</script>
