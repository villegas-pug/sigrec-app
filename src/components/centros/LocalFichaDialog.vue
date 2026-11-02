<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="width: 680px; max-width: 94vw">
      <q-card-section>
        <h2 class="text-h6 text-weight-bold q-my-none">Actualizar ficha del local</h2>
        <p class="sg-muted q-mb-none">{{ local.id }} · los campos vacíos quedan como información pendiente.</p>
      </q-card-section>
      <q-card-section>
        <q-form class="column q-gutter-y-md" @submit="guardar">
          <q-input v-model="form.direccion" outlined dense label="Dirección" />
          <div class="row q-col-gutter-md">
            <q-input v-model="form.fundacion" class="col-12 col-sm-4" outlined dense label="Referencia de fundación" />
            <q-input v-model="form.fundacionNota" class="col-12 col-sm-8" outlined dense label="Sustento de la referencia" />
          </div>
          <q-option-group v-model="form.condicion" inline :options="[{ label: 'Propio', value: 'propio' }, { label: 'Alquilado', value: 'alquilado' }]" />
          <div v-if="form.condicion === 'alquilado'" class="row q-col-gutter-md">
            <q-input v-model="form.arrendador" class="col-12 col-sm-7" outlined dense label="Arrendador" />
            <q-input v-model="form.contratoHasta" class="col-12 col-sm-5" outlined dense type="date" stack-label label="Contrato vigente hasta" />
          </div>
          <q-input v-model="form.litigios" outlined dense label="Litigios conocidos" />

          <div class="sg-kv__label">Construcción e infraestructura</div>
          <div class="row q-col-gutter-md">
            <q-input v-model="form.material" class="col-12 col-sm-6" outlined dense label="Material de construcción" />
            <q-input v-model="form.antiguedad" class="col-12 col-sm-6" outlined dense label="Antigüedad" hint="Ej.: Aprox. 30 años" />
            <q-input v-model.number="form.pisos" class="col-6 col-sm-3" outlined dense type="number" min="1" label="Pisos" />
            <q-input v-model.number="form.areaM2" class="col-6 col-sm-3" outlined dense type="number" min="0" label="Área (m²)" />
            <q-select v-model="form.estado" class="col-12 col-sm-6" :options="OPCIONES_CONDICION" emit-value map-options clearable outlined dense label="Estado general" />
          </div>
          <q-input v-model="form.caracteristicas" outlined dense type="textarea" autogrow label="Características" />

          <div class="row justify-end q-gutter-sm">
            <q-btn flat color="secondary" label="Cancelar" v-close-popup />
            <q-btn unelevated color="primary" type="submit" label="Guardar cambios" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import { actualizarLocal, numeroONulo } from 'src/services/acciones'
import { OPCIONES_CONDICION } from 'src/config/catalogos'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  local: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue'])
const $q = useQuasar()

const form = reactive({})

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  const { local } = props
  const c = local.construccion
  Object.assign(form, {
    direccion: local.direccion ?? '',
    fundacion: local.fundacion?.referencia ?? '',
    fundacionNota: local.fundacion?.nota ?? '',
    condicion: local.condicion,
    arrendador: local.arrendador ?? '',
    contratoHasta: local.contratoHasta ?? '',
    litigios: local.litigios ?? '',
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
  actualizarLocal(props.local, {
    direccion: form.direccion || null,
    fundacion: { referencia: form.fundacion || null, nota: form.fundacionNota || null },
    condicion: form.condicion,
    arrendador: alquilado ? form.arrendador || null : null,
    contratoHasta: alquilado ? form.contratoHasta || null : null,
    litigios: form.litigios || null,
    construccion: {
      ...props.local.construccion,
      material: form.material || null,
      antiguedad: form.antiguedad || null,
      pisos: numeroONulo(form.pisos),
      areaM2: numeroONulo(form.areaM2) || null,
      estado: form.estado || null,
      caracteristicas: form.caracteristicas || null
    }
  })
  $q.notify({ type: 'positive', message: 'Ficha del local actualizada.' })
  emit('update:modelValue', false)
}
</script>
