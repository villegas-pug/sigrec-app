<template>
  <note-banner tono="in">
    Control preventivo del centro: extintores, fumigación y el historial de mantenimientos (también de equipos y vehículos).
    Los plazos son provisionales, por validar con las direcciones de los centros. Un control «sin programar» no está al día: falta su próxima fecha.
  </note-banner>

  <section-card titulo="Extintores" icono="fire_extinguisher" subtitulo="Son bienes del tipo «Extintor»: se registran desde el ambiente con «Registrar bien»">
    <div class="sg-kv-grid">
      <key-value etiqueta="Requeridos" nota="Se define en «Actualizar ficha»">
        <template v-if="extintores.requeridos != null">{{ extintores.requeridos }}</template>
        <status-chip v-else tono="si" label="No informado" />
      </key-value>
      <key-value etiqueta="Activos">{{ extintores.activos }}</key-value>
      <key-value etiqueta="Dotación">
        <status-chip v-if="extintores.faltantes == null" tono="si" label="No calculable" />
        <status-chip v-else-if="extintores.faltantes" tono="da" :label="`Faltan ${extintores.faltantes}`" />
        <status-chip v-else tono="ok" label="Dotación completa" />
      </key-value>
      <key-value etiqueta="Recargas">
        <div class="sg-chips">
          <status-chip v-if="extintores.vencidos" tono="da" :label="plural(extintores.vencidos, 'vencida', 'vencidas')" />
          <status-chip v-if="extintores.porVencer" tono="wa" :label="`${extintores.porVencer} por vencer`" />
          <status-chip v-if="!extintores.vencidos && !extintores.porVencer" tono="ne" label="Sin alertas" />
        </div>
      </key-value>
    </div>
    <div class="column q-gutter-y-sm q-mt-md">
      <div v-for="e in extintores.lista" :key="e.bien.id" class="sg-box">
        <div class="row items-start no-wrap justify-between">
          <div class="column">
            <button type="button" class="sg-row-btn text-weight-bold self-start" @click="$emit('seleccionar', e.bien.id)"><q-icon name="visibility" size="16px" aria-hidden="true" class="q-mr-xs" />{{ e.bien.nombre }} · {{ e.bien.id }}</button>
            <span class="sg-muted">{{ e.ambiente.nombre }}</span>
          </div>
          <status-chip v-bind="ESTADOS_CONTROL[e.estado]" />
        </div>
        <span class="sg-muted">
          Última recarga: {{ e.ultimo ? fecha(e.ultimo.fecha) : 'sin registro' }} ·
          Próxima: {{ e.proxima ? `${fecha(e.proxima)} (${plazo(e.dias)})` : 'sin programar' }}
        </span>
        <q-btn v-if="puedeHacer('mantenimiento.registrar') && activo" dense outline no-caps color="secondary" icon="fire_extinguisher" label="Registrar recarga" class="self-start" @click="abrir(null, 'recarga_extintor', e.bien.id)" />
      </div>
      <p v-if="!extintores.lista.length" class="sg-muted q-mb-none">El centro no tiene extintores activos registrados.</p>
    </div>
  </section-card>

  <section-card titulo="Fumigación" icono="pest_control" subtitulo="Control a nivel del centro">
    <template #acciones>
      <q-btn v-if="puedeHacer('mantenimiento.registrar')" unelevated color="primary" icon="add" label="Registrar fumigación" :disable="!activo" @click="abrir(null, 'fumigacion')" />
    </template>
    <div class="sg-kv-grid">
      <key-value etiqueta="Última fumigación">
        <template v-if="fumigacion.ultimo">{{ fecha(fumigacion.ultimo.fecha) }}</template>
        <status-chip v-else tono="si" label="Sin registro" />
      </key-value>
      <key-value etiqueta="Próxima">
        <template v-if="fumigacion.proxima">{{ fecha(fumigacion.proxima) }} ({{ plazo(fumigacion.dias) }})</template>
        <status-chip v-else tono="si" label="Sin programar" />
      </key-value>
      <key-value etiqueta="Estado"><status-chip v-bind="ESTADOS_CONTROL[fumigacion.estado]" /></key-value>
    </div>
  </section-card>

  <section-card :titulo="`Historial de mantenimientos (${historial.length})`" subtitulo="Fumigaciones, recargas y mantenimientos de equipos y vehículos del centro" sin-relleno>
    <template #acciones>
      <q-btn v-if="puedeHacer('mantenimiento.registrar')" outline color="secondary" icon="add" label="Registrar mantenimiento" :disable="!activo" @click="abrir(null, null)" />
    </template>
    <div v-for="m in historial" :id="`mantenimiento-${m.id}`" :key="m.id" class="sg-borde-superior q-px-md q-py-sm" :class="{ 'sg-box--resaltada': m.id === resaltado }">
      <div class="row items-start no-wrap justify-between">
        <div class="sg-chips items-center">
          <status-chip tono="in" :icono="TIPOS_MANTENIMIENTO[m.tipo]?.icono" :label="TIPOS_MANTENIMIENTO[m.tipo]?.label ?? m.tipo" />
          <status-chip v-if="m.anulacion" v-bind="CHIP_ANULADO" />
          <span class="text-weight-bold">{{ objetivoDe(m) }}</span>
        </div>
        <menu-acciones :items="acciones(m)" :etiqueta="`Acciones del mantenimiento del ${fecha(m.fecha)}`" />
      </div>
      <div class="column">
        <span class="sg-muted">
          Realizado el {{ fecha(m.fecha) }}<template v-if="m.proxima"> · Próxima: {{ fecha(m.proxima) }}</template><template v-if="m.importe != null"> · {{ soles(m.importe) }}</template>
        </span>
        <span v-if="m.detalle">{{ m.detalle }}</span>
        <span class="sg-muted">Informado por {{ m.informadoPor }}</span>
        <span v-if="m.anulacion" class="sg-muted">Anulado el {{ fecha(m.anulacion.fecha) }}: {{ m.anulacion.motivo }}</span>
      </div>
    </div>
    <p v-if="!historial.length" class="q-pa-md sg-muted q-mb-none">Sin mantenimientos registrados.</p>
  </section-card>

  <mantenimiento-dialog
    v-model="dialogo.abierto"
    :centro="centro"
    :mantenimiento="dialogo.mantenimiento"
    :tipo-inicial="dialogo.tipo"
    :bien-id="dialogo.bienId"
  />
  <anular-dialog v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
</template>

<script setup>
import { computed, nextTick, onMounted, reactive } from 'vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import KeyValue from 'components/common/KeyValue.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import MenuAcciones from 'components/common/MenuAcciones.vue'
import AnularDialog from 'components/common/AnularDialog.vue'
import MantenimientoDialog from 'components/centros/MantenimientoDialog.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useAnulacion } from 'src/composables/useAnulacion'
import { vigente } from 'src/services/datos'
import { anular } from 'src/services/acciones'
import { extintoresDeCentro, fumigacionDeCentro, mantenimientosDe, objetivoDe } from 'src/services/mantenimientos'
import { CHIP_ANULADO, ESTADOS_CONTROL, TIPOS_MANTENIMIENTO } from 'src/config/catalogos'
import { FECHA_CORTE } from 'src/config/demo'
import { fecha, plural, soles } from 'src/utils/formato'

const props = defineProps({
  centro: { type: Object, required: true },
  // Con «Mostrar inactivos» el historial incluye los mantenimientos anulados.
  inactivos: { type: Boolean, default: false },
  resaltado: { type: String, default: null }
})

defineEmits(['seleccionar'])

const { puedeHacer } = usePerfil()
const { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion } = useAnulacion()

const activo = computed(() => vigente(props.centro))
const extintores = computed(() => extintoresDeCentro(props.centro.id, FECHA_CORTE))
const fumigacion = computed(() => fumigacionDeCentro(props.centro.id, FECHA_CORTE))
const historial = computed(() => mantenimientosDe({ carId: props.centro.id }, { inactivos: props.inactivos }))

const plazo = (dias) => (dias >= 0 ? `en ${plural(dias, 'día', 'días')}` : `hace ${plural(-dias, 'día', 'días')}`)

const dialogo = reactive({ abierto: false, mantenimiento: null, tipo: null, bienId: null })
const abrir = (mantenimiento, tipo, bienId = null) => Object.assign(dialogo, { abierto: true, mantenimiento, tipo, bienId })

// Con ?mantenimiento= se baja hasta el registro resaltado.
onMounted(async () => {
  if (!props.resaltado) return
  await nextTick()
  document.getElementById(`mantenimiento-${props.resaltado}`)?.scrollIntoView({ block: 'center' })
})

const acciones = (m) => [
  { label: 'Actualizar mantenimiento', icono: 'edit', visible: puedeHacer('mantenimiento.actualizar') && vigente(m), accion: () => abrir(m, m.tipo) },
  {
    label: 'Anular mantenimiento',
    icono: 'block',
    peligro: true,
    visible: puedeHacer('mantenimiento.anular') && vigente(m),
    accion: () => pedirAnulacion({
      titulo: 'Anular mantenimiento',
      subtitulo: `${TIPOS_MANTENIMIENTO[m.tipo]?.label ?? m.tipo} · ${fecha(m.fecha)}`,
      aviso: 'El registro se conserva como antecedente; la próxima fecha vuelve a ser la del mantenimiento anterior, si lo hay.',
      mensaje: 'Mantenimiento anulado.',
      ejecutar: (datos) => anular(m, datos)
    })
  },
  { label: 'Reactivar mantenimiento', icono: 'restore', visible: puedeHacer('mantenimiento.anular') && !vigente(m), accion: () => pedirReactivacion({ entidad: 'mantenimiento', registro: m, nombre: 'Mantenimiento' }) }
]
</script>
