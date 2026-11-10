<template>
  <detalle-panel
    :nodo="`ambiente-${ambiente.id}`"
    :titulo="ambiente.nombre"
    :ruta="textoUbicacion(ubicacionDeAmbiente(ambiente.id))"
    icono="meeting_room"
    :tabs="tabs"
    :tab-inicial="tabInicial === 'novedades' ? 'incidencias' : tabInicial"
    :con-volver="conVolver"
    @volver="$emit('volver')" @seleccionar="$emit('seleccionar', $event)"
  >
    <template #chips>
      <status-chip v-bind="condicion(ambiente.condicion)" />
      <status-chip v-if="ambiente.anulacion" v-bind="CHIP_ANULADO" />
      <status-chip v-if="abiertas.length" tono="da" :label="plural(abiertas.length, 'novedad abierta', 'novedades abiertas')" />
    </template>
    <template #acciones>
      <q-btn v-if="puedeHacer('bien.registrar')" unelevated color="primary" icon="playlist_add" label="Registrar bien" :disable="!activo" @click="$emit('registrar-bien', ambiente.id)" />
      <q-btn v-if="puedeHacer('ambiente.incidente')" outline color="secondary" icon="report" label="Registrar incidente" :disable="!activo" @click="abrirIncidente()" />
      <q-btn v-if="puedeHacer('bien.verificar') && !puedeHacer('bien.registrar')" :unelevated="!puedeHacer('bien.registrar')" :outline="puedeHacer('bien.registrar')" :color="puedeHacer('bien.registrar') ? 'secondary' : 'primary'" icon="fact_check" :label="`Verificar ambiente${porVerificar ? ` (${porVerificar} sin verificar)` : ''}`" :disable="!activo || !totalActivos" @click="dialogos.recorrido = true" />
      <menu-acciones con-etiqueta :items="accionesAmbiente" :etiqueta="`Acciones de ${ambiente.nombre}`" />
    </template>

    <template #ficha>
      <note-banner v-if="ambiente.anulacion" tono="ne" icono="block">
        Ambiente anulado el {{ fecha(ambiente.anulacion.fecha) }} por {{ ambiente.anulacion.por }}. Motivo: {{ ambiente.anulacion.motivo }}
      </note-banner>
      <section class="sg-ficha__summary" aria-label="Resumen del ambiente">
        <div class="sg-ficha__item"><q-icon name="location_on" aria-hidden="true" /><key-value etiqueta="Ubicación"><template v-if="ambiente.ubicacion">{{ ambiente.ubicacion }}</template><status-chip v-else tono="si" label="No informada" /></key-value></div>
        <div class="sg-ficha__item"><q-icon name="fact_check" aria-hidden="true" /><key-value etiqueta="Condición"><status-chip v-bind="condicion(ambiente.condicion)" /></key-value></div>
        <div class="sg-ficha__item"><q-icon name="format_paint" aria-hidden="true" /><key-value etiqueta="Último pintado"><template v-if="ambiente.ultimoPintado">{{ fecha(ambiente.ultimoPintado) }}</template><status-chip v-else tono="si" label="Fecha no informada" /></key-value></div>
      </section>
      <section-card titulo="Datos del ambiente" icono="meeting_room">
        <div class="sg-kv-grid">
          <key-value etiqueta="Piso">
            <template v-if="ambiente.piso != null">{{ ambiente.piso }}</template>
            <status-chip v-else tono="si" label="No informado" />
          </key-value>
          <key-value etiqueta="Bloque">
            <template v-if="ambiente.bloque">{{ ambiente.bloque }}</template>
            <status-chip v-else tono="si" label="No informado" />
          </key-value>
          <key-value etiqueta="Características">{{ caracteristicas }}</key-value>
        </div>
      </section-card>
      <section-card
        titulo="Estado de la infraestructura"
        icono="fact_check"
        :subtitulo="evaluados ? `${evaluados} de ${ELEMENTOS_INFRAESTRUCTURA.length} elementos evaluados` : 'Aún no se evaluó ningún elemento'"
      >
        <estado-elementos :model-value="ambiente.estadoElementos" solo-lectura sugerir-novedad etiqueta-accion="Registrar incidente" :accion-novedad="activo && puedeHacer('ambiente.incidente')" @registrar-novedad="novedadDesdeElementos" />
      </section-card>
      <section-card titulo="Mobiliario y equipos" icono="chair" subtitulo="Se calcula con los bienes activos del ambiente; no se captura aparte">
        <div v-if="totalActivos" class="sg-chips">
          <template v-for="(cantidad, clave) in conteoBienes" :key="clave">
            <status-chip v-if="cantidad" v-bind="condicion(clave === 'sin_dato' ? null : clave)" :label="`${condicion(clave === 'sin_dato' ? null : clave).label}: ${cantidad}`" />
          </template>
        </div>
        <p v-else class="sg-muted q-mb-none">El ambiente no tiene bienes activos registrados.</p>
      </section-card>
    </template>

    <template #fotos>
      <galeria-fotos :centro="centro" :ambiente-id="ambiente.id" :titulo="`Fotografías de ${ambiente.nombre}`" />
    </template>

    <template #bienes>
      <section-card :titulo="`Bienes del ambiente (${bienes.length})`" subtitulo="Inventario directo del ambiente; un componente indica el bien del que forma parte" sin-relleno>
        <div v-for="b in bienes" :key="b.id" class="sg-borde-superior row items-center justify-between q-px-md q-py-sm">
          <div class="column">
            <button type="button" class="sg-row-btn text-weight-bold self-start" @click="$emit('seleccionar', b.id)"><q-icon name="visibility" size="16px" aria-hidden="true" class="q-mr-xs" />{{ b.nombre }} · {{ b.id }}</button>
            <span v-if="b.asociadoA" class="sg-muted">Componente de {{ b.asociadoA.bienId }}<template v-if="b.asociadoA.posicion"> ({{ b.asociadoA.posicion }})</template></span>
          </div>
          <div class="sg-chips">
            <status-chip v-bind="condicion(b.condicion)" />
            <status-chip v-bind="SITUACIONES[b.situacion]" />
          </div>
        </div>
        <p v-if="!bienes.length" class="q-pa-md sg-muted q-mb-none">El ambiente aún no tiene bienes registrados.</p>
      </section-card>
    </template>

    <template #incidencias>
      <hechos-contexto :ambiente-id="ambiente.id" :hecho-inicial="hechoInicial" />
      <section-card titulo="Infraestructura registrada" subtitulo="Consulta, corrección y atención de los hechos del ambiente">
        <div class="column q-gutter-y-sm">
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
          <p v-if="!novedades.length" class="sg-muted q-mb-none">Sin novedades registradas.</p>
        </div>
      </section-card>
    </template>

    <template #intervenciones>
      <section-card titulo="Antecedentes de intervenciones" subtitulo="Pintado, reparaciones y otros trabajos realizados">
        <template #acciones>
          <q-btn v-if="puedeHacer('intervencion.registrar')" outline color="secondary" icon="format_paint" label="Registrar intervención" :disable="!activo" @click="abrirIntervencion(null)" />
        </template>
        <div class="column q-gutter-y-sm">
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
          <p v-if="!intervenciones.length" class="sg-muted q-mb-none">Sin antecedentes de intervenciones.</p>
        </div>
      </section-card>
    </template>
  </detalle-panel>

  <ambiente-dialog v-model="dialogos.ambiente" :centro="centro" :ambiente="ambiente" @hecho="(id) => $emit('seleccionar', nodoAmbienteId(id))" />
  <incidente-dialog v-model="incidenteAbierto" :ambiente-inicial="ambiente.id" :sugerencia="sugerenciaIncidente" @hecho="$emit('hecho', $event)" />
  <recorrido-verificacion v-model="dialogos.recorrido" :ambiente="ambiente" @seleccionar="(id) => $emit('seleccionar', id)" />
  <novedad-dialog v-model="dialogoNovedad.abierto" :ambiente="ambiente" :novedad="dialogoNovedad.novedad" :sugerencia="dialogoNovedad.sugerencia" />
  <intervencion-dialog v-model="dialogoIntervencion.abierto" :ambiente="ambiente" :intervencion="dialogoIntervencion.intervencion" />
  <atencion-dialog v-if="dialogoAtencion.novedad" v-model="dialogoAtencion.abierto" :novedad="dialogoAtencion.novedad" />
  <pendientes-ambiente-dialog v-model="dialogos.pendientes" :ambiente="ambiente" @continuar="pedirAnulacionAmbiente" />
  <anular-dialog v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
</template>

<script setup>
import IncidenteDialog from 'components/bienes/IncidenteDialog.vue'
import HechosContexto from './HechosContexto.vue'
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import DetallePanel from 'components/gestion/DetallePanel.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import KeyValue from 'components/common/KeyValue.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import MenuAcciones from 'components/common/MenuAcciones.vue'
import AnularDialog from 'components/common/AnularDialog.vue'
import AmbienteDialog from 'components/centros/AmbienteDialog.vue'
import NovedadDialog from 'components/centros/NovedadDialog.vue'
import IntervencionDialog from 'components/centros/IntervencionDialog.vue'
import AtencionDialog from 'components/centros/AtencionDialog.vue'
import GaleriaFotos from 'components/centros/GaleriaFotos.vue'
import PendientesAmbienteDialog from 'components/centros/PendientesAmbienteDialog.vue'
import EstadoElementos from 'components/common/EstadoElementos.vue'
import RecorridoVerificacion from 'components/bienes/RecorridoVerificacion.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useAnulacion } from 'src/composables/useAnulacion'
import { bienesDeAmbiente, carPorId, textoUbicacion, ubicacionDeAmbiente, vigente } from 'src/services/datos'
import { nodoAmbienteId } from 'src/services/bienes'
import { anular, anularAmbiente, dependenciasDeAmbiente, pendientesDeAmbiente } from 'src/services/acciones'
import { cantidadEvaluados, conteoPorCondicion } from 'src/services/infraestructura'
import { CHIP_ANULADO, ELEMENTOS_INFRAESTRUCTURA, SITUACIONES, TIPOS_NOVEDAD, condicion } from 'src/config/catalogos'
import { fecha, plural } from 'src/utils/formato'

const props = defineProps({
  ambiente: { type: Object, required: true },
  // Con «Mostrar inactivos» se ven también los registros anulados del ambiente.
  inactivos: { type: Boolean, default: false },
  hechoInicial: { type: String, default: null },
  tabInicial: { type: String, default: null },
  novedadResaltada: { type: String, default: null },
  conVolver: { type: Boolean, default: false }
})

defineEmits(['seleccionar', 'registrar-bien', 'volver', 'hecho'])

const { puedeHacer } = usePerfil()
const { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion } = useAnulacion()

const centro = computed(() => carPorId(props.ambiente.carId))
const activo = computed(() => vigente(props.ambiente))

const bienes = computed(() => bienesDeAmbiente(props.ambiente.id).filter((b) => props.inactivos || b.situacion !== 'anulado'))
const novedades = computed(() => (props.ambiente.novedades ?? []).filter((n) => props.inactivos || vigente(n)))
const intervenciones = computed(() => (props.ambiente.intervenciones ?? []).filter((i) => props.inactivos || vigente(i)))
const abiertas = computed(() => (props.ambiente.novedades ?? []).filter((n) => vigente(n) && !n.atendida))
const evaluados = computed(() => cantidadEvaluados(props.ambiente.estadoElementos))
// Unidades activas por condición, ponderadas por cantidad (los componentes cuentan como bienes del ambiente).
const conteoBienes = computed(() => conteoPorCondicion(bienesDeAmbiente(props.ambiente.id)))
const totalActivos = computed(() => Object.values(conteoBienes.value).reduce((suma, n) => suma + n, 0))

const incidenteAbierto = ref(false)
const sugerenciaIncidente = ref(null)
function abrirIncidente (sugerencia = null) { sugerenciaIncidente.value = sugerencia; incidenteAbierto.value = true }
const tabs = computed(() => [
  { name: 'ficha', label: 'Ficha' },
  { name: 'incidencias', label: 'Incidencias' },
  { name: 'fotos', label: 'Fotografías' },
  { name: 'bienes', label: `Bienes (${bienes.value.length})` },
  { name: 'intervenciones', label: `Intervenciones (${intervenciones.value.length})` }
])

const caracteristicas = computed(() => {
  const a = props.ambiente
  return [
    a.areaM2 != null ? `${a.areaM2} m²` : null,
    a.ventanas != null ? plural(a.ventanas, 'ventana', 'ventanas') : null,
    a.puertas != null ? plural(a.puertas, 'puerta', 'puertas') : null
  ].filter(Boolean).join(', ') || 'No informadas'
})

const dialogos = reactive({ ambiente: false, pendientes: false, recorrido: false })
// Bienes activos sin ninguna verificación: invitan a hacer el recorrido.
const porVerificar = computed(() => bienesDeAmbiente(props.ambiente.id).filter((b) => b.situacion === 'activo' && !b.verificacion).length)
const dialogoNovedad = reactive({ abierto: false, novedad: null, sugerencia: null })
const dialogoIntervencion = reactive({ abierto: false, intervencion: null })
const dialogoAtencion = reactive({ abierto: false, novedad: null })

const abrirNovedad = (novedad, sugerencia = null) => { if (!novedad) abrirIncidente(sugerencia); else Object.assign(dialogoNovedad, { abierto: true, novedad, sugerencia: null }) }
// Desde los elementos en mal estado: la novedad se precarga, pero la persona la revisa y la registra.
const novedadDesdeElementos = (criticos) => abrirNovedad(null, {
  titulo: `${criticos.map((c) => c.label).join(', ')} en mal estado`,
  detalle: `Elementos evaluados en condición mala o inservible: ${criticos.map((c) => `${c.label} (${condicion(props.ambiente.estadoElementos[c.key]).label.toLowerCase()})`).join(', ')}.`,
  requiereEvaluacion: true
})
const abrirIntervencion = (intervencion) => Object.assign(dialogoIntervencion, { abierto: true, intervencion })
const abrirAtencion = (novedad) => Object.assign(dialogoAtencion, { abierto: true, novedad })

// Con ?novedad= se baja hasta la novedad resaltada.
onMounted(async () => {
  if (!props.novedadResaltada) return
  await nextTick()
  document.getElementById(`novedad-${props.novedadResaltada}`)?.scrollIntoView({ block: 'center' })
})

// Un ambiente con bienes por resolver no se anula: primero se reubican o se dan de baja uno por uno.
function iniciarAnulacion () {
  if (pendientesDeAmbiente(props.ambiente).length) {
    dialogos.pendientes = true
    return
  }
  pedirAnulacionAmbiente()
}

const pedirAnulacionAmbiente = () => {
  const amb = props.ambiente
  pedirAnulacion({
    titulo: 'Anular ambiente',
    subtitulo: `${amb.nombre} · ${amb.id}`,
    dependencias: dependenciasDeAmbiente(amb),
    aviso: 'El ambiente y su historial se conservan; deja de ofrecerse para registrar bienes y puede reactivarse con «Mostrar inactivos».',
    mensaje: 'Ambiente anulado.',
    ejecutar: (datos) => anularAmbiente(amb, datos),
    registro: amb
  })
}

const accionesAmbiente = computed(() => [
  { label: 'Actualizar ambiente', icono: 'edit', visible: puedeHacer('ambiente.actualizar'), disable: !activo.value, accion: () => { dialogos.ambiente = true } },
  { label: 'Verificar ambiente', icono: 'fact_check', visible: puedeHacer('bien.verificar') && puedeHacer('bien.registrar'), disable: !activo.value || !totalActivos.value, accion: () => { dialogos.recorrido = true } },
  {
    label: 'Anular ambiente',
    icono: 'block',
    peligro: true,
    visible: puedeHacer('ambiente.anular') && vigente(props.ambiente),
    accion: iniciarAnulacion
  },
  {
    label: 'Reactivar ambiente',
    icono: 'restore',
    visible: puedeHacer('ambiente.anular') && !vigente(props.ambiente),
    accion: () => pedirReactivacion({ entidad: 'ambiente', registro: props.ambiente, nombre: 'Ambiente' })
  }
])

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
      ejecutar: (datos) => anular(n, datos),
      registro: n
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
      ejecutar: (datos) => anular(i, datos),
      registro: i
    })
  },
  { label: 'Reactivar intervención', icono: 'restore', visible: puedeHacer('intervencion.anular') && !vigente(i), accion: () => pedirReactivacion({ entidad: 'intervencion', registro: i, nombre: 'Intervención' }) }
]
</script>
