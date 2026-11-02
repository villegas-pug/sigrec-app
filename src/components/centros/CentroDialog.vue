<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="width: 600px; max-width: 94vw">
      <q-card-section>
        <h2 class="text-h6 text-weight-bold q-my-none">Registrar centro</h2>
        <p class="sg-muted q-mb-none">Se registra el centro y el inmueble donde funciona. Los datos faltantes quedan como información pendiente.</p>
      </q-card-section>
      <q-card-section>
        <q-form class="column q-gutter-y-md" @submit="guardar">
          <div class="row q-col-gutter-md">
            <q-input v-model="form.nombre" class="col-12 col-sm-8" outlined dense label="Nombre del CAR *" :rules="[requerido]" />
            <q-input v-model="form.id" class="col-12 col-sm-4" outlined dense label="Código *" hint="3 letras, único" maxlength="3" :rules="[requerido, codigoValido, codigoLibre]" @update:model-value="(v) => (form.id = String(v ?? '').toUpperCase())" />
          </div>
          <div class="sg-kv__label">Local</div>
          <q-input v-model="form.direccion" outlined dense label="Dirección *" :rules="[requerido]" />
          <q-option-group v-model="form.condicion" inline :options="OPCIONES_INMUEBLE" />
          <template v-if="form.condicion === 'alquilado'">
            <q-input v-model="form.arrendador" outlined dense label="Arrendador" />
            <q-input v-model="form.contratoHasta" outlined dense type="date" stack-label label="Contrato vigente hasta" />
          </template>
          <note-banner tono="ne" icono="info">Para la demostración, cada CAR se representa con un local (regla provisional).</note-banner>
          <div class="row justify-end q-gutter-sm">
            <q-btn flat color="secondary" label="Cancelar" v-close-popup />
            <q-btn unelevated color="primary" type="submit" label="Registrar centro" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import NoteBanner from 'components/common/NoteBanner.vue'
import { carPorId } from 'src/services/datos'
import { registrarCentro } from 'src/services/acciones'

const OPCIONES_INMUEBLE = [{ label: 'Propio', value: 'propio' }, { label: 'Alquilado', value: 'alquilado' }]

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'hecho'])
const $q = useQuasar()

const requerido = (v) => !!v || 'Campo obligatorio'
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
