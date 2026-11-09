<template>
  <form-dialog
    :model-value="modelValue"
    titulo="Informar precio referencial"
    :subtitulo="tipo.nombre"
    :ancho="480"
    etiqueta-enviar="Guardar precio"
    :modificado="modificado"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <q-input v-model.number="form.precio" outlined dense type="number" min="0" step="0.01" label="Precio (S/) *" :rules="[mayorQueCero]">
      <template #append><boton-dictado v-model="form.precio" tipo="numero" /></template>
    </q-input>
    <q-input v-model="form.fechaPrecio" outlined dense type="month" stack-label label="Fecha del precio" :rules="[noFutura]">
      <template #append><boton-dictado v-model="form.fechaPrecio" tipo="mes" /></template>
    </q-input>
    <q-input v-model="form.procedencia" outlined dense label="Procedencia (cotización, catálogo, factura…)">
      <template #append><boton-dictado v-model="form.procedencia" /></template>
    </q-input>
    <div v-if="tipo.historial?.length">
      <div class="sg-kv__label q-mb-xs">Precios anteriores</div>
      <ul class="q-my-none q-pl-md">
        <li v-for="(h, i) in tipo.historial" :key="i">
          {{ soles(h.precio) }} · {{ fecha(h.fechaPrecio) }}<template v-if="h.procedencia"> · {{ h.procedencia }}</template>
          <span class="sg-muted"> (reemplazado el {{ fecha(h.reemplazadoEl) }} por {{ h.por }})</span>
        </li>
      </ul>
    </div>
  </form-dialog>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import { useBorrador } from 'src/composables/useBorrador'
import { informarPrecio } from 'src/services/acciones'
import { FECHA_CORTE } from 'src/config/demo'
import { fecha, soles } from 'src/utils/formato'
import { mayorQueCero, noFutura } from 'src/utils/validaciones'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  tipo: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue'])
const $q = useQuasar()

const form = reactive({ precio: null, fechaPrecio: '', procedencia: '' })
const { modificado, fijar } = useBorrador(form)

// `immediate`: la página monta este diálogo al elegir el primer tipo, ya abierto.
watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  Object.assign(form, {
    precio: props.tipo.precio,
    fechaPrecio: props.tipo.fechaPrecio ?? FECHA_CORTE.slice(0, 7),
    procedencia: props.tipo.procedencia ?? ''
  })
  fijar()
}, { immediate: true })

function guardar () {
  informarPrecio(props.tipo, form)
  $q.notify({ type: 'positive', message: `Precio de «${props.tipo.nombre}» actualizado. Las necesidades se recalculan.` })
  emit('update:modelValue', false)
}
</script>
