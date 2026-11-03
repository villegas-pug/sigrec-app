<template>
  <ul class="sg-timeline">
    <li v-for="ev in antecedentes" :key="ev.id" class="sg-timeline__item">
      <span class="sg-timeline__date">{{ fecha(ev.fecha) }}</span>
      <div class="column">
        <span>
          <status-chip v-bind="TIPOS_EVENTO[ev.tipo]" />
          <button v-if="tiposSeleccionables.includes(ev.tipo)" type="button" class="sg-row-btn" @click="$emit('seleccionar', ev.id)">{{ ev.titulo }}</button>
          <template v-else>{{ ev.titulo }}</template>
          <slot name="extra" :item="ev" />
        </span>
        <span v-if="ev.detalle" class="sg-muted">{{ ev.detalle }}</span>
        <span v-if="ev.informadoPor" class="sg-muted">{{ ev.informadoPor }}</span>
      </div>
    </li>
  </ul>
</template>

<script setup>
// Línea de tiempo de un bien: incidentes, bajas, reposiciones y demás antecedentes vigentes, del más reciente al más antiguo.
import { computed } from 'vue'
import StatusChip from 'components/common/StatusChip.vue'
import { antecedentesDeBien } from 'src/services/bienes'
import { TIPOS_EVENTO } from 'src/config/catalogos'
import { fecha } from 'src/utils/formato'

const props = defineProps({
  bien: { type: Object, required: true },
  // Los hechos de estos tipos son botones que emiten `seleccionar` con su id.
  tiposSeleccionables: { type: Array, default: () => [] }
})

defineEmits(['seleccionar'])

const antecedentes = computed(() => antecedentesDeBien(props.bien))
</script>
