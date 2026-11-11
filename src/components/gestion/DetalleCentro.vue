<template>
  <detalle-panel :nodo="`centro-${centro.id}`" :titulo="centro.nombre" :ruta="`${centro.id} · Centro`" icono="home_work" :tabs="tabs" :tab-inicial="tabInicial" :con-volver="conVolver" @volver="$emit('volver')" @seleccionar="$emit('seleccionar', $event)">
    <template #chips>
      <status-chip v-bind="condicionInmueble(inmueble.condicion)" />
      <status-chip v-if="centro.anulacion" v-bind="CHIP_ANULADO" />
      <status-chip v-if="resumenControles.vencidos" tono="da" :label="plural(resumenControles.vencidos, 'control vencido', 'controles vencidos')" />
      <status-chip v-if="resumenControles.extintoresFaltantes" tono="wa" :label="plural(resumenControles.extintoresFaltantes, 'extintor faltante', 'extintores faltantes')" />
    </template>
    <template #acciones>
      <q-btn v-if="puedeHacer('modulo.registrar')" unelevated color="primary" icon="add_home_work" label="Registrar módulo" :disable="!activo" @click="dialogos.modulo = true" />
      <q-btn v-if="puedeHacer('centro.incidente')" outline color="secondary" icon="report" label="Registrar incidente" :disable="!activo" @click="incidenteAbierto = true" />
      <menu-acciones con-etiqueta :items="accionesCentro" :etiqueta="`Acciones de ${centro.nombre}`" />
    </template>

    <template #ficha>
      <note-banner v-if="centro.anulacion" tono="ne" icono="block">
        Centro anulado el {{ fecha(centro.anulacion.fecha) }} por {{ centro.anulacion.por }}. Motivo: {{ centro.anulacion.motivo }}
      </note-banner>
      <section class="sg-ficha__summary" aria-label="Resumen del centro">
        <div class="sg-ficha__item"><q-icon name="location_on" aria-hidden="true" /><key-value etiqueta="Dirección"><template v-if="inmueble.direccion">{{ inmueble.direccion }}</template><status-chip v-else tono="si" label="No informada" /></key-value></div>
        <div class="sg-ficha__item"><q-icon name="home_work" aria-hidden="true" /><key-value etiqueta="Condición del inmueble">{{ condicionInmueble(inmueble.condicion).label }}</key-value></div>
        <div class="sg-ficha__item"><q-icon name="fact_check" aria-hidden="true" /><key-value etiqueta="Estado general"><status-chip v-bind="condicion(inmueble.construccion.estado)" /></key-value></div>
      </section>
      <section-card titulo="Centro e inmueble" icono="home_work" subtitulo="Datos del centro y del inmueble donde funciona.">
        <div class="sg-kv-grid">
          <key-value etiqueta="Referencia de fundación" :nota="inmueble.fundacion.nota || ''">
            <template v-if="inmueble.fundacion.referencia">{{ inmueble.fundacion.referencia }}</template>
            <status-chip v-else tono="si" label="No informada" />
          </key-value>
          <template v-if="inmueble.condicion === 'alquilado'">
            <key-value etiqueta="Arrendador">
              <template v-if="inmueble.arrendador">{{ inmueble.arrendador }}</template>
              <status-chip v-else tono="si" label="Información pendiente" />
            </key-value>
            <key-value etiqueta="Contrato de alquiler">
              <template v-if="inmueble.contratoHasta">Vigente hasta el {{ fecha(inmueble.contratoHasta) }}</template>
              <status-chip v-else tono="si" label="Información pendiente" />
            </key-value>
          </template>
          <key-value etiqueta="Litigios" :nota="inmueble.litigios ? '' : 'No se ha informado si existen litigios'">
            <template v-if="inmueble.litigios">{{ inmueble.litigios }}</template>
            <status-chip v-else tono="si" label="Información pendiente" />
          </key-value>
        </div>
      </section-card>

      <section-card titulo="Construcción e infraestructura" icono="construction">
        <div class="sg-kv-grid">
          <key-value v-for="campo in camposConstruccion" :key="campo.etiqueta" :etiqueta="campo.etiqueta" :nota="campo.nota || ''">
            <template v-if="campo.valor != null && campo.valor !== ''">{{ campo.valor }}</template>
            <status-chip v-else tono="si" label="No informado" />
          </key-value>
          <key-value etiqueta="Última actualización" :nota="inmueble.actualizado.por">{{ fecha(inmueble.actualizado.fecha) }}</key-value>
        </div>
      </section-card>

      <section-card
        titulo="Estado de la infraestructura"
        icono="fact_check"
        :subtitulo="evaluados ? `${evaluados} de ${ELEMENTOS_INFRAESTRUCTURA.length} elementos evaluados` : 'Aún no se evaluó ningún elemento'"
      >
        <estado-elementos :model-value="inmueble.construccion.estadoElementos" solo-lectura />
      </section-card>
    </template>

    <template #incidencias><hechos-contexto :centro-id="centro.id" :hecho-inicial="hechoInicial" /></template>
    <template #fotos>
      <galeria-fotos :centro="centro" titulo="Fotografías del centro" />
    </template>

    <template #seguridad>
      <control-preventivo :centro="centro" :inactivos="inactivos" :resaltado="mantenimientoResaltado" @seleccionar="(id) => $emit('seleccionar', id)" @registrar-extintor="(ambienteId) => $emit('registrar-bien', ambienteId, TIPO_EXTINTOR)" />
    </template>

    <!-- Módulos del centro (casas y de uso común) con sus ambientes (SPEC 020). La pestaña conserva el nombre «ambientes» para los enlaces. -->
    <template #ambientes>
      <section-card
        v-for="grupo in gruposModulos"
        :key="grupo.tipo"
        :titulo="`${grupo.titulo} (${grupo.modulos.length})`"
        :subtitulo="grupo.subtitulo"
        :icono="grupo.icono"
        sin-relleno
      >
        <div v-for="m in grupo.modulos" :key="m.id">
          <div class="sg-modulo__cabecera sg-borde-superior row items-center justify-between q-px-md q-py-sm">
            <div class="column">
              <button type="button" class="sg-row-btn text-weight-bold self-start" @click="$emit('seleccionar', nodoModuloId(m.id))">
                <q-icon :name="iconoModulo(m)" size="18px" aria-hidden="true" class="q-mr-xs" />{{ m.nombre }}
              </button>
              <span class="sg-muted">{{ resumenModulo(m) }}</span>
            </div>
            <div class="sg-chips items-center">
              <status-chip v-bind="condicion(m.condicion)" />
              <status-chip v-if="m.anulacion" v-bind="CHIP_ANULADO" />
              <q-btn v-if="puedeHacer('ambiente.registrar') && activo && vigente(m)" flat dense no-caps color="secondary" icon="add" label="Ambiente" :aria-label="`Registrar ambiente en ${m.nombre}`" @click="abrirAmbiente(m)" />
            </div>
          </div>
          <div class="sg-modulo__ambientes">
            <fila-ambiente v-for="amb in ambientesDeModulo(m.id, { inactivos: true })" :key="amb.id" :ambiente="amb" @seleccionar="$emit('seleccionar', $event)" />
            <p v-if="!ambientesDeModulo(m.id, { inactivos: true }).length" class="sg-borde-superior q-px-md q-py-sm sg-muted q-mb-none">Sin ambientes registrados.</p>
          </div>
        </div>
      </section-card>
      <div v-if="!modulos.length" class="sg-box sg-box--dashed">
        <span class="text-weight-bold">El centro aún no tiene módulos registrados.</span>
        <span class="sg-muted">Registre primero las casas y los módulos de uso común; luego, sus ambientes.</span>
        <q-btn v-if="puedeHacer('modulo.registrar') && activo" outline color="secondary" icon="add_home_work" label="Registrar módulo" class="self-start" @click="dialogos.modulo = true" />
      </div>
    </template>
  </detalle-panel>

  <incidente-dialog v-model="incidenteAbierto" :centro-inicial="centro.id" @hecho="$emit('hecho', $event)" />
  <centro-ficha-dialog v-model="dialogos.ficha" :centro="centro" />
  <modulo-dialog v-model="dialogos.modulo" :centro="centro" @hecho="(id) => $emit('seleccionar', nodoModuloId(id))" />
  <ambiente-dialog v-model="dialogos.ambiente" :centro="centro" :modulo="moduloParaAmbiente" @hecho="(id) => $emit('seleccionar', nodoAmbienteId(id))" />
  <anular-dialog v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
</template>

<script setup>
import IncidenteDialog from 'components/bienes/IncidenteDialog.vue'
import HechosContexto from './HechosContexto.vue'
import { computed, reactive, ref } from 'vue'
import DetallePanel from 'components/gestion/DetallePanel.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import KeyValue from 'components/common/KeyValue.vue'
import MenuAcciones from 'components/common/MenuAcciones.vue'
import AnularDialog from 'components/common/AnularDialog.vue'
import CentroFichaDialog from 'components/centros/CentroFichaDialog.vue'
import AmbienteDialog from 'components/centros/AmbienteDialog.vue'
import ModuloDialog from 'components/centros/ModuloDialog.vue'
import FilaAmbiente from 'components/gestion/FilaAmbiente.vue'
import GaleriaFotos from 'components/centros/GaleriaFotos.vue'
import ControlPreventivo from 'components/centros/ControlPreventivo.vue'
import EstadoElementos from 'components/common/EstadoElementos.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useAnulacion } from 'src/composables/useAnulacion'
import { ambientesDeCar, ambientesDeModulo, modulosDeCar, vigente } from 'src/services/datos'
import { iconoModulo, nodoAmbienteId, nodoModuloId } from 'src/services/bienes'
import { anular, dependenciasDeCentro } from 'src/services/acciones'
import { cantidadEvaluados } from 'src/services/infraestructura'
import { controlesPendientes, resumirControles } from 'src/services/mantenimientos'
import { FECHA_CORTE } from 'src/config/demo'
import { CHIP_ANULADO, ELEMENTOS_INFRAESTRUCTURA, TIPO_EXTINTOR, condicion, condicionInmueble } from 'src/config/catalogos'
import { fecha, plural } from 'src/utils/formato'

const props = defineProps({
  centro: { type: Object, required: true },
  // Con «Mostrar inactivos» el historial de mantenimientos incluye los anulados.
  inactivos: { type: Boolean, default: false },
  hechoInicial: { type: String, default: null },
  tabInicial: { type: String, default: null },
  mantenimientoResaltado: { type: String, default: null },
  conVolver: { type: Boolean, default: false }
})

defineEmits(['seleccionar', 'volver', 'registrar-bien', 'hecho'])

const { puedeHacer } = usePerfil()
const { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion } = useAnulacion()

const incidenteAbierto = ref(false)
const dialogos = reactive({ ficha: false, modulo: false, ambiente: false })
// Módulo preseleccionado al registrar un ambiente desde su fila.
const moduloParaAmbiente = ref(null)
function abrirAmbiente (modulo) {
  moduloParaAmbiente.value = modulo
  dialogos.ambiente = true
}

const inmueble = computed(() => props.centro.inmueble)
const activo = computed(() => vigente(props.centro))
const ambientes = computed(() => ambientesDeCar(props.centro.id, { inactivos: true }))
const modulos = computed(() => modulosDeCar(props.centro.id, { inactivos: true }))
// Casas primero y luego los módulos de uso común; un grupo sin módulos no se muestra.
const gruposModulos = computed(() => [
  { tipo: 'casa', titulo: 'Casas', icono: 'cottage', subtitulo: 'Donde viven los grupos de residentes; seleccione un módulo o un ambiente para ver su detalle' },
  { tipo: 'comun', titulo: 'Módulos de uso común', icono: 'groups', subtitulo: 'Los comparten todas las casas del centro: comedor, cocina, lavandería, administración' }
].map((g) => ({ ...g, modulos: modulos.value.filter((m) => (m.tipo === 'comun' ? 'comun' : 'casa') === g.tipo) })).filter((g) => g.modulos.length))

const resumenModulo = (m) => [
  plural(ambientesDeModulo(m.id).length, 'ambiente', 'ambientes'),
  m.tipo === 'casa' && m.capacidad != null ? plural(m.capacidad, 'residente', 'residentes') : null,
  m.pisos != null ? plural(m.pisos, 'piso', 'pisos') : null,
  m.ubicacion
].filter(Boolean).join(' · ')
const evaluados = computed(() => cantidadEvaluados(inmueble.value.construccion.estadoElementos))
const resumenControles = computed(() => resumirControles(controlesPendientes([props.centro.id], FECHA_CORTE)))

const tabs = computed(() => [
  { name: 'ficha', label: 'Ficha' },
  { name: 'incidencias', label: 'Incidencias' },
  { name: 'fotos', label: 'Fotografías' },
  { name: 'seguridad', label: 'Seguridad y mantenimiento' },
  { name: 'ambientes', label: `Módulos y ambientes (${ambientes.value.length})` }
])

const camposConstruccion = computed(() => {
  const c = inmueble.value.construccion
  return [
    { etiqueta: 'Material de construcción', valor: c.material },
    { etiqueta: 'Antigüedad', valor: c.antiguedad, nota: c.antiguedadNota },
    { etiqueta: 'Pisos', valor: c.pisos },
    { etiqueta: 'Área construida', valor: c.areaM2 ? `${c.areaM2} m²` : null },
    { etiqueta: 'Área del terreno', valor: c.areaTerrenoM2 ? `${c.areaTerrenoM2} m²` : null },
    { etiqueta: 'Características', valor: c.caracteristicas }
  ]
})

const accionesCentro = computed(() => {
  const c = props.centro
  return [
    { label: 'Actualizar ficha', icono: 'edit', visible: puedeHacer('centro.actualizar'), disable: !activo.value, accion: () => { dialogos.ficha = true } },
    {
      label: 'Anular centro',
      icono: 'block',
      peligro: true,
      visible: puedeHacer('centro.anular') && vigente(c),
      accion: () => pedirAnulacion({
        titulo: 'Anular centro',
        subtitulo: `${c.nombre} · ${c.id}`,
        dependencias: dependenciasDeCentro(c),
        mensaje: 'Centro anulado.',
        ejecutar: (datos) => anular(c, datos),
      registro: c
      })
    },
    {
      label: 'Reactivar centro',
      icono: 'restore',
      visible: puedeHacer('centro.anular') && !vigente(c),
      accion: () => pedirReactivacion({ entidad: 'centro', registro: c, nombre: 'Centro' })
    }
  ]
})
</script>

<style scoped>
.sg-modulo__cabecera { background: var(--sg-blue-soft); }
.sg-modulo__ambientes { padding-left: 16px; }
</style>
