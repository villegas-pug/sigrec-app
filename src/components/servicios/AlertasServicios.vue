<template>
  <div class="sg-filters">
    <q-select v-model="carId" :options="opcionesCar" emit-value map-options outlined dense label="Centro" />
    <q-select v-model="anio" :options="ANIOS_SERVICIOS" outlined dense label="Año" />
    <q-select v-model="alerta" :options="opciones" emit-value map-options outlined dense label="Alerta" />
  </div>
  <lista-trazable :titulo="opciones.find((o) => o.value === alerta).label" :contexto="`${contexto} · ${anio}`" :filas="filas" :unidad="['pendiente', 'sin_info'].includes(alerta) ? 'períodos' : 'servicios'" clave="alertas-servicios" />
</template>
<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import ListaTrazable from 'components/common/ListaTrazable.vue'
import { useCentroSeleccionado } from 'src/composables/useCentroSeleccionado'
import { useEstadoNavegacion } from 'src/composables/useEstadoNavegacion'
import { carPorId } from 'src/services/datos'
import { serviciosDeCar, avisosDeServicios, problemasRecurrentes } from 'src/services/servicios'
import { ANIOS_SERVICIOS, FECHA_CORTE } from 'src/config/demo'
import { TIPOS_SERVICIO } from 'src/config/catalogos'
import { parametro } from 'src/utils/navegacion'
const route = useRoute()
const opciones = [{ value: 'pendiente', label: 'Períodos pendientes' }, { value: 'sin_info', label: 'Períodos sin información' }, { value: 'interrupcion', label: 'Interrupciones abiertas' }, { value: 'renovacion', label: 'Renovaciones por atender' }, { value: 'recurrente', label: 'Servicios con problemas recurrentes' }]
const alerta = ref(opciones.some((o) => o.value === parametro(route.query.alerta)) ? parametro(route.query.alerta) : 'pendiente')
const anio = ref(ANIOS_SERVICIOS.find((a) => String(a) === parametro(route.query.anio)) ?? ANIOS_SERVICIOS.at(-1))
const { carId, opcionesCar, carIdsVisibles } = useCentroSeleccionado(parametro(route.query.car), { todos: true })
useEstadoNavegacion('alertas-servicios', { carId, anio, alerta })
const contexto = computed(() => opcionesCar.value.find((o) => o.value === carId.value)?.label ?? '')
const filas = computed(() => {
  const servicios = carIdsVisibles.value.flatMap((id) => serviciosDeCar(id))
  const fila = (s, id, detalle, numero) => ({ id, titulo: TIPOS_SERVICIO[s.tipo], contexto: `${carPorId(s.carId).nombre} · ${s.id}`, detalle,
    to: { name: 'servicios', query: { car: s.carId, servicio: s.id, anio: anio.value, ...(numero ? { periodo: numero } : {}) } } })
  if (alerta.value === 'recurrente') return servicios.filter((s) => problemasRecurrentes(s, FECHA_CORTE).recurrente).map((s) => fila(s, s.id, `${problemasRecurrentes(s, FECHA_CORTE).cantidad} interrupciones en ${problemasRecurrentes(s, FECHA_CORTE).meses} meses`))
  return avisosDeServicios(servicios, anio.value, FECHA_CORTE).filter((a) => alerta.value === 'pendiente' ? a.clase.startsWith('pendiente') : alerta.value === 'renovacion' ? a.clase.startsWith('renovacion') : a.clase === alerta.value)
    .flatMap((a) => a.celdas.length ? a.celdas.map((c) => fila(a.servicio, `${a.servicio.id}-${c.numero}`, `${c.etiqueta} · ${alerta.value === 'pendiente' ? 'Pendiente' : 'Sin información'}${c.vence ? ` · Vence: ${c.vence}` : ''}`, c.numero)) :
      [fila(a.servicio, a.servicio.id, a.interrupcion ? `Interrupción abierta desde ${a.interrupcion.fecha}` : `Renovación: ${a.renovacion.fecha}`)])
})
</script>
