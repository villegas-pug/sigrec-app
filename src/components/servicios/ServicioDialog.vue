<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="width: 560px; max-width: 94vw">
      <q-card-section>
        <h2 class="text-h6 text-weight-bold q-my-none">{{ servicio ? 'Actualizar ficha del servicio' : 'Registrar servicio' }}</h2>
        <p class="sg-muted q-mb-none">{{ local.id }} · {{ local.nombre }}</p>
      </q-card-section>
      <q-card-section>
        <q-form class="column q-gutter-y-md" @submit="guardar">
          <div v-if="!servicio" class="row q-col-gutter-md">
            <q-select v-model="form.tipo" class="col-12 col-sm-6" :options="opcionesTipo" emit-value map-options outlined dense label="Servicio *" :rules="[requerido]" />
            <q-select v-model="form.periodicidad" class="col-12 col-sm-6" :options="OPCIONES_PERIODICIDAD" emit-value map-options outlined dense label="Periodicidad *" />
          </div>
          <q-input v-model="form.proveedor" outlined dense label="Proveedor *" :rules="[requerido]" />
          <q-input v-model="form.suministro" outlined dense label="N.º de suministro o contrato" />
          <q-input v-model="form.contratacion" outlined dense label="Contratación" hint="Ej.: a nombre del arrendador, pago por el CAR" />
          <q-input v-model="form.observaciones" outlined dense type="textarea" autogrow label="Observaciones de instalación" />
          <div class="row justify-end q-gutter-sm">
            <q-btn flat color="secondary" label="Cancelar" v-close-popup />
            <q-btn unelevated color="primary" type="submit" :label="servicio ? 'Guardar cambios' : 'Registrar servicio'" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import { actualizarServicio, registrarServicio } from 'src/services/acciones'
import { TIPOS_SERVICIO } from 'src/config/catalogos'

const OPCIONES_PERIODICIDAD = [{ label: 'Mensual', value: 'mensual' }, { label: 'Trimestral', value: 'trimestral' }]

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  local: { type: Object, required: true },
  // null = alta de uno de los tipos aún no registrados.
  servicio: { type: Object, default: null },
  tiposDisponibles: { type: Array, default: () => [] },
  tipoInicial: { type: String, default: null }
})

const emit = defineEmits(['update:modelValue', 'hecho'])
const $q = useQuasar()

const requerido = (v) => !!v || 'Campo obligatorio'
const opcionesTipo = computed(() => props.tiposDisponibles.map((t) => ({ label: TIPOS_SERVICIO[t], value: t })))

const form = reactive({})

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  const s = props.servicio
  Object.assign(form, {
    tipo: s?.tipo ?? props.tipoInicial ?? props.tiposDisponibles[0] ?? null,
    periodicidad: s?.periodicidad ?? 'mensual',
    proveedor: s?.proveedor ?? '',
    suministro: s?.suministro ?? '',
    contratacion: s?.contratacion ?? '',
    observaciones: s?.observaciones ?? ''
  })
})

function guardar () {
  const datos = {
    proveedor: form.proveedor,
    suministro: form.suministro || 'No informado',
    contratacion: form.contratacion || 'No informada',
    observaciones: form.observaciones || null
  }
  let id
  if (props.servicio) {
    actualizarServicio(props.servicio, datos)
    id = props.servicio.id
  } else {
    id = registrarServicio(props.local, { tipo: form.tipo, periodicidad: form.periodicidad, ...datos }).id
  }
  $q.notify({ type: 'positive', message: props.servicio ? 'Ficha del servicio actualizada.' : `Servicio de ${TIPOS_SERVICIO[form.tipo]} registrado.` })
  emit('update:modelValue', false)
  emit('hecho', id)
}
</script>
