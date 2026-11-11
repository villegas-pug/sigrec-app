<template>
  <div class="sg-borde-superior row items-center justify-between q-px-md q-py-sm">
    <div class="column">
      <button type="button" class="sg-row-btn text-weight-bold self-start" @click="$emit('seleccionar', nodoAmbienteId(ambiente.id))"><q-icon name="visibility" size="16px" aria-hidden="true" class="q-mr-xs" />{{ ambiente.nombre }}</button>
      <span class="sg-muted">{{ [ambiente.piso != null ? `Piso ${ambiente.piso}` : null, ambiente.bloque, ambiente.ubicacion].filter(Boolean).join(' · ') || 'Ubicación no informada' }}</span>
    </div>
    <div class="sg-chips">
      <status-chip v-bind="condicion(ambiente.condicion)" />
      <status-chip v-if="ambiente.anulacion" v-bind="CHIP_ANULADO" />
      <status-chip v-if="novedadesAbiertas(ambiente).length" tono="da" :label="plural(novedadesAbiertas(ambiente).length, 'novedad abierta', 'novedades abiertas')" />
      <status-chip v-if="elementosCriticos(ambiente.estadoElementos).length" tono="wa" :label="plural(elementosCriticos(ambiente.estadoElementos).length, 'elemento crítico', 'elementos críticos')" />
      <status-chip tono="ne" :label="`${textoConteoRecursos(contarRecursos(bienesDeAmbiente(ambiente.id).filter((b) => b.situacion === 'activo')))} activos`" />
    </div>
  </div>
</template>

<script setup>
// Fila de un ambiente con su condición, novedades, elementos críticos y bienes; la usan las fichas del centro y del módulo.
import { contarRecursos, textoConteoRecursos } from 'src/services/jerarquiaRecursos'
import StatusChip from 'components/common/StatusChip.vue'
import { bienesDeAmbiente } from 'src/services/datos'
import { nodoAmbienteId } from 'src/services/bienes'
import { elementosCriticos } from 'src/services/infraestructura'
import { novedadesAbiertas } from 'src/services/situacion'
import { CHIP_ANULADO, condicion } from 'src/config/catalogos'
import { plural } from 'src/utils/formato'

defineProps({ ambiente: { type: Object, required: true } })
defineEmits(['seleccionar'])
</script>
