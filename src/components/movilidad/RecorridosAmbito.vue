<template>
  <div class="sg-filters"><q-select v-model="carId" :options="opcionesCar" emit-value map-options outlined dense label="Centro" /></div>
  <lista-trazable titulo="Recorridos registrados" :contexto="contexto" :filas="filas" clave="recorridos-ambito" unidad="recorridos" />
</template>
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ListaTrazable from 'components/common/ListaTrazable.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useCentroSeleccionado } from 'src/composables/useCentroSeleccionado'
import { useEstadoNavegacion } from 'src/composables/useEstadoNavegacion'
import { carPorId } from 'src/services/datos'
import { evaluarItinerario, itinerariosDeVehiculo } from 'src/services/combustible'
import { EVALUACIONES_COMBUSTIBLE } from 'src/config/catalogos'
import { parametro } from 'src/utils/navegacion'
const route = useRoute()
const { vehiculosEnAmbito } = usePerfil()
const { carId, opcionesCar, carIdsVisibles } = useCentroSeleccionado(parametro(route.query.car), { todos: true })
useEstadoNavegacion('recorridos-ambito', { carId })
const contexto = computed(() => opcionesCar.value.find((o) => o.value === carId.value)?.label ?? '')
const filas = computed(() => vehiculosEnAmbito.value.filter((v) => carIdsVisibles.value.includes(v.carId)).flatMap((v) =>
  itinerariosDeVehiculo(v.id).map((it) => {
    const ev = evaluarItinerario(it, v)
    return { id: it.id, titulo: `${it.fecha ?? ''} · ${it.proposito ?? 'Recorrido'}`, contexto: `${carPorId(v.carId).nombre} · ${v.id} · ${v.placa ?? ''}`,
      detalle: `${EVALUACIONES_COMBUSTIBLE[ev.estado].label}${ev.faltantes.length ? ` · Falta: ${ev.faltantes.join(', ')}` : ''}`,
      to: { name: 'itinerarios', query: { vehiculo: v.id, itinerario: it.id } } }
  })).sort((a, b) => a.id.localeCompare(b.id, 'es')))
</script>
