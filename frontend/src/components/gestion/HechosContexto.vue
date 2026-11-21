<template>
  <filtro-inactivos v-model="mostrarInactivos" />
  <p class="sg-muted">{{ eventos.length }} hechos registrados</p>
  <p v-if="!eventos.length" class="sg-muted">Sin hechos para este contexto y los filtros seleccionados.</p>
  <div class="sg-hechos-lista">
    <article v-for="e in eventos" :key="e.id" class="sg-box sg-hecho-resumen" :class="{ 'sg-box--resaltada': e.id === eventoId }" :aria-current="e.id === eventoId ? 'true' : undefined">
      <div class="row items-center q-gutter-sm">
        <time :datetime="e.fecha" class="sg-muted">{{ fecha(e.fecha) }}</time>
        <status-chip v-bind="TIPOS_EVENTO[e.tipo]" />
        <status-chip :tono="esPropio(e) ? 'ne' : 'in'" :label="esPropio(e) ? 'Propio' : 'Relacionado'" />
        <status-chip :tono="estado(e).tono" :label="estado(e).label" />
      </div>
      <button type="button" class="sg-row-btn text-left text-weight-bold" @click="seleccionar(e.id)">{{ e.titulo }}</button>
      <span class="sg-muted">{{ e.id }} · {{ e.bienIds.length }} recursos afectados</span>
      <q-btn flat dense no-caps color="secondary" icon="visibility" label="Ver detalle" class="self-start" @click="seleccionar(e.id)" />
    </article>
  </div>
  <div v-if="evento" ref="detalle"><gestion-hecho :key="evento.id" :evento="evento" :operable="esPropio(evento)" @seleccionar="seleccionar" /></div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import GestionHecho from './GestionHecho.vue'
import StatusChip from 'components/common/StatusChip.vue'
import FiltroInactivos from 'components/common/FiltroInactivos.vue'
import { useEstadoNavegacion } from 'src/composables/useEstadoNavegacion'
import { hechosRegistrados, origenIncidencia, ubicacionHecho, estadoNecesidad } from 'src/services/incidencias'
import { usePerfil } from 'src/composables/usePerfil'
import { calcularNecesidades } from 'src/services/necesidades'
import { ANIO_REVISION } from 'src/config/demo'
import { TIPOS_EVENTO } from 'src/config/catalogos'
import { fecha } from 'src/utils/formato'
import { mostrarDetalle } from 'src/utils/navegacion'
const props = defineProps({ bienId: String, ambienteId: String, centroId: String, hechoInicial: String })
const { enAmbitoCar, carIdsEnAmbito } = usePerfil()
const router = useRouter()
const mostrarInactivos = ref(!!props.hechoInicial)
const eventoId = ref(props.hechoInicial ?? null)
const detalle = ref(null)
useEstadoNavegacion(`hechos-${props.bienId ?? props.ambienteId ?? props.centroId}`, { mostrarInactivos, eventoId })
const eventos = computed(() => hechosRegistrados({ bienId: props.bienId, ambienteId: props.ambienteId, centroId: props.centroId, inactivos: mostrarInactivos.value }).filter((e) => enAmbitoCar(ubicacionHecho(e).car?.id)))
const esPropio = (e) => { const o = origenIncidencia(e); return props.bienId ? ['bien', 'componente'].includes(o.tipo) && o.id === props.bienId : props.ambienteId ? o.tipo === 'ambiente' && o.id === props.ambienteId : o.tipo === 'centro' && o.id === props.centroId }
const pendientes = computed(() => calcularNecesidades({ anio: ANIO_REVISION, carIds: carIdsEnAmbito.value }).pendientes)
const estado = (e) => estadoNecesidad(e, pendientes.value)
const evento = computed(() => eventos.value.find((e) => e.id === eventoId.value) ?? null)
function seleccionar (id) {
  const hechos = hechosRegistrados({ bienId: props.bienId, ambienteId: props.ambienteId, centroId: props.centroId, inactivos: true })
  if (!hechos.some((e) => e.id === id && enAmbitoCar(ubicacionHecho(e).car?.id))) {
    // Un historial relacionado puede llevar a otro contexto; la página valida su existencia y ámbito.
    router.push({ name: 'centros', query: { hecho: id } })
    return
  }
  if (hechos.find((e) => e.id === id)?.anulacion) mostrarInactivos.value = true
  eventoId.value = id
  mostrarDetalle(detalle)
}
onMounted(() => { if (evento.value) mostrarDetalle(detalle) })
</script>

<style scoped>
.sg-hechos-lista { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 12px; }
.sg-hecho-resumen { min-width: 0; overflow-wrap: anywhere; }
.sg-hecho-resumen .sg-row-btn { white-space: normal; }
</style>
