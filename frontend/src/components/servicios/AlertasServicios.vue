<template>
  <div class="sg-filters">
    <q-select v-model="alerta" :options="opciones" emit-value map-options outlined dense label="Alerta" />
  </div>
  <lista-trazable :titulo="opciones.find((o) => o.value === alerta).label" :contexto="`${contexto} · ${filtros.anio === TODOS ? 'Todos los años' : filtros.anio}`" :filas="filas" :unidad="['pendiente', 'sin_info'].includes(alerta) ? 'períodos' : 'servicios'" clave="alertas-servicios" />
</template>
<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import ListaTrazable from 'components/common/ListaTrazable.vue'
import { useCentroCabecera } from 'src/composables/useCentroCabecera'
import { useFiltrosCabecera } from 'src/composables/useFiltrosCabecera'
import { useEstadoNavegacion } from 'src/composables/useEstadoNavegacion'
import { carPorId } from 'src/services/datos'
import { serviciosDeCar, avisosDeServicios, problemasRecurrentes } from 'src/services/servicios'
import { hoy } from 'src/config/reglas'
import { anioActual } from 'src/utils/fechas'
import { TIPOS_SERVICIO, TODOS } from 'src/config/catalogos'
import { parametro } from 'src/utils/navegacion'
const route = useRoute()
const opciones = [{ value: 'pendiente', label: 'Períodos pendientes' }, { value: 'sin_info', label: 'Períodos sin información' }, { value: 'interrupcion', label: 'Interrupciones abiertas' }, { value: 'renovacion', label: 'Renovaciones por atender' }, { value: 'recurrente', label: 'Servicios con problemas recurrentes' }]
const alerta = ref(opciones.some((o) => o.value === parametro(route.query.alerta)) ? parametro(route.query.alerta) : 'pendiente')
const { filtros, opcionesAnio } = useFiltrosCabecera()
// SPEC 052: el centro viene de los filtros de cabecera.
const { car, carIdsVisibles } = useCentroCabecera()
useEstadoNavegacion('alertas-servicios', { alerta })
const contexto = computed(() => car.value?.nombre ?? 'Todos los centros del ámbito')
const filas = computed(() => {
  const servicios = carIdsVisibles.value.flatMap((id) => serviciosDeCar(id))
  const anios = filtros.anio !== TODOS ? [Number(filtros.anio)] : [...new Set([anioActual(), ...opcionesAnio().map((o) => o.value).filter((v) => typeof v === 'number'), ...servicios.flatMap((s) => Object.keys(s.periodos ?? {}).map(Number).filter((v) => Number.isInteger(v) && v > 0))])].sort((a, b) => b - a)
  const fila = (s, id, detalle, numero, anio) => ({ id, titulo: TIPOS_SERVICIO[s.tipo], contexto: `${carPorId(s.carId).nombre} · ${s.id}`, detalle,
    to: { name: 'servicios', query: { car: s.carId, servicio: s.id, ...(anio ? { anio } : {}), ...(numero ? { periodo: numero } : {}) } } })
  if (alerta.value === 'recurrente') return servicios.filter((s) => problemasRecurrentes(s, hoy()).recurrente).map((s) => fila(s, s.id, `${problemasRecurrentes(s, hoy()).cantidad} interrupciones en ${problemasRecurrentes(s, hoy()).meses} meses`))
  return anios.flatMap((anio, indice) => avisosDeServicios(servicios, anio, hoy()).filter((a) => (a.celdas.length || indice === 0) && (alerta.value === 'pendiente' ? a.clase.startsWith('pendiente') : alerta.value === 'renovacion' ? a.clase.startsWith('renovacion') : a.clase === alerta.value))
    .flatMap((a) => a.celdas.length ? a.celdas.map((c) => fila(a.servicio, `${a.servicio.id}-${anio}-${c.numero}`, `${c.etiqueta} ${anio} · ${alerta.value === 'pendiente' ? 'Pendiente' : 'Sin información'}${c.vence ? ` · Vence: ${c.vence}` : ''}`, c.numero, anio)) :
      [fila(a.servicio, a.servicio.id, a.interrupcion ? `Interrupción abierta desde ${a.interrupcion.fecha}` : `Renovación: ${a.renovacion.fecha}`)]))
})
</script>
