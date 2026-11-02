<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="width: 560px; max-width: 94vw">
      <q-card-section>
        <h2 class="text-h6 text-weight-bold q-my-none">{{ ambiente ? 'Actualizar ambiente' : 'Registrar ambiente' }}</h2>
        <p class="sg-muted q-mb-none">{{ ambiente ? `${ambiente.nombre} · ${ambiente.id}` : `${local.id} · ${local.nombre}` }}</p>
      </q-card-section>
      <q-card-section>
        <q-form class="column q-gutter-y-md" @submit="guardar">
          <div class="row q-col-gutter-md">
            <q-input v-model="form.nombre" class="col-12 col-sm-8" outlined dense label="Nombre *" hint="Ej.: Dormitorio 3, Lavandería" :rules="[(v) => !!v || 'Campo obligatorio']" />
            <q-input v-model.number="form.piso" class="col-12 col-sm-4" outlined dense type="number" min="0" label="Piso" />
            <q-input v-model.number="form.areaM2" class="col-4" outlined dense type="number" min="0" label="Área (m²)" />
            <q-input v-model.number="form.puertas" class="col-4" outlined dense type="number" min="0" label="Puertas" />
            <q-input v-model.number="form.ventanas" class="col-4" outlined dense type="number" min="0" label="Ventanas" />
          </div>
          <div>
            <div class="sg-kv__label q-mb-xs">Condición *</div>
            <q-btn-toggle v-model="form.condicion" :options="OPCIONES_CONDICION" unelevated toggle-color="secondary" color="white" text-color="secondary" no-caps />
          </div>
          <q-input v-model="form.ultimoPintado" outlined dense type="month" stack-label label="Último pintado" hint="Vacío si no se conoce" />
          <div class="row justify-end q-gutter-sm">
            <q-btn flat color="secondary" label="Cancelar" v-close-popup />
            <q-btn unelevated color="primary" type="submit" :label="ambiente ? 'Guardar cambios' : 'Registrar ambiente'" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import { actualizarAmbiente, numeroONulo, registrarAmbiente } from 'src/services/acciones'
import { OPCIONES_CONDICION } from 'src/config/catalogos'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  local: { type: Object, required: true },
  // null = alta de un ambiente nuevo en el local.
  ambiente: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'hecho'])
const $q = useQuasar()

const form = reactive({})

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  const a = props.ambiente
  Object.assign(form, {
    nombre: a?.nombre ?? '',
    piso: a?.piso ?? 1,
    areaM2: a?.areaM2 ?? null,
    puertas: a?.puertas ?? null,
    ventanas: a?.ventanas ?? null,
    condicion: a?.condicion ?? 'bueno',
    ultimoPintado: a?.ultimoPintado ?? ''
  })
})

function guardar () {
  const datos = {
    nombre: form.nombre,
    piso: numeroONulo(form.piso),
    areaM2: numeroONulo(form.areaM2),
    puertas: numeroONulo(form.puertas),
    ventanas: numeroONulo(form.ventanas),
    condicion: form.condicion,
    ultimoPintado: form.ultimoPintado || null
  }
  let id
  if (props.ambiente) {
    actualizarAmbiente(props.ambiente, datos)
    id = props.ambiente.id
  } else {
    id = registrarAmbiente(props.local, datos).id
  }
  $q.notify({ type: 'positive', message: props.ambiente ? 'Ambiente actualizado.' : `Ambiente «${datos.nombre}» registrado.` })
  emit('update:modelValue', false)
  emit('hecho', id)
}
</script>
