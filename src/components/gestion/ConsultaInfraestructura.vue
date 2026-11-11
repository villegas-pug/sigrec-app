<template>
  <div class="sg-filters">
    <q-select v-model="carId" :options="opcionesCar" emit-value map-options outlined dense label="Centro" />
    <q-select v-model="consulta" :options="opciones" emit-value map-options outlined dense label="Consulta" />
  </div>
  <lista-trazable :titulo="opciones.find((o) => o.value === consulta).label" :contexto="contexto" :filas="filas" :unidad="consulta === 'elementos_criticos' ? 'elementos' : consulta === 'novedades' ? 'novedades' : 'ambientes'" clave="infraestructura" />
</template>
<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import ListaTrazable from 'components/common/ListaTrazable.vue'
import { useCentroSeleccionado } from 'src/composables/useCentroSeleccionado'
import { useEstadoNavegacion } from 'src/composables/useEstadoNavegacion'
import { ambientesDeCar, carPorId, moduloPorId, textoUbicacion } from 'src/services/datos'
import { elementosCriticos } from 'src/services/infraestructura'
import { novedadesAbiertas } from 'src/services/situacion'
import { CONDICIONES_CRITICAS, condicion } from 'src/config/catalogos'
import { parametro } from 'src/utils/navegacion'
const route = useRoute()
const opciones = [{ value: 'ambientes_criticos', label: 'Ambientes en mal estado' }, { value: 'elementos_criticos', label: 'Elementos críticos del inmueble y ambientes' }, { value: 'novedades', label: 'Novedades abiertas' }]
const consulta = ref(opciones.some((o) => o.value === parametro(route.query.consulta)) ? parametro(route.query.consulta) : 'novedades')
const { carId, opcionesCar, carIdsVisibles } = useCentroSeleccionado(parametro(route.query.car), { todos: true })
useEstadoNavegacion('consulta-infraestructura', { carId, consulta })
const contexto = computed(() => opcionesCar.value.find((o) => o.value === carId.value)?.label ?? '')
const filas = computed(() => carIdsVisibles.value.flatMap((id) => {
  const car = carPorId(id)
  const ambientes = ambientesDeCar(id)
  // Ruta «Centro › Módulo [› Ambiente]» de cada fila (SPEC 020).
  const ruta = (a, conAmbiente = true) => textoUbicacion({ car, modulo: moduloPorId(a.moduloId), ambiente: conAmbiente ? a : null })
  const to = (ambiente, novedad) => ({ name: 'centros', query: { car: id, ...(ambiente ? { ambiente: ambiente.id } : {}), ...(novedad ? { novedad: novedad.id } : { tab: 'ficha' }) } })
  if (consulta.value === 'ambientes_criticos') return ambientes.filter((a) => CONDICIONES_CRITICAS.includes(a.condicion)).map((a) => ({ id: a.id, titulo: a.nombre, contexto: ruta(a, false), detalle: condicion(a.condicion).label, to: to(a) }))
  if (consulta.value === 'novedades') return ambientes.flatMap((a) => novedadesAbiertas(a).map((n) => ({ id: n.id, titulo: n.titulo, contexto: ruta(a), detalle: 'Novedad abierta', to: to(a, n) })))
  return [{ id: car.id, nombre: 'Inmueble', estados: car.inmueble.construccion.estadoElementos, ambiente: null }, ...ambientes.map((a) => ({ id: a.id, nombre: a.nombre, estados: a.estadoElementos, ambiente: a }))]
    .flatMap((lugar) => elementosCriticos(lugar.estados).map((e) => ({ id: `${lugar.id}-${e.key}`, titulo: e.label, contexto: lugar.ambiente ? ruta(lugar.ambiente) : `${car.nombre} › ${lugar.nombre}`, detalle: condicion(lugar.estados[e.key]).label, to: to(lugar.ambiente) })))
}))
</script>
