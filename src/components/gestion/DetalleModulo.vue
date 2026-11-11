<template>
  <detalle-panel
    :nodo="`modulo-${modulo.id}`"
    :titulo="modulo.nombre"
    :icono="iconoModulo(modulo)"
    :tabs="tabs"
    :tab-inicial="tabInicial"
    :con-volver="conVolver"
    @volver="$emit('volver')" @seleccionar="$emit('seleccionar', $event)"
  >
    <template #chips>
      <status-chip :tono="modulo.tipo === 'comun' ? 'in' : 'ne'" :icono="iconoModulo(modulo)" :label="TIPOS_MODULO[modulo.tipo]?.label ?? 'Tipo no informado'" />
      <status-chip v-bind="condicion(modulo.condicion)" />
      <status-chip v-if="modulo.anulacion" v-bind="CHIP_ANULADO" />
      <status-chip v-if="criticos" tono="wa" :label="plural(criticos, 'elemento crítico', 'elementos críticos')" />
    </template>
    <template #acciones>
      <q-btn v-if="puedeHacer('ambiente.registrar')" unelevated color="primary" icon="add_home" label="Registrar ambiente" :disable="!activo" @click="abrirAmbiente" />
      <menu-acciones con-etiqueta :items="accionesModulo" :etiqueta="`Acciones de ${modulo.nombre}`" />
    </template>

    <template #ficha>
      <note-banner v-if="modulo.anulacion" tono="ne" icono="block">
        Módulo anulado el {{ fecha(modulo.anulacion.fecha) }} por {{ modulo.anulacion.por }}. Motivo: {{ modulo.anulacion.motivo }}
      </note-banner>
      <note-banner v-if="modulo.tipo === 'comun'" tono="in" icono="groups">
        Módulo de uso común: lo comparten todas las casas del centro.
      </note-banner>
      <section class="sg-ficha__summary" aria-label="Resumen del módulo">
        <div class="sg-ficha__item"><q-icon name="location_on" aria-hidden="true" /><key-value etiqueta="Referencia de ubicación"><template v-if="modulo.ubicacion">{{ modulo.ubicacion }}</template><status-chip v-else tono="si" label="No informada" /></key-value></div>
        <div class="sg-ficha__item"><q-icon name="fact_check" aria-hidden="true" /><key-value etiqueta="Condición"><status-chip v-bind="condicion(modulo.condicion)" /></key-value></div>
        <div class="sg-ficha__item"><q-icon name="meeting_room" aria-hidden="true" /><key-value etiqueta="Ambientes activos">{{ ambientesActivos }}</key-value></div>
      </section>
      <section-card titulo="Datos del módulo" :icono="iconoModulo(modulo)">
        <div class="sg-kv-grid">
          <key-value etiqueta="Código">{{ modulo.id }}</key-value>
          <key-value etiqueta="Tipo de módulo" :nota="TIPOS_MODULO[modulo.tipo]?.descripcion ?? ''">{{ TIPOS_MODULO[modulo.tipo]?.label ?? 'No informado' }}</key-value>
          <key-value v-if="modulo.tipo === 'casa'" etiqueta="Capacidad de residentes">
            <template v-if="modulo.capacidad != null">{{ plural(modulo.capacidad, 'residente', 'residentes') }}</template>
            <status-chip v-else tono="si" label="No informada" />
          </key-value>
          <key-value etiqueta="N.º de pisos">
            <template v-if="modulo.pisos != null">{{ modulo.pisos }}</template>
            <status-chip v-else tono="si" label="No informado" />
          </key-value>
          <key-value etiqueta="Área construida">
            <template v-if="modulo.areaM2 != null">{{ modulo.areaM2 }} m²</template>
            <status-chip v-else tono="si" label="No informada" />
          </key-value>
        </div>
      </section-card>
      <section-card
        titulo="Estado de la infraestructura"
        icono="fact_check"
        :subtitulo="evaluados ? `${evaluados} de ${totalElementos} elementos evaluados` : 'Aún no se evaluó ningún elemento'"
      >
        <estado-elementos :model-value="modulo.estadoElementos" :adicionales="modulo.elementosAdicionales ?? []" solo-lectura />
      </section-card>
    </template>

    <template #ambientes>
      <section-card :titulo="`Ambientes del módulo (${ambientes.length})`" subtitulo="Condición, novedades abiertas y elementos críticos de cada ambiente; selecciónelo para ver el detalle" sin-relleno>
        <descendientes-recursos :nodos="descendientes" @seleccionar="$emit('seleccionar', $event)" />
        <div v-if="!ambientes.length" class="q-pa-md column q-gutter-y-sm">
          <p class="sg-muted q-mb-none">El módulo aún no tiene ambientes registrados.</p>
          <q-btn v-if="puedeHacer('ambiente.registrar') && activo" outline color="secondary" icon="add_home" label="Registrar el primer ambiente" class="self-start" @click="abrirAmbiente" />
        </div>
      </section-card>
    </template>
  </detalle-panel>

  <modulo-dialog v-if="centro" v-model="dialogos.modulo" :centro="centro" :modulo="modulo" @hecho="(id) => $emit('seleccionar', nodoModuloId(id))" />
  <ambiente-dialog v-if="centro" v-model="dialogos.ambiente" :centro="centro" :modulo="modulo" @hecho="(id) => $emit('seleccionar', nodoAmbienteId(id))" />
  <anular-dialog v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
</template>

<script setup>
// Ficha de un módulo del centro (SPEC 020): sus datos, sus ambientes y sus acciones.
import { computed, reactive } from 'vue'
import DetallePanel from 'components/gestion/DetallePanel.vue'
import DescendientesRecursos from './DescendientesRecursos.vue'
import { nodoAmbienteRecursos } from 'src/services/jerarquiaRecursos'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import KeyValue from 'components/common/KeyValue.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import MenuAcciones from 'components/common/MenuAcciones.vue'
import AnularDialog from 'components/common/AnularDialog.vue'
import EstadoElementos from 'components/common/EstadoElementos.vue'
import ModuloDialog from 'components/centros/ModuloDialog.vue'
import AmbienteDialog from 'components/centros/AmbienteDialog.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useAnulacion } from 'src/composables/useAnulacion'
import { ambientesDeModulo, carPorId, vigente } from 'src/services/datos'
import { iconoModulo, nodoAmbienteId, nodoModuloId } from 'src/services/bienes'
import { anularModulo, dependenciasDeModulo } from 'src/services/acciones'
import { cantidadEvaluados, elementosCriticos, elementosDe } from 'src/services/infraestructura'
import { CHIP_ANULADO, TIPOS_MODULO, condicion } from 'src/config/catalogos'
import { fecha, plural } from 'src/utils/formato'

const props = defineProps({
  modulo: { type: Object, required: true },
  // Con «Mostrar inactivos» se ven también los ambientes anulados del módulo.
  inactivos: { type: Boolean, default: false },
  situacion: { type: String, default: 'todos' },
  tabInicial: { type: String, default: null },
  conVolver: { type: Boolean, default: false }
})

defineEmits(['seleccionar', 'volver'])

const { puedeHacer } = usePerfil()
const { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion } = useAnulacion()

const centro = computed(() => carPorId(props.modulo.carId))
const activo = computed(() => vigente(props.modulo))
const ambientes = computed(() => ambientesDeModulo(props.modulo.id, { inactivos: props.inactivos }))
const descendientes = computed(() => ambientes.value.map((a) => nodoAmbienteRecursos(a, { situacion: props.situacion })))
const ambientesActivos = computed(() => ambientesDeModulo(props.modulo.id).length)
const evaluados = computed(() => cantidadEvaluados(props.modulo.estadoElementos, props.modulo.elementosAdicionales))
const totalElementos = computed(() => elementosDe(props.modulo.elementosAdicionales).length)
const criticos = computed(() => elementosCriticos(props.modulo.estadoElementos, props.modulo.elementosAdicionales).length)

const tabs = computed(() => [
  { name: 'ficha', label: 'Ficha' },
  { name: 'ambientes', label: `Ambientes (${ambientes.value.length})` }
])

const dialogos = reactive({ modulo: false, ambiente: false })
const abrirAmbiente = () => { dialogos.ambiente = true }

const accionesModulo = computed(() => {
  const m = props.modulo
  return [
    { label: 'Actualizar módulo', icono: 'edit', visible: puedeHacer('modulo.actualizar'), disable: !activo.value, accion: () => { dialogos.modulo = true } },
    {
      label: 'Anular módulo',
      icono: 'block',
      peligro: true,
      visible: puedeHacer('modulo.anular') && vigente(m),
      accion: () => pedirAnulacion({
        titulo: 'Anular módulo',
        subtitulo: `${m.nombre} · ${m.id}`,
        dependencias: dependenciasDeModulo(m),
        aviso: 'Antes de anular el módulo, mueva sus ambientes a otro módulo o anúlelos.',
        mensaje: 'Módulo anulado.',
        ejecutar: (datos) => anularModulo(m, datos),
        registro: m
      })
    },
    {
      label: 'Reactivar módulo',
      icono: 'restore',
      visible: puedeHacer('modulo.anular') && !vigente(m),
      accion: () => pedirReactivacion({ entidad: 'modulo', registro: m, nombre: 'Módulo' })
    }
  ]
})
</script>
