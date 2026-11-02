<template>
  <form-dialog
    :model-value="modelValue"
    :titulo="ambiente ? 'Actualizar ambiente' : 'Registrar ambiente'"
    :subtitulo="ambiente ? `${ambiente.nombre} · ${ambiente.id}` : centro.nombre"
    :etiqueta-enviar="ambiente ? 'Guardar cambios' : 'Registrar ambiente'"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <div class="row q-col-gutter-md">
      <q-input v-model="form.nombre" class="col-12 col-sm-8" outlined dense label="Nombre *" hint="Ej.: Dormitorio 3, Lavandería" :rules="[requerido]" />
      <q-input v-model.number="form.piso" class="col-12 col-sm-4" outlined dense type="number" min="0" label="Piso" />
      <q-input v-model.number="form.areaM2" class="col-12 col-sm-4" outlined dense type="number" min="0" label="Área (m²)" />
      <q-input v-model.number="form.puertas" class="col-6 col-sm-4" outlined dense type="number" min="0" label="Puertas" />
      <q-input v-model.number="form.ventanas" class="col-6 col-sm-4" outlined dense type="number" min="0" label="Ventanas" />
    </div>
    <condicion-selector v-model="form.condicion" etiqueta="Condición *" />
    <q-input v-model="form.ultimoPintado" outlined dense type="month" stack-label label="Último pintado" hint="Vacío si no se conoce" :rules="[noFutura]" />
  </form-dialog>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import CondicionSelector from 'components/common/CondicionSelector.vue'
import { actualizarAmbiente, numeroONulo, registrarAmbiente } from 'src/services/acciones'
import { noFutura, requerido } from 'src/utils/validaciones'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  centro: { type: Object, required: true },
  // null = alta de un ambiente nuevo en el centro.
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
    id = registrarAmbiente(props.centro, datos).id
  }
  $q.notify({ type: 'positive', message: props.ambiente ? 'Ambiente actualizado.' : `Ambiente «${datos.nombre}» registrado.` })
  emit('update:modelValue', false)
  emit('hecho', id)
}
</script>
