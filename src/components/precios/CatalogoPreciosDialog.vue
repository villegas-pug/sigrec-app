<template>
  <q-dialog
    :model-value="modelValue"
    :persistent="operacionAbierta"
    :maximized="$q.screen.lt.sm"
    @show="listo = true"
    aria-labelledby="catalogo-precios-titulo"
    @update:model-value="actualizarApertura"
    @hide="$emit('hide')"
  >
    <q-card class="sg-dialog sg-catalogo-dialog">
      <q-card-section class="sg-dialog__header sg-catalogo-dialog__header">
        <div>
          <h2 id="catalogo-precios-titulo" class="text-h6 text-weight-bold q-my-none">Tipos de bien y precios</h2>
        </div>
        <q-btn flat color="secondary" icon="close" label="Cerrar" :disable="operacionAbierta" @click="actualizarApertura(false)" />
      </q-card-section>
      <q-card-section class="sg-dialog__body">
        <catalogo-tipos-precios v-if="listo" ref="catalogo" :tipo-pedido="tipoPedido" :filtro-inicial="filtroInicial" :anio="anio" :car-ids="carIds" :contexto="contexto" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import CatalogoTiposPrecios from './CatalogoTiposPrecios.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  anio: { type: Number, required: true },
  carIds: { type: Array, required: true },
  contexto: { type: String, required: true },
  tipoPedido: { type: String, default: '' },
  filtroInicial: { type: String, default: 'todos' }
})

const emit = defineEmits(['update:modelValue', 'hide'])
const catalogo = ref(null)
const listo = ref(false)
watch(() => props.modelValue, (abierto) => { if (abierto) listo.value = false })
const operacionAbierta = computed(() => !!catalogo.value?.operacionAbierta)

function actualizarApertura (abierto) {
  // Un formulario secundario se cierra con su propia protección de cambios.
  if (!abierto && operacionAbierta.value) return
  emit('update:modelValue', abierto)
}
</script>

<style scoped>
.sg-catalogo-dialog { width: 1100px; height: 800px; }
.sg-catalogo-dialog > .sg-dialog__body { overflow: hidden; padding: 12px; }
.sg-catalogo-dialog__header { padding: 8px 12px; }
.sg-catalogo-dialog__header { display: flex; align-items: flex-start; gap: 16px; }
.sg-catalogo-dialog__header > div { flex: 1; min-width: 0; }
.sg-catalogo-dialog__header > .q-btn { flex: 0 0 auto; }
@media (max-width: 599.98px) {
  .sg-catalogo-dialog { height: 100%; }
}
</style>
