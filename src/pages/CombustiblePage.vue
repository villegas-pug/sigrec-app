<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #acciones>
          <q-btn v-if="puedeAcceder('itinerarios')" outline color="secondary" icon="route" label="Itinerarios" :to="{ name: 'itinerarios', query: vehiculoId ? { vehiculo: vehiculoId } : {} }" />
          <q-btn v-if="puedeHacer('combustible.informar')" unelevated color="primary" icon="local_gas_station" label="Informar combustible" :disable="!vehiculo" @click="abrir(null)" />
        </template>
      </page-header>

      <vehiculo-selector v-model="vehiculoId" :vehiculos="vehiculosEnAmbito" />

      <template v-if="vehiculo">
        <div class="sg-kpi-panel">
          <kpi-card icono="local_gas_station" tono="azul" :valor="litros(sumar('carga'))" etiqueta="Cargado al vehículo" nota="Combustible ingresado al tanque; no equivale a consumo" />
          <kpi-card icono="speed" tono="ambar" :valor="litros(sumar('consumo'))" etiqueta="Consumo declarado en recorridos" nota="Cada recorrido se cuenta una sola vez" />
          <kpi-card icono="rule" tono="verde" :valor="`${comparables.length} de ${conConsumo.length}`" etiqueta="Recorridos comparables" nota="Con distancia, rendimiento y consumo declarado" />
        </div>

        <note-banner tono="ne" icono="straighten">
          Todas las cantidades se expresan en litros. Cargas y consumos se muestran por separado y no se restan entre sí sin una regla acordada.
        </note-banner>

        <section-card titulo="Registros de combustible" sin-relleno>
          <template #acciones>
            <filtro-inactivos v-model="mostrarInactivos" />
          </template>
          <div class="sg-table-wrap">
            <table class="sg-table">
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Significado</th>
                  <th scope="col" class="sg-num">Cantidad</th>
                  <th scope="col">Relacionado con</th>
                  <th scope="col">Sustento</th>
                  <th scope="col"><span class="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in registros" :key="r.id">
                  <td>{{ fecha(r.fecha) }}</td>
                  <td>
                    <status-chip :tono="r.tipo === 'carga' ? 'in' : 'ne'" :label="r.tipo === 'carga' ? 'Carga al vehículo' : 'Consumo declarado'" />
                    <status-chip v-if="r.anulacion" v-bind="CHIP_ANULADO" class="q-ml-xs" />
                  </td>
                  <td class="sg-num">{{ litros(r.cantidad) }}</td>
                  <td>
                    <template v-if="r.itinerarioId">
                      {{ r.itinerarioId }}
                      <span v-if="itinerarioPorId(r.itinerarioId)?.realizado?.km != null" class="sg-muted"> · {{ itinerarioPorId(r.itinerarioId).realizado.km }} km</span>
                      <span v-else class="text-weight-bold sg-aviso-texto"> · sin distancia</span>
                    </template>
                    <span v-else class="sg-muted">{{ vehiculo.id }} · sin recorrido asociado</span>
                  </td>
                  <td>{{ r.sustento || '—' }}</td>
                  <td class="text-right"><menu-acciones :items="accionesRegistro(r)" :etiqueta="`Acciones del registro ${r.id}`" /></td>
                </tr>
                <tr v-if="!registros.length"><td colspan="6" class="sg-muted">Sin registros de combustible.</td></tr>
              </tbody>
            </table>
          </div>
        </section-card>

        <section-card titulo="Comparación por recorrido" subtitulo="Estimación = distancia realizada ÷ rendimiento de referencia (orientativo)" sin-relleno>
          <div class="sg-table-wrap">
            <table class="sg-table">
              <thead>
                <tr><th scope="col">Recorrido</th><th scope="col" class="sg-num">Consumo declarado</th><th scope="col" class="sg-num">Estimado</th><th scope="col" class="sg-num">Diferencia</th><th scope="col">Lectura</th></tr>
              </thead>
              <tbody>
                <tr v-for="{ it, ev } in conConsumo" :key="it.id">
                  <td>{{ it.id }}<div class="sg-muted">{{ fecha(it.fecha) }} · {{ it.proposito }}</div></td>
                  <td class="sg-num">{{ litros(ev.consumo) }}</td>
                  <td class="sg-num">{{ ev.estimadoL != null ? litros(ev.estimadoL) : '—' }}</td>
                  <td class="sg-num">{{ ev.diferenciaL != null ? litros(ev.diferenciaL) : '—' }}</td>
                  <td>
                    <span v-if="ev.estado === 'comparable'">{{ ev.kmRealizados }} km ÷ {{ ev.rendimiento }} km/L = {{ litros(ev.estimadoL) }}.</span>
                    <span v-else>No comparable: falta {{ ev.faltantes.join(' y ') }}. No se concluye sobreconsumo ni irregularidad.</span>
                  </td>
                </tr>
                <tr v-if="!conConsumo.length"><td colspan="5" class="sg-muted">Sin consumos declarados.</td></tr>
              </tbody>
            </table>
          </div>
        </section-card>
      </template>
    </div>

    <combustible-dialog v-if="vehiculo" v-model="dialogo.abierto" :vehiculo="vehiculo" :registro="dialogo.registro" />
    <anular-dialog v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
  </q-page>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import KpiCard from 'components/common/KpiCard.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import MenuAcciones from 'components/common/MenuAcciones.vue'
import FiltroInactivos from 'components/common/FiltroInactivos.vue'
import AnularDialog from 'components/common/AnularDialog.vue'
import VehiculoSelector from 'components/movilidad/VehiculoSelector.vue'
import CombustibleDialog from 'components/movilidad/CombustibleDialog.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useVehiculoSeleccionado } from 'src/composables/useVehiculoSeleccionado'
import { useAnulacion } from 'src/composables/useAnulacion'
import { itinerarioPorId, vehiculoPorId, vigente } from 'src/services/datos'
import { evaluarItinerario, itinerariosDeVehiculo, registrosDeVehiculo } from 'src/services/combustible'
import { anularCombustible, reactivarCombustible } from 'src/services/acciones'
import { CHIP_ANULADO } from 'src/config/catalogos'
import { fecha, litros } from 'src/utils/formato'

const route = useRoute()
const { puedeAcceder, puedeHacer } = usePerfil()
const { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion } = useAnulacion()
const { vehiculoId, vehiculosEnAmbito } = useVehiculoSeleccionado(route.query.vehiculo)
const vehiculo = computed(() => (vehiculoId.value ? vehiculoPorId(vehiculoId.value) : null))

const mostrarInactivos = ref(false)

const registros = computed(() => (vehiculo.value ? registrosDeVehiculo(vehiculo.value.id, { inactivos: mostrarInactivos.value }) : []))
// Los totales cuentan solo los registros vigentes.
const sumar = (tipo) => registros.value.filter((r) => vigente(r) && r.tipo === tipo).reduce((s, r) => s + r.cantidad, 0)

const evaluados = computed(() =>
  vehiculo.value ? itinerariosDeVehiculo(vehiculo.value.id).map((it) => ({ it, ev: evaluarItinerario(it, vehiculo.value) })) : []
)
const conConsumo = computed(() => evaluados.value.filter((e) => e.it.consumoDeclaradoL != null))
const comparables = computed(() => conConsumo.value.filter((e) => e.ev.estado === 'comparable'))

const dialogo = reactive({ abierto: false, registro: null })
const abrir = (registro) => Object.assign(dialogo, { abierto: true, registro })

const accionesRegistro = (r) => [
  { label: 'Actualizar registro', icono: 'edit', visible: puedeHacer('combustible.actualizar') && vigente(r), accion: () => abrir(r) },
  {
    label: 'Anular registro',
    icono: 'block',
    peligro: true,
    visible: puedeHacer('combustible.anular') && vigente(r),
    accion: () => pedirAnulacion({
      titulo: 'Anular registro de combustible',
      subtitulo: `${r.id} · ${litros(r.cantidad)} · ${fecha(r.fecha)}`,
      aviso: r.tipo === 'consumo'
        ? 'El consumo se desvincula del recorrido, que queda libre para declarar otro consumo.'
        : 'La carga deja de sumarse al total cargado al vehículo.',
      mensaje: 'Registro de combustible anulado.',
      ejecutar: (datos) => anularCombustible(r, datos)
    })
  },
  {
    label: 'Reactivar registro',
    icono: 'restore',
    visible: puedeHacer('combustible.anular') && !vigente(r),
    accion: () => pedirReactivacion({ entidad: 'combustible', registro: r, nombre: 'Registro de combustible', accion: reactivarCombustible })
  }
]
</script>
