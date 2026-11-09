<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #acciones>
          <q-btn v-if="puedeHacer('bien.incidente')" unelevated color="primary" icon="report" label="Registrar incidente" @click="Object.assign(dialogoIncidente, { abierto: true, evento: null })" />
          <q-btn v-if="puedeHacer('bien.baja')" outline color="negative" icon="remove_circle" label="Dar de baja" @click="abrirAccion('baja')" />
          <q-btn v-if="puedeHacer('bien.reposicion')" outline color="primary" icon="swap_horiz" label="Registrar reposición" @click="abrirAccion('reposicion')" />
        </template>
      </page-header>

      <registro-no-disponible v-if="hechoNoDisponible" entidad="El hecho" :id="hechoPedido" :volver="{ name: 'incidencias' }" etiqueta-volver="Ver todos los hechos" />

      <div class="sg-filters">
        <q-select v-model="carId" :options="opcionesCar" emit-value map-options outlined dense label="Centro">
          <template #append><boton-dictado v-model="carId" tipo="opcion" :opciones="opcionesCar" emit-value /></template>
        </q-select>
        <q-select v-model="filtros.ambienteId" :options="opcionesAmbiente" emit-value map-options outlined dense label="Ambiente" :disable="carId === TODOS" :hint="carId === TODOS ? 'Elija un centro' : ''">
          <template #append><boton-dictado v-model="filtros.ambienteId" tipo="opcion" :opciones="opcionesAmbiente" emit-value :disable="carId === TODOS" /></template>
        </q-select>
        <q-input v-model="filtros.texto" outlined dense clearable label="Recurso (bien, rótulo o ambiente)">
          <template #append><boton-dictado v-model="filtros.texto" /></template>
        </q-input>
        <q-select v-model="filtros.tipo" :options="opcionesTipo" emit-value map-options outlined dense label="Hecho">
          <template #append><boton-dictado v-model="filtros.tipo" tipo="opcion" :opciones="opcionesTipo" emit-value /></template>
        </q-select>
        <q-select v-model="filtros.necesidad" :options="OPCIONES_NECESIDAD" emit-value map-options outlined dense label="Necesidad">
          <template #append><boton-dictado v-model="filtros.necesidad" tipo="opcion" :opciones="OPCIONES_NECESIDAD" emit-value /></template>
        </q-select>
        <q-select v-model="filtros.anio" :options="opcionesAnio" emit-value map-options outlined dense label="Período">
          <template #append><boton-dictado v-model="filtros.anio" tipo="opcion" :opciones="opcionesAnio" emit-value /></template>
        </q-select>
        <div class="row items-center q-gutter-x-sm">
          <filtro-inactivos v-model="mostrarInactivos" />
          <q-btn flat dense color="secondary" icon="filter_alt_off" label="Limpiar filtros" @click="limpiarFiltros" />
        </div>
      </div>

      <section-card titulo="Hechos registrados" :subtitulo="`${plural(eventos.length, 'hecho', 'hechos')} · del más reciente al más antiguo`" sin-relleno>
        <div class="sg-table-wrap">
          <table class="sg-table">
            <thead>
              <tr><th scope="col">Fecha</th><th scope="col">Hecho</th><th scope="col">Centro · ubicación</th><th scope="col">Recurso</th><th scope="col">Necesidad</th></tr>
            </thead>
            <tbody>
              <tr v-for="ev in eventos" :key="ev.id" :class="{ 'sg-row--selected': ev.id === eventoId }" :aria-current="ev.id === eventoId ? 'true' : undefined">
                <td>{{ fecha(ev.fecha) }}</td>
                <td>
                  <status-chip v-bind="TIPOS_EVENTO[ev.tipo]" />
                  <status-chip v-if="ev.anulacion" v-bind="CHIP_ANULADO" class="q-ml-xs" />
                </td>
                <td>{{ ubicacion(ev).car.nombre }} · {{ ubicacion(ev).ambiente.nombre }}</td>
                <td><button type="button" class="sg-row-btn" @click="seleccionar(ev.id)"><q-icon name="visibility" size="16px" aria-hidden="true" class="q-mr-xs" />{{ ev.titulo }}</button><div class="sg-muted">{{ ev.bienIds.join(', ') }}</div></td>
                <td><status-chip :tono="estadoNecesidad(ev).tono" :label="estadoNecesidad(ev).label" /></td>
              </tr>
              <tr v-if="!eventos.length"><td colspan="5" class="sg-muted">Sin hechos para los filtros seleccionados.</td></tr>
            </tbody>
          </table>
        </div>
      </section-card>

      <section-card v-if="evento" ref="detalleRef" :titulo="`${TIPOS_EVENTO[evento.tipo].label} · ${evento.titulo}`" :subtitulo="`${fecha(evento.fecha)} · ${ubicacion(evento).car.nombre} › ${ubicacion(evento).ambiente.nombre} · informado por ${evento.informadoPor}`">
        <template #acciones>
          <menu-acciones :items="accionesEvento" :etiqueta="`Acciones del hecho ${evento.titulo}`" />
        </template>
        <note-banner v-if="evento.anulacion" tono="ne" icono="block" class="q-mb-md">
          Hecho anulado el {{ fecha(evento.anulacion.fecha) }} por {{ evento.anulacion.por }}. Motivo: {{ evento.anulacion.motivo }}
          No genera necesidades.
        </note-banner>
        <p v-if="evento.detalle">{{ evento.detalle }}</p>
        <p v-if="evento.registradoEl && evento.registradoEl !== evento.fecha" class="sg-muted">Registrado el {{ fecha(evento.registradoEl) }}.</p>

        <div v-if="evento.tipo === 'reposicion'" class="sg-grid-2">
          <div v-for="(b, idx) in [bienPorId(evento.bienAnteriorId), bienPorId(evento.bienNuevoId)]" :key="b.id" class="sg-box">
            <div class="sg-chips">
              <status-chip v-bind="SITUACIONES[b.situacion]" />
              <status-chip :tono="idx === 0 ? 'ne' : 'in'" :label="idx === 0 ? 'Bien anterior' : 'Reposición'" />
            </div>
            <router-link v-if="puedeAcceder('centros')" :to="{ name: 'centros', query: { bien: b.id } }" class="text-weight-bold">{{ b.nombre }} · {{ b.id }}</router-link>
            <span v-else class="text-weight-bold">{{ b.nombre }} · {{ b.id }}</span>
            <span class="sg-muted">{{ textoUbicacion(ubicacionDeBien(b)) }}</span>
            <span class="sg-muted">Adquisición {{ fecha(b.adquisicion?.fecha) }} · vida útil {{ b.vidaUtilAnios != null ? plural(b.vidaUtilAnios, 'año', 'años') : '—' }}</span>
            <q-expansion-item dense label="Historial del bien" header-class="q-px-none">
              <historial-bien :bien="b" :tipos-seleccionables="TIPOS_HISTORIAL" @seleccionar="irAHecho" />
            </q-expansion-item>
          </div>
        </div>

        <template v-else>
          <h3 class="sg-kv__label q-mt-none">Bienes reportados</h3>
          <div class="sg-table-wrap">
            <table class="sg-table">
              <thead>
                <tr><th scope="col">Bien</th><th scope="col">Condición actual</th><th scope="col">Situación</th><th scope="col">Necesidad</th><th v-if="esIncidente" scope="col">Siguiente paso</th></tr>
              </thead>
              <tbody>
                <tr v-for="b in afectados" :key="b.id">
                  <td>
                    <router-link v-if="puedeAcceder('centros')" :to="{ name: 'centros', query: { bien: b.id } }">{{ b.nombre }} · {{ b.id }}</router-link>
                    <template v-else>{{ b.nombre }} · {{ b.id }}</template>
                    <div class="sg-muted">{{ textoUbicacion(ubicacionDeBien(b)) }}</div>
                    <div v-if="evento.unidades && afectados.length === 1" class="sg-muted">{{ evento.unidades }} de {{ b.cantidad }} unidades afectadas</div>
                  </td>
                  <td><status-chip v-bind="condicion(b.condicion)" /></td>
                  <td><status-chip v-bind="SITUACIONES[b.situacion]" /></td>
                  <td>
                    <status-chip :tono="estadoDeBien(evento, b.id).tono" :label="estadoDeBien(evento, b.id).label" />
                    <div v-if="necesidadDe(b.id)" class="sg-muted">
                      {{ CLASES[necesidadDe(b.id).clase] }} ·
                      <template v-if="necesidadDe(b.id).importe != null">{{ soles(necesidadDe(b.id).importe) }}</template>
                      <status-chip v-else tono="wa" label="Sin valorar" />
                    </div>
                  </td>
                  <td v-if="esIncidente">
                    <q-btn
                      v-if="pasoDe(evento, b.id)"
                      outline
                      dense
                      no-caps
                      :color="pasoDe(evento, b.id).color"
                      :icon="pasoDe(evento, b.id).icono"
                      :label="pasoDe(evento, b.id).label"
                      @click="abrirPaso(b, pasoDe(evento, b.id).modo)"
                    />
                    <span v-else class="sg-muted">Ninguno</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <q-expansion-item v-for="b in afectados" :key="`h-${b.id}`" dense :default-opened="afectados.length === 1" :label="`Historial de ${b.nombre} · ${b.id}`" header-class="q-px-none">
            <historial-bien :bien="b" :tipos-seleccionables="TIPOS_HISTORIAL" @seleccionar="irAHecho">
              <template #extra="{ item }">
                <status-chip v-if="INCIDENTES.includes(item.tipo)" class="q-ml-xs" :tono="estadoDeBien(item, b.id).tono" :label="estadoDeBien(item, b.id).label" />
              </template>
            </historial-bien>
          </q-expansion-item>

          <div v-if="esIncidente" class="sg-box sg-box--dashed q-mt-md">
            <span class="text-weight-bold">{{ plural(noAfectados.length, 'bien no reportado como afectado', 'bienes no reportados como afectados') }}</span>
            <span class="sg-muted">{{ noAfectados.map((b) => b.nombre).join(', ') || '—' }}. Su condición no cambia por este hecho.</span>
          </div>

          <template v-if="evento.tipo === 'baja' && asociados.length">
            <note-banner tono="in" class="q-mt-md">
              La baja no da de baja los bienes asociados. La relación se conserva como antecedente y cada uno requiere revisar su situación.
            </note-banner>
            <div class="sg-grid-2 q-mt-md">
              <div v-for="a in asociados" :key="a.bien.id" class="sg-box" :class="{ 'sg-box--dashed': a.bien.revisionPendiente }">
                <div class="sg-chips">
                  <status-chip v-bind="condicion(a.bien.condicion)" />
                  <status-chip v-bind="SITUACIONES[a.bien.situacion]" />
                  <status-chip v-if="a.bien.revisionPendiente" tono="wa" label="Situación por revisar" />
                </div>
                <router-link v-if="puedeAcceder('centros')" :to="{ name: 'centros', query: { bien: a.bien.id } }" class="text-weight-bold">{{ a.bien.nombre }} · {{ a.bien.id }}</router-link>
                <span v-else class="text-weight-bold">{{ a.bien.nombre }} · {{ a.bien.id }}</span>
                <span class="sg-muted">Antes en: {{ evento.bienIds[0] }} ({{ a.posicion ?? 'posición no informada' }})</span>
              </div>
            </div>
          </template>
        </template>
      </section-card>
    </div>

    <incidente-dialog v-model="dialogoIncidente.abierto" :evento="dialogoIncidente.evento" :car-inicial="carContexto" @hecho="seleccionarUltimo" />
    <bien-accion-dialog v-model="dialogoAccion.abierto" :modo="dialogoAccion.modo" :bien="dialogoAccion.bien" :car-inicial="carContexto" @hecho="alRegistrarAccion" />
    <anular-dialog v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
  </q-page>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed, reactive, ref, toRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import RegistroNoDisponible from 'components/common/RegistroNoDisponible.vue'
import MenuAcciones from 'components/common/MenuAcciones.vue'
import FiltroInactivos from 'components/common/FiltroInactivos.vue'
import AnularDialog from 'components/common/AnularDialog.vue'
import IncidenteDialog from 'components/bienes/IncidenteDialog.vue'
import BienAccionDialog from 'components/bienes/BienAccionDialog.vue'
import HistorialBien from 'components/bienes/HistorialBien.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useAnulacion } from 'src/composables/useAnulacion'
import { useCentroSeleccionado } from 'src/composables/useCentroSeleccionado'
import { useEstadoNavegacion } from 'src/composables/useEstadoNavegacion'
import { db, ambientesDeCar, bienPorId, bienesDeAmbiente, textoUbicacion, ubicacionDeAmbiente, ubicacionDeBien, vigente } from 'src/services/datos'
import { calcularNecesidades } from 'src/services/necesidades'
import { siguientePaso } from 'src/services/bienes'
import {
  anular, anularBaja, anularReposicion, dependenciasDeBaja, dependenciasDeReposicion, reposicionDe
} from 'src/services/acciones'
import { CHIP_ANULADO, INCIDENTES, SITUACIONES, TIPOS_EVENTO, TODOS, condicion } from 'src/config/catalogos'
import { ANIO_REVISION } from 'src/config/demo'
import { fecha, plural, soles } from 'src/utils/formato'
import { mostrarDetalle, parametro } from 'src/utils/navegacion'

const CLASES = { renovacion: 'Renovación', reposicion: 'Reposición' }
const TIPOS_HISTORIAL = ['dano', 'robo', 'incendio', 'baja', 'reposicion']

// Estados de necesidad: el mismo significado en el listado y en el detalle.
const ESTADOS = {
  pendiente: { clave: 'pendiente', tono: 'da', label: 'Pendiente' },
  atendida: { clave: 'atendida', tono: 'ok', label: 'Atendida' },
  sin: { clave: 'sin', tono: 'ne', label: 'Sin necesidad reportada' },
  sinAbierta: { clave: 'sin', tono: 'ne', label: 'Sin necesidad abierta' },
  anulado: { clave: 'anulado', tono: 'ne', label: 'Anulado' }
}
const OPCIONES_NECESIDAD = [
  { label: 'Todas', value: TODOS },
  { label: ESTADOS.pendiente.label, value: 'pendiente' },
  { label: ESTADOS.atendida.label, value: 'atendida' },
  { label: ESTADOS.sin.label, value: 'sin' },
  { label: ESTADOS.anulado.label, value: 'anulado' }
]

const route = useRoute()
const router = useRouter()
const { enAmbitoCar, carIdsEnAmbito, puedeAcceder, puedeHacer } = usePerfil()
const { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion } = useAnulacion()
const { carId, opcionesCar } = useCentroSeleccionado(route.query.car, { todos: true })

// Centro que heredan los formularios; con «Todos» no hay contexto y se pide elegirlo.
const carContexto = computed(() => (carId.value === TODOS ? null : carId.value))

const opcionesAmbiente = computed(() => [
  { label: 'Todos los ambientes', value: TODOS },
  ...(carContexto.value ? ambientesDeCar(carContexto.value).map((a) => ({ label: a.nombre, value: a.id })) : [])
])
const opcionesTipo = [{ label: 'Todos', value: TODOS }, ...TIPOS_HISTORIAL.map((t) => ({ label: TIPOS_EVENTO[t].label, value: t }))]
// Los años del filtro salen de los hechos registrados, del más reciente al más antiguo.
const opcionesAnio = computed(() => [
  { label: 'Todos los períodos', value: TODOS },
  ...[...new Set(db.eventos.map((ev) => ev.fecha.slice(0, 4)))].sort().reverse().map((a) => ({ label: a, value: a }))
])

const pendientes = computed(() => calcularNecesidades({ anio: ANIO_REVISION, carIds: carIdsEnAmbito.value }).pendientes)
const necesidadDe = (bienId) => pendientes.value.find((n) => n.id === bienId) ?? null

// Estado de la necesidad de un bien frente a un hecho. Un incidente sobre un bien activo con necesidad pide darlo de baja;
// si ya está dado de baja y sin reposición, pide la reposición.
function estadoDeBien (ev, bienId) {
  if (ev.anulacion) return ESTADOS.anulado
  if (ev.tipo === 'reposicion' || reposicionDe(bienId)) return ESTADOS.atendida
  if (!INCIDENTES.includes(ev.tipo) || !ev.reportaNecesidad) return ESTADOS.sin
  if (bienPorId(bienId)?.situacion === 'baja') return ESTADOS.pendiente
  return necesidadDe(bienId) ? ESTADOS.pendiente : ESTADOS.sinAbierta
}

// Siguiente paso de un incidente con necesidad pendiente (nulo si no hay o el perfil no puede hacerlo).
function pasoDe (ev, bienId) {
  if (estadoDeBien(ev, bienId) !== ESTADOS.pendiente) return null
  const paso = siguientePaso(bienPorId(bienId))
  return paso && puedeHacer(paso.permiso) ? paso : null
}

// Resumen del hecho: pendiente si algún bien lo está; si no, atendida si alguno lo está.
function estadoNecesidad (ev) {
  const estados = ev.bienIds.map((id) => estadoDeBien(ev, id))
  const pend = estados.filter((e) => e === ESTADOS.pendiente).length
  if (pend) return { ...ESTADOS.pendiente, label: ev.bienIds.length > 1 ? plural(pend, 'pendiente', 'pendientes') : ESTADOS.pendiente.label }
  return estados.find((e) => e === ESTADOS.atendida) ?? estados[0] ?? ESTADOS.sin
}

const filtros = reactive({ ambienteId: TODOS, texto: '', tipo: TODOS, necesidad: TODOS, anio: TODOS })
// Un hecho anulado pedido por enlace solo se ve con los inactivos.
const mostrarInactivos = ref(!!db.eventos.find((e) => e.id === parametro(route.query.hecho))?.anulacion)
const detalleRef = ref(null)

function limpiarFiltros () {
  hechoNoDisponible.value = false
  carId.value = opcionesCar.value[0]?.value ?? TODOS
  Object.assign(filtros, { ambienteId: TODOS, texto: '', tipo: TODOS, necesidad: TODOS, anio: TODOS })
  mostrarInactivos.value = false
}

const ubicacion = (ev) => ubicacionDeAmbiente(ev.ambienteId)

const eventos = computed(() => {
  const t = (filtros.texto ?? '').toLowerCase()
  return db.eventos
    .filter((ev) => TIPOS_HISTORIAL.includes(ev.tipo) && (mostrarInactivos.value || vigente(ev)))
    .filter((ev) => {
      const u = ubicacion(ev)
      if (!enAmbitoCar(u.car.id)) return false
      if (carId.value !== TODOS && u.car.id !== carId.value) return false
      if (filtros.ambienteId !== TODOS && ev.ambienteId !== filtros.ambienteId) return false
      if (filtros.tipo !== TODOS && ev.tipo !== filtros.tipo) return false
      if (filtros.necesidad !== TODOS && estadoNecesidad(ev).clave !== filtros.necesidad) return false
      if (filtros.anio !== TODOS && !ev.fecha.startsWith(filtros.anio)) return false
      if (!t) return true
      const nombres = ev.bienIds.map((id) => bienPorId(id)?.nombre ?? '').join(' ')
      return [ev.titulo, u.ambiente.nombre, nombres, ...ev.bienIds].some((v) => v.toLowerCase().includes(t))
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
})

// Enlace profundo (?hecho=): se selecciona ese hecho; si no existe o no se puede ver, se avisa y no se elige otro.
const hechoPedido = parametro(route.query.hecho)
const hechoNoDisponible = ref(!!hechoPedido && !eventos.value.some((e) => e.id === hechoPedido))
const eventoId = ref(hechoNoDisponible.value ? null : hechoPedido)

// Al volver con «Atrás» se recuperan los filtros y el hecho elegido. Va antes del watch de `carId` para no reiniciar el ambiente restaurado.
useEstadoNavegacion('incidencias', {
  carId,
  ambienteId: toRef(filtros, 'ambienteId'),
  texto: toRef(filtros, 'texto'),
  tipo: toRef(filtros, 'tipo'),
  necesidad: toRef(filtros, 'necesidad'),
  anio: toRef(filtros, 'anio'),
  mostrarInactivos,
  eventoId
})

// El ambiente pertenece a un centro: al cambiar de centro deja de aplicar.
watch(carId, () => { filtros.ambienteId = TODOS })

watch(eventos, (lista) => {
  if (hechoNoDisponible.value) return
  if (!lista.some((e) => e.id === eventoId.value)) eventoId.value = lista[0]?.id ?? null
}, { immediate: true })

// El detalle queda debajo de la tabla: al elegir un hecho se resalta su fila y, si el detalle no está a la vista, se baja hasta él.
function seleccionar (id) {
  hechoNoDisponible.value = false
  eventoId.value = id
  mostrarDetalle(detalleRef)
}

const evento = computed(() => db.eventos.find((e) => e.id === eventoId.value) ?? null)
const esIncidente = computed(() => INCIDENTES.includes(evento.value?.tipo))
const afectados = computed(() => (evento.value ? evento.value.bienIds.map(bienPorId).filter(Boolean) : []))
const noAfectados = computed(() =>
  evento.value ? bienesDeAmbiente(evento.value.ambienteId).filter((b) => !evento.value.bienIds.includes(b.id) && b.situacion === 'activo') : []
)

// Componentes que tenía el bien al darse de baja (si el hecho los guardó) o, en su defecto, los que tiene hoy.
const asociados = computed(() => {
  const e = evento.value
  if (!e) return []
  if (e.componentes) return e.componentes.map((c) => ({ bien: bienPorId(c.bienId), posicion: c.posicion })).filter((a) => a.bien)
  return db.bienes
    .filter((b) => b.asociadoA?.bienId === e.bienIds[0])
    .map((b) => ({ bien: b, posicion: b.asociadoA.posicion }))
})

const dialogoIncidente = reactive({ abierto: false, evento: null })

// Baja y reposición se registran aquí eligiendo Centro › Ambiente › Bien, o desde «Siguiente paso» con el bien ya elegido.
const dialogoAccion = reactive({ abierto: false, modo: 'baja', bien: null })

function abrirAccion (modo, bien = null) {
  Object.assign(dialogoAccion, { abierto: true, modo, bien })
}

const abrirPaso = (bien, modo) => abrirAccion(modo, bien)

// El hecho recién registrado es el último del almacén: se muestra su detalle.
function seleccionarUltimo () {
  eventoId.value = db.eventos.at(-1)?.id ?? null
}

// Un paso iniciado desde un incidente no cambia el hecho que se está viendo; su estado se actualiza solo.
function alRegistrarAccion () {
  if (!dialogoAccion.bien) seleccionarUltimo()
}

// Salta a un hecho del historial; si un filtro lo oculta, los limpia primero.
function irAHecho (id) {
  if (!eventos.value.some((e) => e.id === id)) limpiarFiltros()
  seleccionar(id)
}

const verFicha = (bienId) => ({
  label: 'Ver ficha del bien',
  icono: 'inventory_2',
  visible: puedeAcceder('centros'),
  accion: () => router.push({ name: 'centros', query: { bien: bienId } })
})

// Los incidentes se corrigen o anulan sin cambiar el estado del bien. Las bajas y reposiciones cambian el estado de un bien:
// solo se anulan por error de registro (reversión en orden inverso: primero la reposición y después la baja).
const accionesEvento = computed(() => {
  const e = evento.value
  if (!e) return []
  if (e.tipo === 'baja') {
    return [
      verFicha(e.bienIds[0]),
      {
        label: 'Anular baja',
        icono: 'block',
        peligro: true,
        visible: puedeHacer('baja.anular') && vigente(e),
        accion: () => pedirAnulacion({
          titulo: 'Anular baja',
          subtitulo: e.titulo,
          aviso: 'Use esta opción solo si la baja se registró por error. El bien vuelve a estar activo y a contar en los cálculos.',
          dependencias: dependenciasDeBaja(e),
          mensaje: 'Baja anulada. El bien está activo nuevamente.',
          ejecutar: (datos) => anularBaja(e, datos)
        })
      }
    ]
  }
  if (e.tipo === 'reposicion') {
    return [
      verFicha(e.bienNuevoId),
      {
        label: 'Anular reposición',
        icono: 'block',
        peligro: true,
        visible: puedeHacer('reposicion.anular') && vigente(e),
        accion: () => pedirAnulacion({
          titulo: 'Anular reposición',
          subtitulo: e.titulo,
          aviso: 'Use esta opción solo si la reposición se registró por error. El bien nuevo se anula y el anterior sigue dado de baja.',
          dependencias: dependenciasDeReposicion(e),
          mensaje: 'Reposición anulada. El bien anterior sigue dado de baja.',
          ejecutar: (datos) => anularReposicion(e, datos)
        })
      }
    ]
  }
  if (!esIncidente.value) return []
  return [
    {
      label: 'Actualizar incidente',
      icono: 'edit',
      visible: puedeHacer('incidente.actualizar') && vigente(e),
      accion: () => Object.assign(dialogoIncidente, { abierto: true, evento: e })
    },
    {
      label: 'Anular incidente',
      icono: 'block',
      peligro: true,
      visible: puedeHacer('incidente.anular') && vigente(e),
      accion: () => pedirAnulacion({
        titulo: 'Anular incidente',
        subtitulo: e.titulo,
        aviso: 'Un incidente anulado deja de generar necesidades. La condición de los bienes no se revierte: corríjala desde la ficha del bien.',
        mensaje: 'Incidente anulado.',
        ejecutar: (datos) => anular(e, datos),
      registro: e
      })
    },
    {
      label: 'Reactivar incidente',
      icono: 'restore',
      visible: puedeHacer('incidente.anular') && !vigente(e),
      accion: () => pedirReactivacion({ entidad: 'incidente', registro: e, nombre: 'Incidente' })
    }
  ]
})
</script>
