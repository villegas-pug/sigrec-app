<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #acciones>
          <q-btn v-if="puedeAcceder('vehiculos')" outline color="secondary" icon="directions_car" label="Vehículos" :to="{ name: 'vehiculos' }" />
          <q-btn v-if="puedeAcceder('combustible')" outline color="secondary" icon="local_gas_station" label="Combustible" :to="{ name: 'combustible', query: vehiculoId ? { vehiculo: vehiculoId } : {} }" />
          <q-btn v-if="puedeHacer('itinerario.registrar')" unelevated color="primary" icon="add_road" label="Registrar itinerario" :disable="!vehiculo" @click="abrir('nuevo', null)" />
        </template>
      </page-header>

      <registro-no-disponible v-if="itinerarioNoDisponible" entidad="El recorrido" :id="itinerarioPedido" :volver="{ name: 'itinerarios' }" etiqueta-volver="Ver los recorridos del vehículo" />

      <vehiculo-selector v-model="vehiculoId" :vehiculos="vehiculosEnAmbito" />

      <section-card v-if="vehiculo" titulo="Itinerarios" subtitulo="Previsto y realizado se muestran por separado cuando ambos se informan" sin-relleno>
        <template #acciones>
          <filtro-inactivos v-model="mostrarInactivos" />
        </template>
        <div v-if="!compacto" class="sg-table-wrap">
          <table class="sg-table">
            <thead>
              <tr>
                <th scope="col">Itinerario</th>
                <th scope="col">Propósito y destinos</th>
                <th scope="col">Previsto</th>
                <th scope="col">Realizado</th>
                <th scope="col" class="sg-num">Consumo declarado</th>
                <th scope="col">Estimación</th>
                <th scope="col"><span class="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="fila in filas" :key="fila.it.id" :class="{ 'sg-row--selected': fila.it.id === itinerarioId }">
                <td>
                  <button type="button" class="sg-row-btn" @click="seleccionar(fila.it.id)"><q-icon name="visibility" size="16px" aria-hidden="true" class="q-mr-xs" />{{ fila.it.id }}</button>
                  <div class="sg-muted">{{ fecha(fila.it.fecha) }}</div>
                  <status-chip v-if="fila.it.anulacion" v-bind="CHIP_ANULADO" />
                </td>
                <td>{{ fila.it.proposito }}<div class="sg-muted">{{ fila.it.destinos.join(' → ') }}</div></td>
                <td>
                  <template v-if="fila.it.previsto">{{ tramo(fila.it.previsto) }}</template>
                  <status-chip v-else tono="si" label="No programado" />
                </td>
                <td>
                  <template v-if="fila.it.realizado">
                    {{ fila.it.realizado.salida }}–{{ fila.it.realizado.llegada }}
                    <div v-if="fila.it.realizado.km != null" class="sg-muted">{{ fila.it.realizado.km }} km</div>
                    <div v-else class="text-weight-bold sg-aviso-texto">Distancia no informada</div>
                  </template>
                  <status-chip v-else tono="si" label="No informado" />
                </td>
                <td class="sg-num">
                  <template v-if="fila.it.consumoDeclaradoL != null">{{ litros(fila.it.consumoDeclaradoL) }}</template>
                  <status-chip v-else tono="si" label="No informado" />
                </td>
                <td><status-chip v-bind="etiquetaEvaluacion(fila.ev)" /></td>
                <td class="text-right"><menu-acciones :items="accionesItinerario(fila.it)" :etiqueta="`Acciones del itinerario ${fila.it.id}`" /></td>
              </tr>
              <tr v-if="!filas.length"><td colspan="7" class="sg-muted">Sin itinerarios registrados.</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Móvil y tableta: una tarjeta por itinerario, con sus acciones a la vista. -->
        <div v-else class="column q-gutter-y-md q-px-md q-pb-md">
          <div v-for="fila in filas" :key="fila.it.id" class="sg-box" :class="{ 'sg-box--resaltada': fila.it.id === itinerarioId }">
            <div class="row items-start no-wrap justify-between">
              <div class="column">
                <button type="button" class="sg-row-btn self-start" @click="seleccionar(fila.it.id)"><q-icon name="visibility" size="16px" aria-hidden="true" class="q-mr-xs" />{{ fila.it.id }} · {{ fecha(fila.it.fecha) }}</button>
                <span>{{ fila.it.proposito }}</span>
                <span class="sg-muted">{{ fila.it.destinos.join(' → ') }}</span>
              </div>
              <menu-acciones :items="accionesItinerario(fila.it)" :etiqueta="`Acciones del itinerario ${fila.it.id}`" />
            </div>
            <div class="sg-chips">
              <status-chip v-if="fila.it.anulacion" v-bind="CHIP_ANULADO" />
              <status-chip v-bind="etiquetaEvaluacion(fila.ev)" />
            </div>
            <span class="sg-muted">Previsto: {{ fila.it.previsto ? tramo(fila.it.previsto) : 'no programado' }}</span>
            <span class="sg-muted">Realizado: {{ fila.it.realizado ? tramo(fila.it.realizado) : 'no informado' }}</span>
            <span class="sg-muted">Consumo declarado: {{ fila.it.consumoDeclaradoL != null ? litros(fila.it.consumoDeclaradoL) : 'no informado' }}</span>
            <div class="row q-gutter-sm">
              <q-btn v-if="!fila.it.realizado && vigente(fila.it) && puedeHacer('itinerario.ejecucion')" dense outline no-caps color="secondary" icon="flag" label="Informar ejecución" @click="abrir('ejecucion', fila.it)" />
              <q-btn v-if="puedeRegistrarConsumo(fila.it)" dense outline no-caps color="secondary" icon="local_gas_station" label="Registrar consumo" :to="{ name: 'combustible', query: { vehiculo: vehiculoId, itinerario: fila.it.id } }" />
            </div>
          </div>
          <p v-if="!filas.length" class="sg-muted q-mb-none">Sin itinerarios registrados.</p>
        </div>
      </section-card>

      <section-card v-if="seleccion" ref="detalleRef" :titulo="`Estimación explicada · ${seleccion.it.id}`" :subtitulo="seleccion.it.proposito">
        <template #acciones>
          <q-btn v-if="!seleccion.it.realizado && !seleccion.it.anulacion && puedeHacer('itinerario.ejecucion')" unelevated color="primary" icon="flag" label="Informar ejecución" @click="abrir('ejecucion', seleccion.it)" />
          <q-btn v-if="puedeRegistrarConsumo(seleccion.it)" unelevated color="primary" icon="local_gas_station" label="Registrar consumo" :to="{ name: 'combustible', query: { vehiculo: vehiculoId, itinerario: seleccion.it.id } }" />
          <q-btn v-if="puedeCompletarRendimiento(seleccion.ev)" outline color="secondary" icon="speed" label="Completar rendimiento" :to="{ name: 'vehiculos', query: { vehiculo: vehiculoId, itinerario: seleccion.it.id } }" />
        </template>

        <note-banner v-if="seleccion.it.anulacion" tono="ne" icono="block" class="q-mb-md">
          Itinerario anulado el {{ fecha(seleccion.it.anulacion.fecha) }} por {{ seleccion.it.anulacion.por }}. Motivo: {{ seleccion.it.anulacion.motivo }}
        </note-banner>

        <q-expansion-item v-if="seleccion.it.ruta" label="Ver mapa" icon="map" class="q-mb-md" @show="mapaAbierto = true" @hide="mapaAbierto = false"><mapa-itinerario :key="seleccion.it.id" :model-value="seleccion.it.ruta" :visible="mapaAbierto" solo-lectura /></q-expansion-item>

        <template v-if="seleccion.ev.estado === 'comparable'">
          <div class="sg-calc" role="group" :aria-label="`${seleccion.ev.kmRealizados} km entre ${seleccion.ev.rendimiento} km por litro da ${litros(seleccion.ev.estimadoL)} estimados`">
            <div class="sg-calc__term"><span class="sg-kv__label">Distancia realizada</span><b>{{ seleccion.ev.kmRealizados }} km</b></div>
            <span class="sg-calc__op" aria-hidden="true">÷</span>
            <div class="sg-calc__term"><span class="sg-kv__label">Referencia</span><b>{{ seleccion.ev.rendimiento }} km/L</b></div>
            <span class="sg-calc__op" aria-hidden="true">=</span>
            <div class="sg-calc__term sg-calc__term--resultado"><span class="sg-kv__label">Estimado</span><b>{{ litros(seleccion.ev.estimadoL) }}</b></div>
          </div>
          <p class="q-mt-md">
            Consumo declarado: <strong>{{ litros(seleccion.ev.consumo) }}</strong> ·
            <status-chip :tono="Math.abs(seleccion.ev.diferenciaL) < 0.05 ? 'ok' : 'in'" :label="`Diferencia: ${litros(seleccion.ev.diferenciaL)}`" />
          </p>
          <note-banner tono="in">
            La referencia es orientativa. Las cargas al vehículo son combustible ingresado al tanque y no se comparan con un recorrido.
          </note-banner>
        </template>

        <template v-else>
          <p v-if="seleccion.ev.estado === 'solo_previsto' && seleccion.ev.estimadoPrevistoL != null">
            Estimación del recorrido previsto: <strong>{{ litros(seleccion.ev.estimadoPrevistoL) }}</strong> ({{ seleccion.it.previsto.km }} km ÷ {{ seleccion.ev.rendimiento }} km/L). Se comparará cuando se informe la ejecución.
          </p>
          <p>Información faltante para comparar:</p>
          <ul class="q-mt-none">
            <li v-for="f in seleccion.ev.faltantes" :key="f">{{ f }}</li>
          </ul>
          <note-banner tono="ne" icono="help">
            Sin esta información no se puede estimar el combustible del recorrido. No se concluye sobreconsumo ni irregularidad.
            <template v-if="puedeCompletarRendimiento(seleccion.ev)">El rendimiento de referencia se completa en los datos del vehículo.</template>
          </note-banner>
        </template>
      </section-card>
    </div>

    <itinerario-dialog v-if="vehiculo" v-model="dialogo.abierto" :vehiculo="vehiculo" :modo="dialogo.modo" :itinerario="dialogo.itinerario" @hecho="seleccionar" />
    <anular-dialog v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
  </q-page>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import RegistroNoDisponible from 'components/common/RegistroNoDisponible.vue'
import MenuAcciones from 'components/common/MenuAcciones.vue'
import FiltroInactivos from 'components/common/FiltroInactivos.vue'
import AnularDialog from 'components/common/AnularDialog.vue'
import VehiculoSelector from 'components/movilidad/VehiculoSelector.vue'
import ItinerarioDialog from 'components/movilidad/ItinerarioDialog.vue'
import MapaItinerario from 'components/movilidad/MapaItinerario.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useVehiculoSeleccionado } from 'src/composables/useVehiculoSeleccionado'
import { useAnulacion } from 'src/composables/useAnulacion'
import { itinerarioPorId, vehiculoPorId, vigente } from 'src/services/datos'
import { evaluarItinerario, itinerariosDeVehiculo } from 'src/services/combustible'
import { anular, dependenciasDeItinerario } from 'src/services/acciones'
import { CHIP_ANULADO, EVALUACIONES_COMBUSTIBLE } from 'src/config/catalogos'
import { fecha, litros } from 'src/utils/formato'
import { parametro } from 'src/utils/navegacion'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const { puedeAcceder, puedeHacer } = usePerfil()
const { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion } = useAnulacion()
// Enlace profundo (?itinerario=): el vehículo se deduce del recorrido si no se indicó.
const itinerarioPedido = parametro(route.query.itinerario)
const itinerarioSolicitado = itinerarioPedido ? itinerarioPorId(itinerarioPedido) : null
const { vehiculoId, vehiculosEnAmbito } = useVehiculoSeleccionado(parametro(route.query.vehiculo) ?? itinerarioSolicitado?.vehiculoId)
const vehiculo = computed(() => (vehiculoId.value ? vehiculoPorId(vehiculoId.value) : null))

const mostrarInactivos = ref(!!itinerarioSolicitado?.anulacion)

// En móvil y tableta las tablas anchas pasan a tarjetas, para no desplazar la página en horizontal.
const compacto = computed(() => $q.screen.lt.md)

// Salidas contextuales: declarar el consumo de un recorrido ejecutado y completar el rendimiento del vehículo.
const puedeRegistrarConsumo = (it) =>
  !!it.realizado && it.consumoDeclaradoL == null && vigente(it) && puedeHacer('combustible.informar') && puedeAcceder('combustible')
const puedeCompletarRendimiento = (ev) =>
  ev.faltantes.includes('rendimiento de referencia') && puedeHacer('vehiculo.actualizar') && puedeAcceder('vehiculos')
const detalleRef = ref(null)
const mapaAbierto = ref(false)

const filas = computed(() =>
  vehiculo.value
    ? itinerariosDeVehiculo(vehiculo.value.id, { inactivos: mostrarInactivos.value }).map((it) => ({ it, ev: evaluarItinerario(it, vehiculo.value) }))
    : []
)

// Si el recorrido pedido no existe o no se puede ver, se avisa y no se elige otro. Cambiar de vehículo retoma la selección normal.
const itinerarioNoDisponible = ref(!!itinerarioPedido && !filas.value.some((f) => f.it.id === itinerarioPedido))
const itinerarioId = ref(itinerarioNoDisponible.value ? null : itinerarioPedido)
watch(vehiculoId, () => { itinerarioNoDisponible.value = false }, { flush: 'sync' })
watch(filas, (lista) => {
  if (itinerarioNoDisponible.value) return
  if (!lista.some((f) => f.it.id === itinerarioId.value)) itinerarioId.value = lista[0]?.it.id ?? null
}, { immediate: true })
const seleccion = computed(() => filas.value.find((f) => f.it.id === itinerarioId.value) ?? null)

// En pantallas pequeñas la explicación queda debajo de la tabla: se baja hasta ella al elegir un itinerario.
async function seleccionar (id) {
  if (!id) return
  itinerarioNoDisponible.value = false
  itinerarioId.value = id
  if ($q.screen.lt.md) {
    await nextTick()
    detalleRef.value?.$el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const tramo = (t) => `${t.salida ?? '—'}–${t.llegada ?? '—'}${t.km != null ? ` · ${t.km} km` : ''}`

function etiquetaEvaluacion (ev) {
  const base = EVALUACIONES_COMBUSTIBLE[ev.estado]
  if (ev.estado === 'comparable') return { ...base, label: `${base.label} · ${litros(ev.estimadoL)} estimados` }
  if (ev.estado === 'solo_previsto') return { ...base, label: ev.estimadoPrevistoL != null ? `${base.label} · ${litros(ev.estimadoPrevistoL)}` : base.label }
  return { ...base, label: `${base.label} · falta ${ev.faltantes[0]}` }
}

const dialogo = reactive({ abierto: false, modo: 'nuevo', itinerario: null })
const abrir = (modo, itinerario) => Object.assign(dialogo, { abierto: true, modo, itinerario })

const accionesItinerario = (it) => [
  { label: 'Registrar consumo', icono: 'local_gas_station', visible: puedeRegistrarConsumo(it), accion: () => router.push({ name: 'combustible', query: { vehiculo: vehiculoId.value, itinerario: it.id } }) },
  { label: 'Informar ejecución', icono: 'flag', visible: !it.realizado && vigente(it) && puedeHacer('itinerario.ejecucion'), accion: () => abrir('ejecucion', it) },
  { label: 'Actualizar itinerario', icono: 'edit', visible: puedeHacer('itinerario.actualizar') && vigente(it), accion: () => abrir('editar', it) },
  {
    label: 'Anular itinerario',
    icono: 'block',
    peligro: true,
    visible: puedeHacer('itinerario.anular') && vigente(it),
    accion: () => pedirAnulacion({
      titulo: 'Anular itinerario',
      subtitulo: `${it.id} · ${it.proposito}`,
      dependencias: dependenciasDeItinerario(it),
      aviso: 'Para anular un itinerario con consumo declarado, anule primero ese consumo en Combustible.',
      mensaje: 'Itinerario anulado.',
      ejecutar: (datos) => anular(it, datos)
    })
  },
  {
    label: 'Reactivar itinerario',
    icono: 'restore',
    visible: puedeHacer('itinerario.anular') && !vigente(it),
    accion: () => pedirReactivacion({ entidad: 'itinerario', registro: it, nombre: 'Itinerario' })
  }
]
</script>
