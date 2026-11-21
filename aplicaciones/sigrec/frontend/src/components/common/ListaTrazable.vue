<template>
  <section-card :titulo="titulo" :subtitulo="`${filas.length} ${unidad} · ${contexto}`">
    <p v-if="!filas.length" class="sg-muted">Sin coincidencias para los filtros seleccionados.</p>
    <div class="column q-gutter-y-sm">
      <article v-for="f in filas" :id="`resultado-${f.id}`" :key="f.id" class="sg-box"
               :class="{ 'sg-box--resaltada': seleccionado === f.id }" :aria-current="seleccionado === f.id ? 'true' : undefined">
        <strong>{{ f.titulo }}</strong><span class="sg-muted">{{ f.id }} · {{ f.contexto }}</span>
        <span>{{ f.detalle }}</span>
        <router-link v-if="f.to && puedeAcceder(f.to.name)" :to="f.to" @click="seleccionado = f.id">{{ f.enlace || 'Ver detalle' }}</router-link>
      </article>
    </div>
  </section-card>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import SectionCard from './SectionCard.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useEstadoNavegacion } from 'src/composables/useEstadoNavegacion'
import { mostrarDetalle } from 'src/utils/navegacion'
const props = defineProps({ titulo: String, contexto: String, filas: { type: Array, required: true }, unidad: { type: String, default: 'registros' }, clave: { type: String, required: true } })
const { puedeAcceder } = usePerfil()
const seleccionado = ref(null)
useEstadoNavegacion(`lista-${props.clave}`, { seleccionado })
onMounted(() => { if (seleccionado.value) mostrarDetalle(document.getElementById(`resultado-${seleccionado.value}`)) })
</script>
