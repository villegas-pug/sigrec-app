<template>
  <div class="sg-filters">
    <q-select v-model="carId" :options="opcionesCar" emit-value map-options outlined dense label="Centro" />
    <q-select v-model="consulta" :options="opciones" emit-value map-options outlined dense label="Consulta" />
  </div>
  <lista-trazable :titulo="opciones.find((o) => o.value === consulta).label" :contexto="contexto" :filas="filas" :unidad="consulta === 'elementos_criticos' ? 'elementos' : consulta === 'novedades' ? 'novedades' : 'lugares'" clave="infraestructura" />
</template>
<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import ListaTrazable from 'components/common/ListaTrazable.vue'
import { useCentroSeleccionado } from 'src/composables/useCentroSeleccionado'
import { useEstadoNavegacion } from 'src/composables/useEstadoNavegacion'
import { ambientesDeCar, carPorId, moduloPorId, modulosDeCar, ordenarPorModulo, textoUbicacion } from 'src/services/datos'
import { elementosCriticos } from 'src/services/infraestructura'
import { novedadesAbiertas } from 'src/services/situacion'
import { CONDICIONES_CRITICAS, condicion } from 'src/config/catalogos'
import { parametro } from 'src/utils/navegacion'
const route = useRoute()
const opciones = [{ value: 'ambientes_criticos', label: 'Módulos y ambientes en mal estado' }, { value: 'elementos_criticos', label: 'Elementos críticos del inmueble, módulos y ambientes' }, { value: 'novedades', label: 'Novedades abiertas' }]
const consulta = ref(opciones.some((o) => o.value === parametro(route.query.consulta)) ? parametro(route.query.consulta) : 'novedades')
const { carId, opcionesCar, carIdsVisibles } = useCentroSeleccionado(parametro(route.query.car), { todos: true })
useEstadoNavegacion('consulta-infraestructura', { carId, consulta })
const contexto = computed(() => opcionesCar.value.find((o) => o.value === carId.value)?.label ?? '')
const filas = computed(() => carIdsVisibles.value.flatMap((id) => {
  const car = carPorId(id)
  const ambientes = ordenarPorModulo(ambientesDeCar(id))
  const modulos = modulosDeCar(id)
  // Ruta «Centro › Módulo [› Ambiente]» de cada fila (SPEC 020).
  const ruta = (a, conAmbiente = true) => textoUbicacion({ car, modulo: moduloPorId(a.moduloId), ambiente: conAmbiente ? a : null })
  const to = (ambiente, novedad) => ({ name: 'centros', query: { car: id, ...(ambiente ? { ambiente: ambiente.id } : {}), ...(novedad ? { novedad: novedad.id } : { tab: 'ficha' }) } })
  // La clave conserva su nombre por los enlaces existentes; incluye los módulos en mal estado (SPEC 020), antes que los ambientes.
  if (consulta.value === 'ambientes_criticos') {
    return [
      ...modulos.filter((m) => CONDICIONES_CRITICAS.includes(m.condicion)).map((m) => ({ id: m.id, titulo: m.nombre, contexto: car.nombre, detalle: `Módulo · ${condicion(m.condicion).label}`, to: { name: 'centros', query: { modulo: m.id } } })),
      ...ambientes.filter((a) => CONDICIONES_CRITICAS.includes(a.condicion)).map((a) => ({ id: a.id, titulo: a.nombre, contexto: ruta(a, false), detalle: condicion(a.condicion).label, to: to(a) }))
    ]
  }
  if (consulta.value === 'novedades') return ambientes.flatMap((a) => novedadesAbiertas(a).map((n) => ({ id: n.id, titulo: n.titulo, contexto: ruta(a), detalle: 'Novedad abierta', to: to(a, n) })))
  // Lugares evaluados: inmueble y módulos (con sus elementos agregados, SPEC 022) y ambientes.
  const construccion = car.inmueble.construccion
  return [
    { id: car.id, estados: construccion.estadoElementos, adicionales: construccion.elementosAdicionales, contexto: `${car.nombre} › Inmueble`, to: to(null) },
    ...modulos.map((m) => ({ id: m.id, estados: m.estadoElementos, adicionales: m.elementosAdicionales, contexto: textoUbicacion({ car, modulo: m }), to: { name: 'centros', query: { modulo: m.id } } })),
    ...ambientes.map((a) => ({ id: a.id, estados: a.estadoElementos, adicionales: [], contexto: ruta(a), to: to(a) }))
  ].flatMap((lugar) => elementosCriticos(lugar.estados, lugar.adicionales).map((e) => ({ id: `${lugar.id}-${e.key}`, titulo: e.label, contexto: lugar.contexto, detalle: condicion(lugar.estados[e.key]).label, to: lugar.to })))
}))
</script>
