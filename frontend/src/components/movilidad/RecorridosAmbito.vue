<template>
  <lista-trazable titulo="Recorridos registrados" :contexto="contexto" :filas="filas" clave="recorridos-ambito" unidad="recorridos" />
</template>
<script setup>
import { computed } from 'vue'
import ListaTrazable from 'components/common/ListaTrazable.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useCentroCabecera } from 'src/composables/useCentroCabecera'
import { carPorId } from 'src/services/datos'
import { evaluarItinerario, itinerariosDeVehiculo } from 'src/services/combustible'
import { EVALUACIONES_COMBUSTIBLE } from 'src/config/catalogos'
const { vehiculosEnAmbito } = usePerfil()
// SPEC 052: el centro viene de los filtros de cabecera.
const { car, carIdsVisibles } = useCentroCabecera()
const contexto = computed(() => car.value?.nombre ?? 'Todos los centros del ámbito')
const filas = computed(() => vehiculosEnAmbito.value.filter((v) => carIdsVisibles.value.includes(v.carId)).flatMap((v) =>
  itinerariosDeVehiculo(v.id).map((it) => {
    const ev = evaluarItinerario(it, v)
    return { id: it.id, titulo: `${it.fecha ?? ''} · ${it.proposito ?? 'Recorrido'}`, contexto: `${carPorId(v.carId).nombre} · ${v.id} · ${v.placa ?? ''}`,
      detalle: `${EVALUACIONES_COMBUSTIBLE[ev.estado].label}${ev.faltantes.length ? ` · Falta: ${ev.faltantes.join(', ')}` : ''}`,
      to: { name: 'itinerarios', query: { vehiculo: v.id, itinerario: it.id } } }
  })).sort((a, b) => a.id.localeCompare(b.id, 'es')))
</script>
