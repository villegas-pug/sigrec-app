<template>
  <section-card :titulo="titulo" icono="today" :subtitulo="`${vehiculo.tipo} ${vehiculo.id} · placa ${vehiculo.placa}`">
    <template #acciones>
      <q-btn v-if="puedeHacer('itinerario.registrar')" unelevated color="primary" icon="add_road" label="Nuevo recorrido" @click="$emit('registrar')" />
      <q-btn v-if="puedeHacer('combustible.informar')" outline color="secondary" icon="local_gas_station" label="Informar carga" @click="$emit('combustible', null)" />
    </template>

    <note-banner v-if="requiereAtencion(vehiculo)" :tono="vehiculo.estadoOperativo === 'detenido' ? 'da' : 'wa'" icono="warning" class="q-mb-md">
      El vehículo figura como <strong>{{ estadoVehiculo(vehiculo.estadoOperativo).label.toLowerCase() }}</strong><template v-if="vehiculo.mantenimiento?.motivo"> ({{ vehiculo.mantenimiento.motivo }})</template>.
    </note-banner>

    <div class="column q-gutter-y-sm">
      <div v-for="t in tareas" :key="`${t.tipo}-${t.it.id}`" class="sg-box row items-center justify-between q-gutter-sm">
        <div class="column" style="min-width: 0">
          <span class="text-weight-bold">{{ t.it.proposito }}</span>
          <span class="sg-muted">{{ t.it.id }} · {{ fecha(t.it.fecha) }}<template v-if="t.it.destinos?.length"> · {{ t.it.destinos.join(', ') }}</template></span>
          <status-chip :tono="t.tipo === 'ejecucion' ? 'wa' : 'in'" :label="t.tipo === 'ejecucion' ? 'Falta informar la ejecución' : 'Falta declarar el consumo'" />
        </div>
        <q-btn
          v-if="t.tipo === 'ejecucion'"
          unelevated
          no-caps
          color="primary"
          icon="flag"
          label="Informar ejecución"
          @click="$emit('ejecucion', t.it)"
        />
        <q-btn v-else unelevated no-caps color="primary" icon="local_gas_station" label="Declarar consumo" @click="$emit('combustible', t.it)" />
      </div>
      <p v-if="!tareas.length" class="sg-muted q-mb-none">
        <q-icon name="task_alt" color="positive" size="18px" class="q-mr-xs" aria-hidden="true" />Sin pendientes: todos los recorridos tienen su ejecución y su consumo informados.
      </p>
    </div>
  </section-card>
</template>

<script setup>
// «Mi jornada» (SPEC 011, Ola 3): lo pendiente del vehículo en una sola vista, con la acción de cada paso
// (informar la ejecución de un recorrido y declarar su consumo) sin cambiar de pantalla.
import { computed } from 'vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { vigente } from 'src/services/datos'
import { requiereAtencion } from 'src/services/vehiculos'
import { estadoVehiculo } from 'src/config/catalogos'
import { fecha } from 'src/utils/formato'

const props = defineProps({
  vehiculo: { type: Object, required: true },
  // Itinerarios del vehículo (vigentes o no); solo cuentan los vigentes.
  itinerarios: { type: Array, required: true }
})
defineEmits(['ejecucion', 'combustible', 'registrar'])

const { perfil, puedeHacer } = usePerfil()

// Un perfil limitado a sus vehículos (chofer) ve «Mi jornada»; los demás, los pendientes del vehículo elegido.
const titulo = computed(() => (perfil.value.ambito.vehiculoIds ? 'Mi jornada' : 'Pendientes del vehículo'))

// Primero lo que falta ejecutar (por fecha) y luego los consumos por declarar. Solo se listan los pasos que el perfil puede dar.
const tareas = computed(() => {
  const vigentes = props.itinerarios.filter(vigente).sort((a, b) => a.fecha.localeCompare(b.fecha))
  return [
    ...(puedeHacer('itinerario.ejecucion') ? vigentes.filter((it) => !it.realizado).map((it) => ({ tipo: 'ejecucion', it })) : []),
    ...(puedeHacer('combustible.informar') ? vigentes.filter((it) => it.realizado && it.consumoDeclaradoL == null).map((it) => ({ tipo: 'consumo', it })) : [])
  ]
})
</script>
