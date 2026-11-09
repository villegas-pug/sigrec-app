<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #ayuda>
          Todas las cantidades se expresan en litros. Cargas y consumos se muestran por separado y no se restan entre sí sin una regla acordada.
          Un recorrido solo es comparable si tiene distancia, rendimiento de referencia y consumo declarado.
        </template>
        <template #acciones>
          <q-btn v-if="puedeAcceder('itinerarios')" outline color="secondary" icon="route" label="Itinerarios" :to="{ name: 'itinerarios', query: vehiculoId ? { vehiculo: vehiculoId } : {} }" />
          <q-btn v-if="puedeHacer('combustible.informar')" unelevated color="primary" icon="local_gas_station" label="Informar combustible" :disable="!vehiculo" @click="abrir(null)" />
        </template>
      </page-header>

      <registro-no-disponible v-if="itinerarioNoDisponible" entidad="El recorrido" :id="itinerarioPedido" :volver="{ name: 'combustible' }" etiqueta-volver="Ver el combustible del vehículo" />
      <note-banner v-else-if="avisoRecorrido" tono="ne" icono="route">
        {{ avisoRecorrido }}
        <router-link v-if="puedeAcceder('itinerarios')" :to="{ name: 'itinerarios', query: { vehiculo: vehiculoId, itinerario: itinerarioPedido } }" class="text-weight-bold">Ver el recorrido</router-link>
      </note-banner>

      <vehiculo-selector v-model="vehiculoId" :vehiculos="vehiculosEnAmbito" />

      <template v-if="vehiculo">
        <div class="sg-kpi-panel">
          <kpi-card icono="local_gas_station" tono="azul" :valor="litros(sumar('carga'))" etiqueta="Cargado al vehículo" nota="Combustible ingresado al tanque; no equivale a consumo" />
          <kpi-card icono="speed" tono="ambar" :valor="litros(sumar('consumo'))" etiqueta="Consumo declarado en recorridos" nota="Cada recorrido se cuenta una sola vez" />
          <kpi-card icono="rule" tono="verde" :valor="`${comparables.length} de ${conConsumo.length}`" etiqueta="Recorridos comparables" nota="Con distancia, rendimiento y consumo declarado" />
        </div>


        <section-card titulo="Registros de combustible" sin-relleno>
          <template #acciones>
            <filtro-inactivos v-model="mostrarInactivos" />
          </template>
          <div v-if="!$q.screen.lt.sm" class="sg-table-wrap">
            <table class="sg-table">
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Significado</th>
                  <th scope="col" class="sg-num">Cantidad</th>
                  <th scope="col">Relacionado con</th>
                  <th scope="col">Sustento</th>
                  <th scope="col">Informado por</th>
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
                  <td>{{ r.informadoPor || '—' }}</td>
                  <td class="text-right"><menu-acciones :items="accionesRegistro(r)" :etiqueta="`Acciones del registro ${r.id}`" /></td>
                </tr>
                <tr v-if="!registros.length"><td colspan="7" class="sg-muted">Sin registros de combustible.</td></tr>
              </tbody>
            </table>
          </div>
          <div v-else class="column q-gutter-y-md q-px-md q-pb-md">
            <div v-for="r in registros" :key="r.id" class="sg-box">
              <div class="row items-start no-wrap justify-between">
                <div class="column">
                  <span class="text-weight-bold">{{ litros(r.cantidad) }} · {{ fecha(r.fecha) }}</span>
                  <span class="sg-muted">{{ r.itinerarioId ? `Recorrido ${r.itinerarioId}` : `${vehiculo.id} · sin recorrido asociado` }}</span>
                </div>
                <menu-acciones :items="accionesRegistro(r)" :etiqueta="`Acciones del registro ${r.id}`" />
              </div>
              <div class="sg-chips">
                <status-chip :tono="r.tipo === 'carga' ? 'in' : 'ne'" :label="r.tipo === 'carga' ? 'Carga al vehículo' : 'Consumo declarado'" />
                <status-chip v-if="r.anulacion" v-bind="CHIP_ANULADO" />
              </div>
              <span v-if="r.sustento" class="sg-muted">Sustento: {{ r.sustento }}</span>
              <span class="sg-muted">Informado por: {{ r.informadoPor || '—' }}</span>
            </div>
            <p v-if="!registros.length" class="sg-muted q-mb-none">Sin registros de combustible.</p>
          </div>
        </section-card>

        <section-card titulo="Comparación por recorrido" subtitulo="Estimación = distancia realizada ÷ rendimiento de referencia (orientativo)" sin-relleno>
          <div v-if="!$q.screen.lt.sm" class="sg-table-wrap">
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
                    <router-link v-if="completarRendimiento(ev)" :to="{ name: 'vehiculos', query: { vehiculo: vehiculo.id, itinerario: it.id } }" class="q-ml-xs">Completar rendimiento</router-link>
                  </td>
                </tr>
                <tr v-if="!conConsumo.length"><td colspan="5" class="sg-muted">Sin consumos declarados.</td></tr>
              </tbody>
            </table>
          </div>
          <div v-else class="column q-gutter-y-md q-px-md q-pb-md">
            <div v-for="{ it, ev } in conConsumo" :key="it.id" class="sg-box">
              <span class="text-weight-bold">{{ it.id }} · {{ fecha(it.fecha) }}</span>
              <span class="sg-muted">{{ it.proposito }}</span>
              <span>Consumo declarado: {{ litros(ev.consumo) }}<template v-if="ev.estimadoL != null"> · estimado {{ litros(ev.estimadoL) }}</template></span>
              <span v-if="ev.estado === 'comparable'" class="sg-muted">{{ ev.kmRealizados }} km ÷ {{ ev.rendimiento }} km/L = {{ litros(ev.estimadoL) }}.</span>
              <span v-else class="sg-muted">No comparable: falta {{ ev.faltantes.join(' y ') }}. No se concluye sobreconsumo ni irregularidad.</span>
              <router-link v-if="completarRendimiento(ev)" :to="{ name: 'vehiculos', query: { vehiculo: vehiculo.id, itinerario: it.id } }">Completar rendimiento</router-link>
            </div>
            <p v-if="!conConsumo.length" class="sg-muted q-mb-none">Sin consumos declarados.</p>
          </div>
        </section-card>
      </template>
    </div>

    <combustible-dialog v-if="vehiculo" v-model="dialogo.abierto" :vehiculo="vehiculo" :registro="dialogo.registro" :itinerario-inicial="dialogo.itinerarioInicial" :con-retorno="dialogo.conRetorno" />
    <anular-dialog v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import KpiCard from 'components/common/KpiCard.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import RegistroNoDisponible from 'components/common/RegistroNoDisponible.vue'
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
import { parametro } from 'src/utils/navegacion'
import { primeraVisita } from 'src/router/retorno'

const route = useRoute()
const { perfil, puedeAcceder, puedeHacer } = usePerfil()
const { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion } = useAnulacion()
// Enlace profundo (?itinerario=): el vehículo se deduce del recorrido y, si puede declararse su consumo, se abre el formulario con él.
const itinerarioPedido = parametro(route.query.itinerario)
const itinerarioSolicitado = itinerarioPedido ? itinerarioPorId(itinerarioPedido) : null
const { vehiculoId, vehiculosEnAmbito } = useVehiculoSeleccionado(parametro(route.query.vehiculo) ?? itinerarioSolicitado?.vehiculoId)
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

// `conRetorno`: el formulario lo abrió un enlace desde otra pantalla; al guardar se ofrece volver a ella.
const dialogo = reactive({ abierto: false, registro: null, itinerarioInicial: null, conRetorno: false })
const abrir = (registro, itinerarioInicial = null, conRetorno = false) => Object.assign(dialogo, { abierto: true, registro, itinerarioInicial, conRetorno })

// El recorrido pedido debe pertenecer a un vehículo del ámbito; si no, no se muestra ni se elige otro.
const itinerarioNoDisponible = ref(!!itinerarioPedido && (!itinerarioSolicitado || itinerarioSolicitado.vehiculoId !== vehiculoId.value))
watch(vehiculoId, () => { itinerarioNoDisponible.value = false })

// Un recorrido sin ejecución informada o con consumo ya declarado no admite un consumo nuevo: se explica por qué.
const avisoRecorrido = computed(() => {
  const it = itinerarioSolicitado
  if (!it || itinerarioNoDisponible.value || it.vehiculoId !== vehiculoId.value) return ''
  if (!it.realizado) return `El recorrido ${it.id} aún no tiene ejecución informada: infórmela antes de declarar su consumo.`
  if (it.consumoDeclaradoL != null) return `El recorrido ${it.id} ya tiene un consumo declarado (${litros(it.consumoDeclaradoL)}).`
  return ''
})

// El formulario pedido por el enlace se abre una sola vez: al volver a esta entrada no se reabre (SPEC 011, Ola 5).
// Si se abrió desde otra pantalla, al guardar se ofrece volver a ella.
const llegadaNueva = primeraVisita()
onMounted(() => {
  const it = itinerarioSolicitado
  if (llegadaNueva && it && !itinerarioNoDisponible.value && !avisoRecorrido.value && vigente(it) && puedeHacer('combustible.informar')) abrir(null, it.id, true)
})

// La referencia de rendimiento se completa en los datos del vehículo.
const completarRendimiento = (ev) => ev.faltantes?.includes('rendimiento de referencia') && puedeAcceder('vehiculos') && puedeHacer('vehiculo.actualizar')

// Actualiza cualquier registro vigente quien tiene `combustible.actualizar`; con `actualizarPropio`, solo los que informó el perfil activo.
const puedeActualizar = (r) =>
  vigente(r) && (puedeHacer('combustible.actualizar') || (puedeHacer('combustible.actualizarPropio') && r.informadoPor === perfil.value.nombre))

const accionesRegistro = (r) => [
  { label: 'Actualizar registro', icono: 'edit', visible: puedeActualizar(r), accion: () => abrir(r) },
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
      ejecutar: (datos) => anularCombustible(r, datos),
      deshacer: () => reactivarCombustible(r)
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
