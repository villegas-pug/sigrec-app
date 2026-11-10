<template>
  <nav aria-label="Ubicación de la ficha" class="sg-ruta-ficha">
    <template v-for="(p, i) in partes" :key="p.id">
      <q-icon v-if="i" name="chevron_right" size="16px" aria-hidden="true" />
      <button v-if="i < partes.length - 1" type="button" class="sg-row-btn" @click="$emit('seleccionar', p.id)">{{ p.label }}</button>
      <span v-else aria-current="page">{{ p.label }}</span>
    </template>
  </nav>
</template>
<script setup>
import { computed } from 'vue'
import { antecesoresDeNodo, resolverNodo, nodoCentroId, nodoAmbienteId } from 'src/services/bienes'
const props = defineProps({ nodo: { type: String, required: true } })
defineEmits(['seleccionar'])
const partes = computed(() => {
  const id = props.nodo.startsWith('centro-') ? nodoCentroId(props.nodo.slice(7)) : props.nodo.startsWith('ambiente-') ? nodoAmbienteId(props.nodo.slice(9)) : props.nodo.startsWith('bien-') ? props.nodo.slice(5) : props.nodo
  return [...antecesoresDeNodo(id), id].map((id) => { const n = resolverNodo(id); return n ? { id, label: `${n.registro.nombre} · ${n.registro.id}` } : null }).filter(Boolean)
})
</script>
<style scoped>
.sg-ruta-ficha { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; font-size: 12px; color: var(--sg-muted); }
.sg-ruta-ficha > * { max-width: 100%; overflow-wrap: anywhere; }
</style>
