<template>
  <section-card :titulo="malEstado ? 'Bienes en mal estado' : tituloDetalle" :subtitulo="tituloAmbito" sin-relleno>
    <div class="q-pa-md">
      <p class="text-weight-bold q-mb-xs" aria-live="polite">
        <template v-if="malEstado">{{ numero(unidades) }} de {{ numero(unidadesActivas) }} unidades activas en mal estado · {{ plural(filas.length, 'registro', 'registros') }}</template>
        <template v-else>{{ plural(filas.length, 'registro', 'registros') }} · {{ numero(unidades) }} de {{ numero(unidadesActivas) }} unidades activas</template>
      </p>
      <p class="sg-muted">{{ malEstado ? 'Solo bienes activos en condición mala o inservible' : 'Bienes activos según los filtros de tipo, verificación y control' }}</p>
      <q-btn flat dense no-caps color="secondary" icon="undo" label="Volver al resumen" @click="$emit('resumen')" />
    </div>
    <div v-if="!compacto" class="sg-table-wrap">
      <table class="sg-table">
        <thead><tr>
          <th scope="col">Bien</th><th scope="col">Ubicación</th><th scope="col" class="sg-num">Cantidad</th>
          <th scope="col">Condición</th><th scope="col">Deterioro informado</th><th scope="col">Acción</th>
        </tr></thead>
        <tbody>
          <tr v-for="f in filas" :id="`bien-${f.bien.id}`" :key="f.bien.id"
              :class="{ 'sg-row--selected': seleccionado === f.bien.id }" :aria-current="seleccionado === f.bien.id ? 'true' : undefined">
            <td>
              <strong>{{ f.bien.nombre }}</strong>
              <div>{{ f.bien.id }}</div><div class="sg-muted">{{ f.bien.codigoPatrimonial || 'Sin código patrimonial' }}</div>
              <div v-if="f.bien.asociadoA" class="sg-muted">Componente de {{ f.principal?.nombre || 'Bien principal' }} · {{ f.bien.asociadoA.bienId }}</div>
            </td>
            <td>{{ f.car.nombre }}<div class="sg-muted">{{ etiquetaAmbiente(f.ambiente) }}</div></td>
            <td class="sg-num">{{ numero(f.bien.cantidad ?? 1) }}</td>
            <td><status-chip v-bind="condicion(f.bien.condicion)" /><div v-if="f.control" class="sg-muted">{{ ESTADOS_CONTROL[f.control.estado].label }} · {{ f.control.proxima || 'Sin próxima fecha' }}</div></td>
            <td>{{ f.bien.deterioro || 'Sin deterioro informado' }} · {{ f.bien.verificacion ? `Verificación: ${f.bien.verificacion.fecha} · ${f.bien.verificacion.resultado}` : 'Sin verificación registrada' }}</td>
            <td><router-link v-if="puedeAcceder('centros')" :to="{ name: 'centros', query: { bien: f.bien.id } }"
                             :aria-label="`Ver ficha de ${f.bien.nombre} · ${f.bien.id}`" @click="$emit('seleccionar', f.bien.id)">Ver ficha</router-link></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="column q-gutter-y-md q-pa-md">
      <div v-for="f in filas" :id="`bien-${f.bien.id}`" :key="f.bien.id" class="sg-box"
           :class="{ 'sg-box--resaltada': seleccionado === f.bien.id }" :aria-current="seleccionado === f.bien.id ? 'true' : undefined">
        <strong>{{ f.bien.nombre }}</strong><span>{{ f.bien.id }}</span>
        <span class="sg-muted">{{ f.bien.codigoPatrimonial || 'Sin código patrimonial' }}</span>
        <span>{{ textoUbicacion(f) }}</span>
        <span v-if="f.bien.asociadoA" class="sg-muted">Componente de {{ f.principal?.nombre || 'Bien principal' }} · {{ f.bien.asociadoA.bienId }}</span>
        <span>Cantidad: <strong>{{ numero(f.bien.cantidad ?? 1) }}</strong></span>
        <div><status-chip v-bind="condicion(f.bien.condicion)" /><span v-if="f.control"> · {{ ESTADOS_CONTROL[f.control.estado].label }} · {{ f.control.proxima || 'Sin próxima fecha' }}</span></div>
        <span>{{ f.bien.deterioro || 'Sin deterioro informado' }} · {{ f.bien.verificacion ? `Verificación: ${f.bien.verificacion.fecha} · ${f.bien.verificacion.resultado}` : 'Sin verificación registrada' }}</span>
        <router-link v-if="puedeAcceder('centros')" :to="{ name: 'centros', query: { bien: f.bien.id } }"
                     :aria-label="`Ver ficha de ${f.bien.nombre} · ${f.bien.id}`" @click="$emit('seleccionar', f.bien.id)">Ver ficha</router-link>
      </div>
    </div>
    <p v-if="!filas.length" class="sg-muted q-pa-md">{{ malEstado ? 'No hay bienes activos en mal estado en este ámbito' : 'No hay bienes activos para los filtros seleccionados' }}</p>
  </section-card>
</template>

<script setup>
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { condicion, ESTADOS_CONTROL } from 'src/config/catalogos'
import { etiquetaAmbiente, textoUbicacion } from 'src/services/datos'
import { numero, plural } from 'src/utils/formato'

defineProps({
  malEstado: { type: Boolean, default: true },
  tituloDetalle: { type: String, default: 'Detalle de bienes activos' },
  filas: { type: Array, required: true },
  unidades: { type: Number, required: true },
  unidadesActivas: { type: Number, required: true },
  tituloAmbito: { type: String, required: true },
  compacto: Boolean,
  seleccionado: { type: String, default: null }
})
defineEmits(['seleccionar', 'resumen'])
const { puedeAcceder } = usePerfil()
</script>
