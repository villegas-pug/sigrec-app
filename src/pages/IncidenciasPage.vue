<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #acciones>
          <q-btn v-if="puedeHacer('bien.incidente')" unelevated color="primary" icon="report" label="Registrar incidente" @click="dialogoIncidente.abierto = true; dialogoIncidente.evento = null" />
          <q-btn v-if="puedeHacer('bien.baja')" outline color="negative" icon="remove_circle" label="Dar de baja" @click="abrirAccion('baja')" />
          <q-btn v-if="puedeHacer('bien.reposicion')" outline color="primary" icon="swap_horiz" label="Registrar reposición" @click="abrirAccion('reposicion')" />
        </template>
      </page-header>

      <div class="sg-filters">
        <q-select v-model="filtros.carId" :options="opcionesCar" emit-value map-options outlined dense label="Centro" />
        <q-input v-model="filtros.texto" outlined dense clearable label="Recurso (bien, rótulo o ambiente)" />
        <q-select v-model="filtros.tipo" :options="opcionesTipo" emit-value map-options outlined dense label="Hecho" />
        <q-select v-model="filtros.anio" :options="opcionesAnio" emit-value map-options outlined dense label="Período" />
        <div class="row items-center"><filtro-inactivos v-model="mostrarInactivos" /></div>
      </div>

      <section-card titulo="Hechos registrados" :subtitulo="`${eventos.length} hechos · del más reciente al más antiguo`" sin-relleno>
        <div class="sg-table-wrap">
          <table class="sg-table">
            <thead>
              <tr><th scope="col">Fecha</th><th scope="col">Hecho</th><th scope="col">Centro · ubicación</th><th scope="col">Recurso</th><th scope="col">Necesidad</th></tr>
            </thead>
            <tbody>
              <tr v-for="ev in eventos" :key="ev.id" :class="{ 'sg-row--selected': ev.id === eventoId }">
                <td>{{ fecha(ev.fecha) }}</td>
                <td>
                  <status-chip v-bind="TIPOS_EVENTO[ev.tipo]" />
                  <status-chip v-if="ev.anulacion" v-bind="CHIP_ANULADO" class="q-ml-xs" />
                </td>
                <td>{{ ubicacion(ev).car.nombre }} · {{ ubicacion(ev).ambiente.nombre }}</td>
                <td><button type="button" class="sg-row-btn" @click="seleccionar(ev.id)">{{ ev.titulo }}</button><div class="sg-muted">{{ ev.bienIds.join(', ') }}</div></td>
                <td><status-chip v-bind="estadoNecesidad(ev)" /></td>
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
            <router-link v-if="puedeAcceder('bienes')" :to="{ name: 'bienes', query: { bien: b.id } }" class="text-weight-bold">{{ b.nombre }} · {{ b.id }}</router-link>
            <span v-else class="text-weight-bold">{{ b.nombre }} · {{ b.id }}</span>
            <span class="sg-muted">Adquisición {{ fecha(b.adquisicion?.fecha) }} · vida útil {{ b.vidaUtilAnios ?? '—' }} años</span>
            <ul class="q-pl-md q-my-xs">
              <li v-for="a in antecedentesDeBien(b)" :key="a.id">{{ fecha(a.fecha) }} · {{ TIPOS_EVENTO[a.tipo].label }}: {{ a.titulo }}</li>
            </ul>
          </div>
        </div>

        <template v-else>
          <h3 class="sg-kv__label q-mt-none">Bienes reportados</h3>
          <div class="sg-table-wrap">
            <table class="sg-table">
              <thead>
                <tr><th scope="col">Bien</th><th scope="col">Condición actual</th><th scope="col">Situación</th><th scope="col">Necesidad</th></tr>
              </thead>
              <tbody>
                <tr v-for="b in afectados" :key="b.id">
                  <td>
                    <router-link v-if="puedeAcceder('bienes')" :to="{ name: 'bienes', query: { bien: b.id } }">{{ b.nombre }} · {{ b.id }}</router-link>
                    <template v-else>{{ b.nombre }} · {{ b.id }}</template>
                    <div v-if="evento.unidades && afectados.length === 1" class="sg-muted">{{ evento.unidades }} de {{ b.cantidad }} unidades afectadas</div>
                  </td>
                  <td><status-chip v-bind="condicion(b.condicion)" /></td>
                  <td><status-chip v-bind="SITUACIONES[b.situacion]" /></td>
                  <td>
                    <template v-if="necesidadDe(b.id)">
                      {{ CLASES[necesidadDe(b.id).clase] }} ·
                      <template v-if="necesidadDe(b.id).importe != null">{{ soles(necesidadDe(b.id).importe) }}</template>
                      <status-chip v-else tono="wa" label="Sin valorar" />
                    </template>
                    <status-chip v-else-if="reposicionDe(b.id)" tono="ok" label="Atendida por reposición" />
                    <span v-else class="sg-muted">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

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
                <router-link v-if="puedeAcceder('bienes')" :to="{ name: 'bienes', query: { bien: a.bien.id } }" class="text-weight-bold">{{ a.bien.nombre }} · {{ a.bien.id }}</router-link>
                <span v-else class="text-weight-bold">{{ a.bien.nombre }} · {{ a.bien.id }}</span>
                <span class="sg-muted">Antes en: {{ evento.bienIds[0] }} ({{ a.posicion ?? 'posición no informada' }})</span>
              </div>
            </div>
          </template>
        </template>
      </section-card>
    </div>

    <incidente-dialog v-model="dialogoIncidente.abierto" :evento="dialogoIncidente.evento" />
    <bien-accion-dialog v-model="dialogoAccion.abierto" :modo="dialogoAccion.modo" :candidatos="candidatosAccion" @hecho="seleccionarUltimo" />
    <anular-dialog v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
  </q-page>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import MenuAcciones from 'components/common/MenuAcciones.vue'
import FiltroInactivos from 'components/common/FiltroInactivos.vue'
import AnularDialog from 'components/common/AnularDialog.vue'
import IncidenteDialog from 'components/bienes/IncidenteDialog.vue'
import BienAccionDialog from 'components/bienes/BienAccionDialog.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useAnulacion } from 'src/composables/useAnulacion'
import { db, bienPorId, bienesDeAmbiente, ubicacionDeAmbiente, ubicacionDeBien, vigente } from 'src/services/datos'
import { antecedentesDeBien } from 'src/services/bienes'
import { calcularNecesidades } from 'src/services/necesidades'
import {
  anular, anularBaja, anularReposicion, dependenciasDeBaja, dependenciasDeReposicion, reposicionDe
} from 'src/services/acciones'
import { CHIP_ANULADO, INCIDENTES, SITUACIONES, TIPOS_EVENTO, TODOS, condicion } from 'src/config/catalogos'
import { ANIO_REVISION } from 'src/config/demo'
import { fecha, plural, soles } from 'src/utils/formato'

const CLASES = { renovacion: 'Renovación', reposicion: 'Reposición' }
const TIPOS_HISTORIAL = ['dano', 'robo', 'incendio', 'baja', 'reposicion']

const $q = useQuasar()
const router = useRouter()
const { carsEnAmbito, enAmbitoCar, carIdsEnAmbito, puedeAcceder, puedeHacer } = usePerfil()
const { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion } = useAnulacion()

const opcionesCar = computed(() => [{ label: 'Todos los centros del ámbito', value: TODOS }, ...carsEnAmbito.value.map((c) => ({ label: c.nombre, value: c.id }))])
const opcionesTipo = [{ label: 'Todos', value: TODOS }, ...TIPOS_HISTORIAL.map((t) => ({ label: TIPOS_EVENTO[t].label, value: t }))]
// Los años del filtro salen de los hechos registrados, del más reciente al más antiguo.
const opcionesAnio = computed(() => [
  { label: 'Todos los períodos', value: TODOS },
  ...[...new Set(db.eventos.map((ev) => ev.fecha.slice(0, 4)))].sort().reverse().map((a) => ({ label: a, value: a }))
])

const filtros = reactive({ carId: TODOS, texto: '', tipo: TODOS, anio: TODOS })
const mostrarInactivos = ref(false)
const detalleRef = ref(null)

const ubicacion = (ev) => ubicacionDeAmbiente(ev.ambienteId)

const eventos = computed(() => {
  const t = (filtros.texto ?? '').toLowerCase()
  return db.eventos
    .filter((ev) => TIPOS_HISTORIAL.includes(ev.tipo) && (mostrarInactivos.value || vigente(ev)))
    .filter((ev) => {
      const u = ubicacion(ev)
      if (!enAmbitoCar(u.car.id)) return false
      if (filtros.carId !== TODOS && u.car.id !== filtros.carId) return false
      if (filtros.tipo !== TODOS && ev.tipo !== filtros.tipo) return false
      if (filtros.anio !== TODOS && !ev.fecha.startsWith(filtros.anio)) return false
      if (!t) return true
      const nombres = ev.bienIds.map((id) => bienPorId(id)?.nombre ?? '').join(' ')
      return [ev.titulo, u.ambiente.nombre, nombres, ...ev.bienIds].some((v) => v.toLowerCase().includes(t))
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
})

const eventoId = ref(null)
watch(eventos, (lista) => {
  if (!lista.some((e) => e.id === eventoId.value)) eventoId.value = lista[0]?.id ?? null
}, { immediate: true })

// En pantallas pequeñas el detalle queda debajo de la tabla: se baja hasta él al elegir un hecho.
async function seleccionar (id) {
  eventoId.value = id
  if ($q.screen.lt.md) {
    await nextTick()
    detalleRef.value?.$el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
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

const pendientes = computed(() => calcularNecesidades({ anio: ANIO_REVISION, carIds: carIdsEnAmbito.value }).pendientes)
const necesidadDe = (bienId) => pendientes.value.find((n) => n.id === bienId) ?? null

function estadoNecesidad (ev) {
  if (ev.anulacion) return { tono: 'ne', label: 'Anulado' }
  if (ev.tipo === 'reposicion') return { tono: 'ok', label: 'Atendida' }
  if (ev.bienIds.some((id) => reposicionDe(id))) return { tono: 'ok', label: 'Atendida' }
  if (!ev.reportaNecesidad) return { tono: 'si', label: 'No reportada' }
  const abiertas = ev.bienIds.filter((id) => necesidadDe(id)).length
  return abiertas ? { tono: 'da', label: plural(abiertas, 'pendiente', 'pendientes') } : { tono: 'ne', label: 'Sin necesidad abierta' }
}

const dialogoIncidente = reactive({ abierto: false, evento: null })

// Baja y reposición se registran aquí eligiendo el bien; desde la ficha del bien se sigue pudiendo hacer lo mismo.
const dialogoAccion = reactive({ abierto: false, modo: 'baja' })

// Baja: bienes activos del ámbito. Reposición: bienes dados de baja que aún no tienen una reposición vigente.
const candidatosAccion = computed(() =>
  db.bienes.filter((b) => {
    if (!enAmbitoCar(ubicacionDeBien(b).car.id)) return false
    return dialogoAccion.modo === 'baja' ? b.situacion === 'activo' : b.situacion === 'baja' && !reposicionDe(b.id)
  })
)

function abrirAccion (modo) {
  Object.assign(dialogoAccion, { abierto: true, modo })
}

// El hecho recién registrado es el último del almacén: se muestra su detalle.
function seleccionarUltimo () {
  eventoId.value = db.eventos.at(-1)?.id ?? null
}

const verFicha = (bienId) => ({
  label: 'Ver ficha del bien',
  icono: 'inventory_2',
  visible: puedeAcceder('bienes'),
  accion: () => router.push({ name: 'bienes', query: { bien: bienId } })
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
        ejecutar: (datos) => anular(e, datos)
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
