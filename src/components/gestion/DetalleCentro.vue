<template>
  <detalle-panel :titulo="centro.nombre" :ruta="`${centro.id} · Centro`" icono="home_work" :tabs="tabs" :tab-inicial="tabInicial" :con-volver="conVolver" @volver="$emit('volver')">
    <template #chips>
      <status-chip v-bind="condicionInmueble(inmueble.condicion)" />
      <status-chip v-if="centro.anulacion" v-bind="CHIP_ANULADO" />
      <status-chip v-if="resumenControles.vencidos" tono="da" :label="plural(resumenControles.vencidos, 'control vencido', 'controles vencidos')" />
      <status-chip v-if="resumenControles.extintoresFaltantes" tono="wa" :label="plural(resumenControles.extintoresFaltantes, 'extintor faltante', 'extintores faltantes')" />
    </template>
    <template #acciones>
      <q-btn v-if="puedeHacer('ambiente.registrar')" outline color="secondary" icon="add_home" label="Registrar ambiente" :disable="!activo" @click="dialogos.ambiente = true" />
      <q-btn v-if="puedeHacer('centro.actualizar')" outline color="secondary" icon="edit" label="Actualizar ficha" :disable="!activo" @click="dialogos.ficha = true" />
      <menu-acciones :items="accionesCentro" :etiqueta="`Acciones de ${centro.nombre}`" />
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

    <template #fotos>
      <galeria-fotos :centro="centro" titulo="Fotografías del centro" />
    </template>

    <template #seguridad>
      <control-preventivo :centro="centro" :inactivos="inactivos" :resaltado="mantenimientoResaltado" @seleccionar="(id) => $emit('seleccionar', id)" @registrar-extintor="(ambienteId) => $emit('registrar-bien', ambienteId, TIPO_EXTINTOR)" />
    </template>

    <template #ambientes>
      <section-card :titulo="`Ambientes del centro (${ambientes.length})`" subtitulo="Condición, novedades abiertas y elementos críticos de cada ambiente; selecciónelo para ver el detalle" sin-relleno>
        <div v-for="amb in ambientes" :key="amb.id" class="sg-borde-superior row items-center justify-between q-px-md q-py-sm">
          <div class="column">
            <button type="button" class="sg-row-btn text-weight-bold self-start" @click="$emit('seleccionar', nodoAmbienteId(amb.id))"><q-icon name="visibility" size="16px" aria-hidden="true" class="q-mr-xs" />{{ amb.nombre }}</button>
            <span class="sg-muted">{{ [amb.piso != null ? `Piso ${amb.piso}` : null, amb.bloque, amb.ubicacion].filter(Boolean).join(' · ') || 'Ubicación no informada' }}</span>
          </div>
          <div class="sg-chips">
            <status-chip v-bind="condicion(amb.condicion)" />
            <status-chip v-if="amb.anulacion" v-bind="CHIP_ANULADO" />
            <status-chip v-if="novedadesAbiertas(amb).length" tono="da" :label="plural(novedadesAbiertas(amb).length, 'novedad abierta', 'novedades abiertas')" />
            <status-chip v-if="elementosCriticos(amb.estadoElementos).length" tono="wa" :label="plural(elementosCriticos(amb.estadoElementos).length, 'elemento crítico', 'elementos críticos')" />
            <status-chip tono="ne" :label="plural(bienesDeAmbiente(amb.id).filter((b) => b.situacion === 'activo').length, 'bien activo', 'bienes activos')" />
          </div>
        </div>
        <p v-if="!ambientes.length" class="q-pa-md sg-muted q-mb-none">El centro aún no tiene ambientes registrados.</p>
      </section-card>
    </template>
  </detalle-panel>

  <centro-ficha-dialog v-model="dialogos.ficha" :centro="centro" />
  <ambiente-dialog v-model="dialogos.ambiente" :centro="centro" @hecho="(id) => $emit('seleccionar', nodoAmbienteId(id))" />
  <anular-dialog v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
</template>

<script setup>
import { computed, reactive } from 'vue'
import DetallePanel from 'components/gestion/DetallePanel.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import KeyValue from 'components/common/KeyValue.vue'
import MenuAcciones from 'components/common/MenuAcciones.vue'
import AnularDialog from 'components/common/AnularDialog.vue'
import CentroFichaDialog from 'components/centros/CentroFichaDialog.vue'
import AmbienteDialog from 'components/centros/AmbienteDialog.vue'
import GaleriaFotos from 'components/centros/GaleriaFotos.vue'
import ControlPreventivo from 'components/centros/ControlPreventivo.vue'
import EstadoElementos from 'components/common/EstadoElementos.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useAnulacion } from 'src/composables/useAnulacion'
import { ambientesDeCar, bienesDeAmbiente, vigente } from 'src/services/datos'
import { nodoAmbienteId } from 'src/services/bienes'
import { anular, dependenciasDeCentro } from 'src/services/acciones'
import { cantidadEvaluados, elementosCriticos } from 'src/services/infraestructura'
import { novedadesAbiertas } from 'src/services/situacion'
import { controlesPendientes, resumirControles } from 'src/services/mantenimientos'
import { FECHA_CORTE } from 'src/config/demo'
import { CHIP_ANULADO, ELEMENTOS_INFRAESTRUCTURA, TIPO_EXTINTOR, condicion, condicionInmueble } from 'src/config/catalogos'
import { fecha, plural } from 'src/utils/formato'

const props = defineProps({
  centro: { type: Object, required: true },
  // Con «Mostrar inactivos» el historial de mantenimientos incluye los anulados.
  inactivos: { type: Boolean, default: false },
  tabInicial: { type: String, default: null },
  mantenimientoResaltado: { type: String, default: null },
  conVolver: { type: Boolean, default: false }
})

defineEmits(['seleccionar', 'volver', 'registrar-bien'])

const { puedeHacer } = usePerfil()
const { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion } = useAnulacion()

const dialogos = reactive({ ficha: false, ambiente: false })

const inmueble = computed(() => props.centro.inmueble)
const activo = computed(() => vigente(props.centro))
const ambientes = computed(() => ambientesDeCar(props.centro.id, { inactivos: true }))
const evaluados = computed(() => cantidadEvaluados(inmueble.value.construccion.estadoElementos))
const resumenControles = computed(() => resumirControles(controlesPendientes([props.centro.id], FECHA_CORTE)))

const tabs = computed(() => [
  { name: 'ficha', label: 'Ficha' },
  { name: 'fotos', label: 'Fotografías' },
  { name: 'seguridad', label: 'Seguridad y mantenimiento' },
  { name: 'ambientes', label: `Ambientes (${ambientes.value.length})` }
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
