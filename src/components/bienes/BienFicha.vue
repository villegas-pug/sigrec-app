<template>
  <detalle-panel
    :nodo="`bien-${bien.id}`"
    :titulo="`${bien.nombre} · ${bien.id}`"
    :ruta="textoUbicacion(ubicacion) + cadenaAsociacion"
    :icono="esComponente ? 'extension' : 'label'"
    :tabs="tabs"
    :tab-inicial="tabInicial"
    :con-volver="conVolver"
    @volver="$emit('volver')" @seleccionar="$emit('seleccionar', $event)"
  >
    <template #chips>
      <status-chip tono="ne" :label="esComponente ? `Componente · ${CATEGORIAS[bien.categoria]}` : CATEGORIAS[bien.categoria]" />
      <status-chip v-bind="condicionBien" :label="`Condición: ${condicionBien.label}`" />
      <status-chip v-bind="SITUACIONES[bien.situacion]" />
      <status-chip v-if="bien.verificacion" :tono="bien.verificacion.resultado === 'coincide' ? 'ok' : 'wa'" :label="`Verificado el ${fecha(bien.verificacion.fecha)}`" />
      <status-chip v-else tono="si" label="Pendiente de verificación" />
      <status-chip v-if="bien.revisionPendiente" tono="wa" label="Situación por revisar" />
    </template>

    <template #acciones>
      <q-btn v-if="activo && puedeHacer('bien.actualizar')" unelevated color="primary" icon="edit" label="Actualizar información" @click="$emit('accion', 'datos')" />
      <q-btn v-if="!anulado && puedeHacer('bien.verificar') && !puedeHacer('bien.actualizar')" unelevated color="primary" icon="fact_check" label="Informar verificación" @click="$emit('accion', 'verificacion')" />
      <q-btn v-if="activo && puedeHacer('bien.incidente')" outline color="secondary" icon="report" label="Registrar incidente" @click="$emit('accion', 'incidente')" />
      <q-btn v-if="!activo && !anulado && !reposicion && puedeHacer('bien.reposicion')" unelevated color="primary" icon="swap_horiz" label="Registrar reposición: alta del bien nuevo" @click="$emit('accion', 'reposicion')" />
      <menu-acciones con-etiqueta :items="accionesMenu" :etiqueta="`Más acciones de ${bien.nombre}`" />
    </template>

    <template #ficha>
      <p v-if="activo && puedeHacer('bien.reposicion')" class="sg-muted">Para registrar una reposición y dar de alta el bien nuevo, primero registre la baja de este bien.</p>
      <router-link v-if="reposicion" :to="{ name: 'centros', query: { bien: reposicion.bienNuevoId } }">Ver el bien que ingresó por reposición: {{ reposicion.bienNuevoId }}</router-link>
      <note-banner v-if="anulado" tono="ne" icono="block">
        Registro anulado el {{ fecha(bien.anulacion.fecha) }} por {{ bien.anulacion.por }}. Motivo: {{ bien.anulacion.motivo }}
        No cuenta en las necesidades ni en los avisos.
      </note-banner>

      <section class="sg-ficha__summary" :aria-label="esComponente ? 'Resumen del componente' : 'Resumen del bien'">
        <div class="sg-ficha__item"><q-icon name="label" aria-hidden="true" /><key-value etiqueta="Rótulo SIGREC">{{ bien.id }}</key-value></div>
        <div class="sg-ficha__item"><q-icon name="inventory_2" aria-hidden="true" /><key-value etiqueta="Código patrimonial" :nota="bien.codigoPatrimonial ? '' : 'Sin código patrimonial'">{{ bien.codigoPatrimonial ?? 'No aplica' }}</key-value></div>
        <div class="sg-ficha__item"><q-icon name="event" aria-hidden="true" /><key-value etiqueta="Vida útil" nota="Valor de demostración, no es tabla oficial"><template v-if="bien.vidaUtilAnios != null">{{ plural(bien.vidaUtilAnios, 'año', 'años') }}<template v-if="fin"> · se cumple en {{ fin }}</template></template><status-chip v-else tono="si" label="Pendiente de definir" /></key-value></div>
      </section>
      <section-card titulo="Características" icono="category">
      <div class="sg-kv-grid">
        <key-value v-if="(bien.cantidad ?? 1) > 1" etiqueta="Cantidad">{{ bien.cantidad }} unidades</key-value>
        <key-value etiqueta="Descripción">{{ bien.descripcion || '—' }}</key-value>
        <key-value v-if="bien.marcaModelo" etiqueta="Marca y modelo" :nota="bien.serie ? `Serie ${bien.serie}` : ''">{{ bien.marcaModelo }}</key-value>
        <key-value etiqueta="Deterioro observado">{{ bien.deterioro || 'Sin deterioro informado' }}</key-value>
      </div>
      </section-card>
      <section-card titulo="Adquisición y valoración" icono="payments">
      <div class="sg-kv-grid">
        <key-value etiqueta="Fecha de adquisición">
          <template v-if="bien.adquisicion?.fecha">{{ fecha(bien.adquisicion.fecha) }}</template>
          <status-chip v-else tono="si" label="No informada" />
        </key-value>
        <key-value etiqueta="Costo de adquisición" nota="Costo original; no se usa para estimar la reposición">
          <template v-if="bien.adquisicion?.costo != null">{{ soles(bien.adquisicion.costo) }}</template>
          <status-chip v-else tono="si" label="No informado" />
        </key-value>
        <key-value etiqueta="Precio referencial" :nota="tipo?.procedencia ? `${tipo.nombre} · ${tipo.procedencia}` : tipo?.nombre">
          <template v-if="tipo?.precio != null">{{ soles(tipo.precio) }}</template>
          <status-chip v-else tono="wa" label="Sin precio referencial" />
        </key-value>
      </div>
      </section-card>
      <section-card v-if="muestraMantenimiento" titulo="Mantenimiento" icono="build" :subtitulo="esExtintor ? 'Recargas del extintor' : 'Mantenimiento del equipo'">
        <template v-if="activo && puedeHacer('mantenimiento.registrar')" #acciones>
          <q-btn outline color="secondary" icon="build" :label="esExtintor ? 'Registrar recarga' : 'Registrar mantenimiento'" @click="dialogoMantenimiento = true" />
        </template>
        <div class="sg-kv-grid">
          <key-value etiqueta="Último mantenimiento">
            <template v-if="control.ultimo">{{ fecha(control.ultimo.fecha) }}</template>
            <status-chip v-else tono="si" label="Sin registro" />
          </key-value>
          <key-value etiqueta="Próximo">
            <template v-if="control.proxima">{{ fecha(control.proxima) }} ({{ control.dias >= 0 ? `en ${plural(control.dias, 'día', 'días')}` : `hace ${plural(-control.dias, 'día', 'días')}` }})</template>
            <status-chip v-else tono="si" label="Sin programar" />
          </key-value>
          <key-value etiqueta="Estado"><status-chip v-bind="ESTADOS_CONTROL[control.estado]" /></key-value>
        </div>
      </section-card>

      <note-banner v-if="faltantes.length" tono="ne" icono="help">
        Antecedentes insuficientes: falta {{ faltantes.join(' y ') }}. No se calcula una renovación por vida útil.
      </note-banner>
      <note-banner v-if="necesidad" tono="wa" icono="event_repeat">
        <strong>Necesidad para revisión en {{ ANIO_REVISION }}:</strong> {{ necesidad.motivos.map((m) => m.texto).join(' · ') }}.
        No constituye autorización de baja ni de compra.
        <router-link v-if="puedeAcceder('necesidades')" :to="{ name: 'necesidades', query: { car: ubicacion.car.id, ...(bien.tipoId ? { tipo: bien.tipoId } : {}) } }" class="text-weight-bold">Ver necesidades</router-link>
      </note-banner>
      <note-banner v-if="reposicion" tono="ok" icono="swap_horiz">
        Repuesto por
        <button type="button" class="sg-row-btn" @click="$emit('seleccionar', reposicion.bienNuevoId)"><q-icon name="visibility" size="16px" aria-hidden="true" class="q-mr-xs" />{{ reposicion.bienNuevoId }}</button>
        el {{ fecha(reposicion.fecha) }}. La necesidad quedó atendida.
      </note-banner>
      <note-banner v-if="reemplazaA" tono="in" icono="swap_horiz">
        Alta por reposición de
        <button type="button" class="sg-row-btn" @click="$emit('seleccionar', reemplazaA.bienAnteriorId)"><q-icon name="visibility" size="16px" aria-hidden="true" class="q-mr-xs" />{{ reemplazaA.bienAnteriorId }}</button>.
        Este bien tiene antecedentes y vida útil propios.
      </note-banner>
    </template>

    <!-- Bien: sus componentes (un solo nivel). -->
    <template #componentes>
      <section-card titulo="Componentes" subtitulo="Piezas que forman parte de este bien, por ejemplo el colchón de una cama">
        <template v-if="activo" #acciones>
          <q-btn v-if="puedeHacer('bien.registrar')" unelevated color="primary" icon="add" label="Registrar componente" @click="$emit('accion', 'registrarComponente')" />
          <q-btn v-if="puedeHacer('bien.componente') && !asociaciones.hijos.length" outline color="secondary" icon="link" label="Asociar a otro bien" @click="$emit('accion', 'componente')" />
        </template>
        <div class="sg-kv-grid">
          <div v-for="h in asociaciones.hijos" :key="h.id" class="sg-box" :class="{ 'sg-box--dashed': h.revisionPendiente }">
            <span class="sg-kv__label">Componente</span>
            <button type="button" class="sg-row-btn" @click="$emit('seleccionar', h.id)"><q-icon name="visibility" size="16px" aria-hidden="true" class="q-mr-xs" />{{ h.nombre }} {{ h.id }}</button>
            <span class="sg-muted">{{ h.asociadoA.posicion }} · {{ condicion(h.condicion).label }} · {{ SITUACIONES[h.situacion].label }}</span>
            <status-chip v-if="h.revisionPendiente" tono="wa" label="Situación por revisar" />
          </div>
        </div>
        <p v-if="!asociaciones.hijos.length" class="sg-muted q-mb-none">Sin componentes registrados.</p>
      </section-card>
    </template>

    <!-- Componente: el bien del que forma parte y sus hermanos. -->
    <template #padre>
      <section-card titulo="Forma parte de" subtitulo="Un componente pertenece a un solo bien y no admite componentes propios">
        <template v-if="activo && puedeHacer('bien.componente')" #acciones>
          <q-btn outline color="secondary" icon="link_off" label="Quitar asociación" @click="$emit('accion', 'desasociar')" />
        </template>
        <div class="sg-kv-grid">
          <div v-if="asociaciones.padre" class="sg-box">
            <span class="sg-kv__label">Bien</span>
            <button type="button" class="sg-row-btn" @click="$emit('seleccionar', asociaciones.padre.id)"><q-icon name="visibility" size="16px" aria-hidden="true" class="q-mr-xs" />{{ asociaciones.padre.nombre }} {{ asociaciones.padre.id }}</button>
            <span class="sg-muted">Posición: {{ bien.asociadoA.posicion }} · {{ SITUACIONES[asociaciones.padre.situacion].label }}</span>
          </div>
          <div v-for="h in asociaciones.hermanos" :key="h.id" class="sg-box">
            <span class="sg-kv__label">Componente del mismo bien</span>
            <button type="button" class="sg-row-btn" @click="$emit('seleccionar', h.id)"><q-icon name="visibility" size="16px" aria-hidden="true" class="q-mr-xs" />{{ h.nombre }} {{ h.id }}</button>
            <span class="sg-muted">{{ h.asociadoA.posicion }} · {{ condicion(h.condicion).label }} · {{ SITUACIONES[h.situacion].label }}</span>
          </div>
        </div>
        <div v-if="bien.revisionPendiente" class="row q-gutter-sm q-mt-md">
          <span class="self-center">El bien del que forma parte fue dado de baja. Revise su situación:</span>
          <template v-if="puedeHacer('bien.baja')">
            <q-btn outline color="secondary" icon="check_circle" label="Mantener activo" @click="$emit('mantener')" />
            <q-btn outline color="negative" icon="remove_circle" label="Dar de baja" @click="$emit('accion', 'baja')" />
          </template>
        </div>
      </section-card>
    </template>

    <template #fotos>
      <galeria-fotos :bien="bien" titulo="Fotografías del bien" />
    </template>

    <template #antecedentes>
      <section-card titulo="Antecedentes">
        <hechos-contexto :bien-id="bien.id" :hecho-inicial="hechoInicial" />
        <q-expansion-item label="Historial completo del bien"><historial-bien :bien="bien" /></q-expansion-item>
      </section-card>
    </template>
  </detalle-panel>

  <mantenimiento-dialog
    v-model="dialogoMantenimiento"
    :centro="ubicacion.car"
    :tipo-inicial="esExtintor ? 'recarga_extintor' : 'mantenimiento_equipo'"
    :bien-id="bien.id"
  />
</template>

<script setup>
import HechosContexto from 'components/gestion/HechosContexto.vue'
import { computed, ref } from 'vue'
import { usePerfil } from 'src/composables/usePerfil'
import DetallePanel from 'components/gestion/DetallePanel.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import KeyValue from 'components/common/KeyValue.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import MenuAcciones from 'components/common/MenuAcciones.vue'
import HistorialBien from 'components/bienes/HistorialBien.vue'
import GaleriaFotos from 'components/centros/GaleriaFotos.vue'
import MantenimientoDialog from 'components/centros/MantenimientoDialog.vue'
import { db, bienPorId, tipoPorId, textoUbicacion, ubicacionDeBien } from 'src/services/datos'
import { asociacionesDeBien } from 'src/services/bienes'
import { antecedentesFaltantes, calcularNecesidades, finVidaUtil } from 'src/services/necesidades'
import { reposicionDe } from 'src/services/acciones'
import { controlDeBien } from 'src/services/mantenimientos'
import { CATEGORIAS, ESTADOS_CONTROL, SITUACIONES, TIPO_EXTINTOR, condicion } from 'src/config/catalogos'
import { ANIO_REVISION, FECHA_CORTE } from 'src/config/demo'
import { fecha, plural, soles } from 'src/utils/formato'

const props = defineProps({
  bien: { type: Object, required: true },
  tabInicial: { type: String, default: null },
  hechoInicial: { type: String, default: null },
  conVolver: { type: Boolean, default: false }
})

const emit = defineEmits(['accion', 'seleccionar', 'mantener', 'volver'])

const { puedeAcceder, puedeHacer } = usePerfil()

const ubicacion = computed(() => ubicacionDeBien(props.bien))
const tipo = computed(() => tipoPorId(props.bien.tipoId))
const activo = computed(() => props.bien.situacion === 'activo')
const anulado = computed(() => props.bien.situacion === 'anulado')
const esComponente = computed(() => !!props.bien.asociadoA)
const condicionBien = computed(() => condicion(props.bien.condicion))
const fin = computed(() => finVidaUtil(props.bien))
const faltantes = computed(() => antecedentesFaltantes(props.bien))
const asociaciones = computed(() => asociacionesDeBien(props.bien))
const reposicion = computed(() => reposicionDe(props.bien.id))

// Mantenimiento: lo muestran los equipos y los extintores (y cualquier bien que ya tenga registros).
const dialogoMantenimiento = ref(false)
const esExtintor = computed(() => props.bien.tipoId === TIPO_EXTINTOR)
// Control único del bien (SPEC 011): recarga si es extintor; mantenimiento de equipo en lo demás.
const control = computed(() => controlDeBien(props.bien, FECHA_CORTE))
const muestraMantenimiento = computed(() => !anulado.value && (props.bien.categoria === 'equipo' || esExtintor.value || !!control.value.ultimo))
const reemplazaA = computed(() => db.eventos.find((e) => !e.anulacion && e.tipo === 'reposicion' && e.bienNuevoId === props.bien.id) ?? null)

// Un bien muestra sus componentes; un componente, el bien del que forma parte.
const tabs = computed(() => [
  { name: 'ficha', label: 'Ficha' },
  esComponente.value
    ? { name: 'padre', label: 'Forma parte de' }
    : { name: 'componentes', label: `Componentes (${asociaciones.value.hijos.length})` },
  { name: 'fotos', label: 'Fotografías' },
  { name: 'antecedentes', label: 'Antecedentes' }
])

const cadenaAsociacion = computed(() => {
  const padre = props.bien.asociadoA ? bienPorId(props.bien.asociadoA.bienId) : null
  return padre ? ` › ${padre.nombre} ${padre.id}` : ''
})

const necesidad = computed(() =>
  activo.value
    ? calcularNecesidades({ anio: ANIO_REVISION, carIds: [ubicacion.value.car.id] }).pendientes.find((n) => n.id === props.bien.id) ?? null
    : null
)

// Acciones menos frecuentes en el menú «⋮».
const accionesMenu = computed(() => [
  { label: 'Informar verificación', icono: 'fact_check', visible: !anulado.value && puedeHacer('bien.verificar') && puedeHacer('bien.actualizar'), accion: () => emit('accion', 'verificacion') },
  { label: 'Dar de baja', icono: 'remove_circle', peligro: true, visible: activo.value && puedeHacer('bien.baja'), accion: () => emit('accion', 'baja') },
  { label: 'Trasladar a otro ambiente', icono: 'moving', visible: activo.value && puedeHacer('bien.trasladar'), accion: () => emit('accion', 'trasladar') },
  { label: 'Anular registro', icono: 'block', peligro: true, visible: !anulado.value && puedeHacer('bien.anular'), accion: () => emit('accion', 'anular') },
  { label: 'Reactivar registro', icono: 'restore', visible: anulado.value && puedeHacer('bien.anular'), accion: () => emit('accion', 'reactivar') }
])
</script>
