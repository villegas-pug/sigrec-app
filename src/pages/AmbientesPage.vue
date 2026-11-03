<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #acciones>
          <q-btn v-if="puedeHacer('ambiente.registrar')" outline color="secondary" icon="add_home" label="Registrar ambiente" :disable="!car" @click="abrirAmbiente(null)" />
          <q-btn v-if="puedeHacer('novedad.registrar')" unelevated color="primary" icon="add_alert" label="Registrar novedad" :disable="!ambienteActivo" @click="abrirNovedad(null)" />
        </template>
      </page-header>

      <registro-no-disponible v-if="pedidoNoDisponible" :entidad="pedidoNoDisponible.entidad" :id="pedidoNoDisponible.id" :volver="{ name: 'ambientes' }" etiqueta-volver="Ver los ambientes del centro" />

      <div class="sg-filters">
        <q-select v-model="carId" :options="opcionesCar" emit-value map-options outlined dense label="Centro" />
        <div class="row items-center"><filtro-inactivos v-model="mostrarInactivos" /></div>
      </div>

      <section-card titulo="Ambientes del centro" :subtitulo="car ? `${car.nombre} · ${plural(ambientes.length, 'ambiente', 'ambientes')}` : 'Sin centro seleccionado'" sin-relleno>
        <div v-if="!$q.screen.lt.sm" class="sg-table-wrap">
          <table class="sg-table">
            <thead>
              <tr>
                <th scope="col">Ambiente</th>
                <th scope="col">Características</th>
                <th scope="col">Condición</th>
                <th scope="col">Novedades abiertas</th>
                <th scope="col">Último pintado</th>
                <th scope="col" class="sg-num">Bienes activos</th>
                <th scope="col"><span class="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="amb in ambientes" :key="amb.id" :class="{ 'sg-row--selected': amb.id === ambienteId }">
                <td>
                  <button type="button" class="sg-row-btn" @click="seleccionar(amb.id)">{{ amb.nombre }}</button>
                  <div class="sg-muted">{{ ubicacionTexto(amb) }}</div>
                  <status-chip v-if="amb.anulacion" v-bind="CHIP_ANULADO" />
                </td>
                <td>{{ caracteristicas(amb) }}</td>
                <td><status-chip v-bind="condicion(amb.condicion)" /></td>
                <td>
                  <div class="sg-chips">
                    <status-chip v-for="n in abiertas(amb)" :key="n.id" tono="da" :label="n.titulo" />
                    <span v-if="!abiertas(amb).length" class="sg-muted">Sin novedades</span>
                  </div>
                </td>
                <td>
                  <template v-if="amb.ultimoPintado">{{ fecha(amb.ultimoPintado) }}</template>
                  <status-chip v-else tono="si" label="Fecha no informada" />
                </td>
                <td class="sg-num">
                  <router-link v-if="puedeAcceder('bienes')" :to="{ name: 'bienes', query: { car: carId, ambiente: amb.id } }">{{ activos(amb) }}</router-link>
                  <template v-else>{{ activos(amb) }}</template>
                </td>
                <td class="text-right"><menu-acciones :items="accionesAmbiente(amb)" :etiqueta="`Acciones de ${amb.nombre}`" /></td>
              </tr>
              <tr v-if="!ambientes.length"><td colspan="7" class="sg-muted">El centro aún no tiene ambientes registrados.</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Móvil: una tarjeta por ambiente, con sus acciones a la vista. -->
        <div v-else class="column q-gutter-y-md q-px-md q-pb-md">
          <div v-for="amb in ambientes" :key="amb.id" class="sg-box" :class="{ 'sg-box--resaltada': amb.id === ambienteId }">
            <div class="row items-start no-wrap justify-between">
              <div class="column">
                <button type="button" class="sg-row-btn self-start" @click="seleccionar(amb.id)">{{ amb.nombre }}</button>
                <span class="sg-muted">{{ ubicacionTexto(amb) }}</span>
              </div>
              <menu-acciones :items="accionesAmbiente(amb)" :etiqueta="`Acciones de ${amb.nombre}`" />
            </div>
            <div class="sg-chips">
              <status-chip v-bind="condicion(amb.condicion)" />
              <status-chip v-if="amb.anulacion" v-bind="CHIP_ANULADO" />
              <status-chip v-for="n in abiertas(amb)" :key="n.id" tono="da" :label="n.titulo" />
            </div>
            <span class="sg-muted">{{ caracteristicas(amb) }}</span>
            <span class="sg-muted">Último pintado: {{ amb.ultimoPintado ? fecha(amb.ultimoPintado) : 'fecha no informada' }}</span>
            <router-link v-if="puedeAcceder('bienes')" :to="{ name: 'bienes', query: { car: carId, ambiente: amb.id } }">{{ plural(activos(amb), 'bien activo', 'bienes activos') }}</router-link>
            <span v-else class="sg-muted">{{ plural(activos(amb), 'bien activo', 'bienes activos') }}</span>
          </div>
          <p v-if="!ambientes.length" class="sg-muted q-mb-none">El centro aún no tiene ambientes registrados.</p>
        </div>
      </section-card>

      <template v-if="ambiente">
        <section-card ref="detalleRef" :titulo="`Ficha del ambiente · ${ambiente.nombre}`" :subtitulo="textoUbicacion(ubicacionDeAmbiente(ambiente.id))">
          <template #acciones>
            <q-btn v-if="puedeHacer('ambiente.actualizar')" outline color="secondary" icon="edit" label="Actualizar ambiente" :disable="!ambienteActivo" @click="abrirAmbiente(ambiente)" />
          </template>
          <note-banner v-if="ambiente.anulacion" tono="ne" icono="block" class="q-mb-md">
            Ambiente anulado el {{ fecha(ambiente.anulacion.fecha) }} por {{ ambiente.anulacion.por }}. Motivo: {{ ambiente.anulacion.motivo }}
          </note-banner>
          <div class="sg-kv-grid">
            <key-value etiqueta="Piso">
              <template v-if="ambiente.piso != null">{{ ambiente.piso }}</template>
              <status-chip v-else tono="si" label="No informado" />
            </key-value>
            <key-value etiqueta="Bloque">
              <template v-if="ambiente.bloque">{{ ambiente.bloque }}</template>
              <status-chip v-else tono="si" label="No informado" />
            </key-value>
            <key-value etiqueta="Ubicación">
              <template v-if="ambiente.ubicacion">{{ ambiente.ubicacion }}</template>
              <status-chip v-else tono="si" label="No informada" />
            </key-value>
            <key-value etiqueta="Características">{{ caracteristicas(ambiente) }}</key-value>
            <key-value etiqueta="Condición"><status-chip v-bind="condicion(ambiente.condicion)" /></key-value>
            <key-value etiqueta="Último pintado">
              <template v-if="ambiente.ultimoPintado">{{ fecha(ambiente.ultimoPintado) }}</template>
              <status-chip v-else tono="si" label="Fecha no informada" />
            </key-value>
          </div>
        </section-card>

        <galeria-fotos v-if="car" :centro="car" :ambiente-id="ambiente.id" :titulo="`Fotografías de ${ambiente.nombre}`" />

        <section-card :titulo="`Bienes del ambiente (${bienes.length})`" subtitulo="Inventario directo del ambiente; un componente asociado indica el bien del que forma parte" sin-relleno>
          <template #acciones>
            <q-btn v-if="puedeHacer('bien.registrar') && puedeAcceder('registro')" unelevated color="primary" icon="playlist_add" label="Registrar bien" :disable="!ambienteActivo" :to="{ name: 'registro', query: { car: carId, ambiente: ambiente.id } }" />
          </template>
          <div v-for="b in bienes" :key="b.id" class="sg-borde-superior row items-center justify-between q-px-md q-py-sm">
            <div class="column">
              <router-link v-if="puedeAcceder('bienes')" :to="{ name: 'bienes', query: { bien: b.id } }" class="text-weight-bold">{{ b.nombre }} · {{ b.id }}</router-link>
              <span v-else class="text-weight-bold">{{ b.nombre }} · {{ b.id }}</span>
              <span v-if="b.asociadoA" class="sg-muted">Componente asociado a {{ b.asociadoA.bienId }}<template v-if="b.asociadoA.posicion"> ({{ b.asociadoA.posicion }})</template></span>
            </div>
            <div class="sg-chips">
              <status-chip v-bind="condicion(b.condicion)" />
              <status-chip v-bind="SITUACIONES[b.situacion]" />
            </div>
          </div>
          <p v-if="!bienes.length" class="q-pa-md sg-muted q-mb-none">El ambiente aún no tiene bienes registrados.</p>
        </section-card>

        <section-card :titulo="`${ambiente.nombre} · novedades y antecedentes`">
          <template #acciones>
            <q-btn v-if="puedeHacer('intervencion.registrar')" outline color="secondary" icon="format_paint" label="Registrar intervención" :disable="!ambienteActivo" @click="abrirIntervencion(null)" />
          </template>
          <div class="sg-grid-2">
            <div class="column q-gutter-y-sm">
              <h3 class="sg-kv__label q-my-none">Novedades</h3>
              <div v-for="n in novedades" :id="`novedad-${n.id}`" :key="n.id" class="sg-box" :class="{ 'sg-box--resaltada': n.id === novedadResaltada }">
                <div class="row items-start no-wrap justify-between">
                  <div class="sg-chips items-center">
                    <status-chip :tono="n.atendida ? 'ok' : 'da'" :label="n.atendida ? 'Atendida' : 'Abierta'" />
                    <status-chip v-if="n.anulacion" v-bind="CHIP_ANULADO" />
                    <span class="text-weight-bold">{{ n.titulo }}</span>
                  </div>
                  <menu-acciones :items="accionesNovedad(n)" :etiqueta="`Acciones de la novedad ${n.titulo}`" />
                </div>
                <span class="sg-muted">{{ TIPOS_NOVEDAD[n.tipo] ?? n.tipo }}</span>
                <span>{{ n.detalle }} Ubicación: {{ n.ubicacion }}.</span>
                <span class="sg-muted">Informada el {{ fecha(n.fecha) }} por {{ n.informadoPor }}</span>
                <span v-if="n.atencion" class="sg-muted">Atendida el {{ fecha(n.atencion.fecha) }}<template v-if="n.atencion.detalle">: {{ n.atencion.detalle }}</template></span>
                <span v-if="n.anulacion" class="sg-muted">Anulada el {{ fecha(n.anulacion.fecha) }}: {{ n.anulacion.motivo }}</span>
                <div v-if="n.requiereEvaluacion && !n.atendida && !n.anulacion" class="sg-chips">
                  <status-chip tono="in" label="Necesidad de infraestructura: requiere evaluación" />
                  <status-chip tono="si" label="Costo no estimado" />
                </div>
              </div>
              <p v-if="!novedades.length" class="sg-muted">Sin novedades registradas.</p>
            </div>
            <div class="column q-gutter-y-sm">
              <h3 class="sg-kv__label q-my-none">Antecedentes de intervenciones</h3>
              <div v-for="(i, idx) in intervenciones" :key="idx" class="sg-box">
                <div class="row items-center no-wrap justify-between">
                  <span>{{ i.descripcion }}</span>
                  <span class="row items-center no-wrap">
                    <span v-if="i.fecha" class="text-weight-bold">{{ fecha(i.fecha) }}</span>
                    <status-chip v-else tono="si" label="Fecha no informada" />
                    <menu-acciones :items="accionesIntervencion(i)" :etiqueta="`Acciones de la intervención ${i.descripcion}`" />
                  </span>
                </div>
                <div v-if="i.anulacion" class="sg-chips items-center">
                  <status-chip v-bind="CHIP_ANULADO" />
                  <span class="sg-muted">{{ i.anulacion.motivo }}</span>
                </div>
              </div>
              <p v-if="!intervenciones.length" class="sg-muted">Sin antecedentes de intervenciones.</p>
            </div>
          </div>
        </section-card>
      </template>
    </div>

    <ambiente-dialog v-if="car" v-model="dialogoAmbiente.abierto" :centro="car" :ambiente="dialogoAmbiente.ambiente" @hecho="seleccionar" />
    <novedad-dialog v-if="ambiente" v-model="dialogoNovedad.abierto" :ambiente="ambiente" :novedad="dialogoNovedad.novedad" />
    <intervencion-dialog v-if="ambiente" v-model="dialogoIntervencion.abierto" :ambiente="ambiente" :intervencion="dialogoIntervencion.intervencion" />
    <atencion-dialog v-if="dialogoAtencion.novedad" v-model="dialogoAtencion.abierto" :novedad="dialogoAtencion.novedad" />
    <pendientes-ambiente-dialog v-if="dialogoPendientes.ambiente" v-model="dialogoPendientes.abierto" :ambiente="dialogoPendientes.ambiente" @continuar="pedirAnulacionAmbiente(dialogoPendientes.ambiente)" />
    <anular-dialog v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
  </q-page>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import KeyValue from 'components/common/KeyValue.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import RegistroNoDisponible from 'components/common/RegistroNoDisponible.vue'
import MenuAcciones from 'components/common/MenuAcciones.vue'
import FiltroInactivos from 'components/common/FiltroInactivos.vue'
import AnularDialog from 'components/common/AnularDialog.vue'
import AmbienteDialog from 'components/centros/AmbienteDialog.vue'
import NovedadDialog from 'components/centros/NovedadDialog.vue'
import IntervencionDialog from 'components/centros/IntervencionDialog.vue'
import AtencionDialog from 'components/centros/AtencionDialog.vue'
import GaleriaFotos from 'components/centros/GaleriaFotos.vue'
import PendientesAmbienteDialog from 'components/centros/PendientesAmbienteDialog.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useCentroSeleccionado } from 'src/composables/useCentroSeleccionado'
import { useAnulacion } from 'src/composables/useAnulacion'
import { ambientePorId, ambientesDeCar, db, bienesDeAmbiente, textoUbicacion, ubicacionDeAmbiente, vigente } from 'src/services/datos'
import { anular, anularAmbiente, dependenciasDeAmbiente, pendientesDeAmbiente } from 'src/services/acciones'
import { CHIP_ANULADO, SITUACIONES, TIPOS_NOVEDAD, condicion } from 'src/config/catalogos'
import { fecha, plural } from 'src/utils/formato'
import { parametro } from 'src/utils/navegacion'

const $q = useQuasar()
const route = useRoute()
const { puedeAcceder, puedeHacer } = usePerfil()
const { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion } = useAnulacion()

// Enlaces profundos (?ambiente=&novedad=): el ambiente y el centro se deducen de la novedad si no se indicaron.
const novedadPedida = parametro(route.query.novedad)
const ambienteDeNovedad = novedadPedida ? db.ambientes.find((a) => a.novedades?.some((n) => n.id === novedadPedida)) : null
const ambientePedido = ambienteDeNovedad?.id ?? parametro(route.query.ambiente)
const { carId, car, opcionesCar } = useCentroSeleccionado(parametro(route.query.car) ?? ambienteDeNovedad?.carId)

const anuladoPedido = !!(ambientePorId(ambientePedido)?.anulacion || ambienteDeNovedad?.novedades.find((n) => n.id === novedadPedida)?.anulacion)
const mostrarInactivos = ref(anuladoPedido)
const detalleRef = ref(null)

const ambientes = computed(() => (carId.value ? ambientesDeCar(carId.value, { inactivos: mostrarInactivos.value }) : []))

// Si lo pedido no existe o no se puede ver, se avisa y no se elige otro ambiente hasta que el usuario cambie de selección.
const pedidoNoDisponible = ref(
  novedadPedida && !ambientes.value.some((a) => a.id === ambienteDeNovedad?.id) ? { entidad: 'La novedad', id: novedadPedida }
    : ambientePedido && !ambientes.value.some((a) => a.id === ambientePedido) ? { entidad: 'El ambiente', id: ambientePedido }
      : null
)
const ambienteId = ref(pedidoNoDisponible.value ? null : ambientePedido ?? ambientes.value[0]?.id ?? null)
const novedadResaltada = pedidoNoDisponible.value ? null : novedadPedida
watch(carId, () => { pedidoNoDisponible.value = null }, { flush: 'sync' })
const ambiente = computed(() => (ambienteId.value ? ambientePorId(ambienteId.value) : null))
const ambienteActivo = computed(() => !!ambiente.value && vigente(ambiente.value))

// Al cambiar de centro o de filtro se conserva el ambiente si sigue visible; si no, se elige el primero.
watch(ambientes, (lista) => {
  if (pedidoNoDisponible.value) return
  if (!lista.some((a) => a.id === ambienteId.value)) ambienteId.value = lista[0]?.id ?? null
})

// Bienes del ambiente; los anulados por error solo se ven con «Mostrar inactivos».
const bienes = computed(() => (ambiente.value ? bienesDeAmbiente(ambiente.value.id) : []).filter((b) => mostrarInactivos.value || b.situacion !== 'anulado'))

const ubicacionTexto = (amb) => [`Piso ${amb.piso ?? '—'}`, amb.bloque, amb.ubicacion].filter(Boolean).join(' · ')

const novedades = computed(() => (ambiente.value?.novedades ?? []).filter((n) => mostrarInactivos.value || vigente(n)))
const intervenciones = computed(() => (ambiente.value?.intervenciones ?? []).filter((i) => mostrarInactivos.value || vigente(i)))

const caracteristicas = (amb) =>
  [
    amb.areaM2 != null ? `${amb.areaM2} m²` : null,
    amb.ventanas != null ? plural(amb.ventanas, 'ventana', 'ventanas') : null,
    amb.puertas != null ? plural(amb.puertas, 'puerta', 'puertas') : null
  ].filter(Boolean).join(', ') || 'No informadas'

const abiertas = (amb) => amb.novedades.filter((n) => vigente(n) && !n.atendida)
const activos = (amb) => bienesDeAmbiente(amb.id).filter((b) => b.situacion === 'activo').length

// En pantallas pequeñas el detalle queda debajo de la tabla: se baja hasta él al elegir un ambiente.
async function seleccionar (id) {
  pedidoNoDisponible.value = null
  ambienteId.value = id
  if ($q.screen.lt.md) {
    await nextTick()
    detalleRef.value?.$el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Con ?novedad= se baja hasta la novedad resaltada.
onMounted(async () => {
  if (!novedadResaltada) return
  await nextTick()
  document.getElementById(`novedad-${novedadResaltada}`)?.scrollIntoView({ block: 'center' })
})

const dialogoAmbiente = reactive({ abierto: false, ambiente: null })
const dialogoNovedad = reactive({ abierto: false, novedad: null })
const dialogoIntervencion = reactive({ abierto: false, intervencion: null })
const dialogoAtencion = reactive({ abierto: false, novedad: null })
const dialogoPendientes = reactive({ abierto: false, ambiente: null })

const abrirAmbiente = (amb) => Object.assign(dialogoAmbiente, { abierto: true, ambiente: amb })
const abrirNovedad = (novedad) => Object.assign(dialogoNovedad, { abierto: true, novedad })
const abrirIntervencion = (intervencion) => Object.assign(dialogoIntervencion, { abierto: true, intervencion })
const abrirAtencion = (novedad) => Object.assign(dialogoAtencion, { abierto: true, novedad })

// Un ambiente con bienes por resolver no se anula: primero se reubican o se dan de baja uno por uno.
function iniciarAnulacion (amb) {
  if (pendientesDeAmbiente(amb).length) {
    Object.assign(dialogoPendientes, { abierto: true, ambiente: amb })
    return
  }
  pedirAnulacionAmbiente(amb)
}

const pedirAnulacionAmbiente = (amb) => pedirAnulacion({
  titulo: 'Anular ambiente',
  subtitulo: `${amb.nombre} · ${amb.id}`,
  dependencias: dependenciasDeAmbiente(amb),
  aviso: 'El ambiente y su historial se conservan; deja de ofrecerse para registrar bienes y puede reactivarse con «Mostrar inactivos».',
  mensaje: 'Ambiente anulado.',
  ejecutar: (datos) => anularAmbiente(amb, datos)
})

const accionesAmbiente = (amb) => [
  { label: 'Actualizar ambiente', icono: 'edit', visible: puedeHacer('ambiente.actualizar') && vigente(amb), accion: () => abrirAmbiente(amb) },
  {
    label: 'Anular ambiente',
    icono: 'block',
    peligro: true,
    visible: puedeHacer('ambiente.anular') && vigente(amb),
    accion: () => iniciarAnulacion(amb)
  },
  {
    label: 'Reactivar ambiente',
    icono: 'restore',
    visible: puedeHacer('ambiente.anular') && !vigente(amb),
    accion: () => pedirReactivacion({ entidad: 'ambiente', registro: amb, nombre: 'Ambiente' })
  }
]

const accionesNovedad = (n) => [
  { label: 'Actualizar novedad', icono: 'edit', visible: puedeHacer('novedad.actualizar') && vigente(n), accion: () => abrirNovedad(n) },
  { label: 'Marcar como atendida', icono: 'task_alt', visible: puedeHacer('novedad.atender') && vigente(n) && !n.atendida, accion: () => abrirAtencion(n) },
  {
    label: 'Anular novedad',
    icono: 'block',
    peligro: true,
    visible: puedeHacer('novedad.anular') && vigente(n),
    accion: () => pedirAnulacion({
      titulo: 'Anular novedad',
      subtitulo: n.titulo,
      aviso: 'Una novedad anulada deja de generar necesidad de infraestructura.',
      mensaje: 'Novedad anulada.',
      ejecutar: (datos) => anular(n, datos)
    })
  },
  { label: 'Reactivar novedad', icono: 'restore', visible: puedeHacer('novedad.anular') && !vigente(n), accion: () => pedirReactivacion({ entidad: 'novedad', registro: n, nombre: 'Novedad' }) }
]

const accionesIntervencion = (i) => [
  { label: 'Actualizar intervención', icono: 'edit', visible: puedeHacer('intervencion.actualizar') && vigente(i), accion: () => abrirIntervencion(i) },
  {
    label: 'Anular intervención',
    icono: 'block',
    peligro: true,
    visible: puedeHacer('intervencion.anular') && vigente(i),
    accion: () => pedirAnulacion({
      titulo: 'Anular intervención',
      subtitulo: i.descripcion,
      mensaje: 'Intervención anulada.',
      ejecutar: (datos) => anular(i, datos)
    })
  },
  { label: 'Reactivar intervención', icono: 'restore', visible: puedeHacer('intervencion.anular') && !vigente(i), accion: () => pedirReactivacion({ entidad: 'intervencion', registro: i, nombre: 'Intervención' }) }
]
</script>
