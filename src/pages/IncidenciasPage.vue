<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #acciones>
          <q-btn v-if="puedeAcceder('bienes')" unelevated color="primary" icon="report" label="Registrar desde la ficha del bien" :to="{ name: 'bienes' }" />
        </template>
      </page-header>

      <div class="sg-filters">
        <q-select v-model="filtros.carId" :options="opcionesCar" emit-value map-options outlined dense label="Establecimiento (CAR)" />
        <q-input v-model="filtros.texto" outlined dense clearable label="Recurso (bien, rótulo o ambiente)" />
        <q-select v-model="filtros.tipo" :options="opcionesTipo" emit-value map-options outlined dense label="Hecho" />
        <q-select v-model="filtros.anio" :options="opcionesAnio" emit-value map-options outlined dense label="Período" />
      </div>

      <section-card titulo="Hechos registrados" :subtitulo="`${eventos.length} hechos · del más reciente al más antiguo`" sin-relleno>
        <div class="sg-table-wrap">
          <table class="sg-table">
            <thead>
              <tr><th scope="col">Fecha</th><th scope="col">Hecho</th><th scope="col">CAR · ubicación</th><th scope="col">Recurso</th><th scope="col">Necesidad</th></tr>
            </thead>
            <tbody>
              <tr v-for="ev in eventos" :key="ev.id" :class="{ 'sg-row--selected': ev.id === eventoId }">
                <td>{{ fecha(ev.fecha) }}</td>
                <td><status-chip v-bind="TIPOS_EVENTO[ev.tipo]" /></td>
                <td>{{ ubicacion(ev).car.nombre }} · {{ ubicacion(ev).ambiente.nombre }}</td>
                <td><button type="button" class="sg-row-btn" @click="eventoId = ev.id">{{ ev.titulo }}</button><div class="sg-muted">{{ ev.bienIds.join(', ') }}</div></td>
                <td><status-chip v-bind="estadoNecesidad(ev)" /></td>
              </tr>
              <tr v-if="!eventos.length"><td colspan="5" class="sg-muted">Sin hechos para los filtros seleccionados.</td></tr>
            </tbody>
          </table>
        </div>
      </section-card>

      <section-card v-if="evento" :titulo="`${TIPOS_EVENTO[evento.tipo].label} · ${evento.titulo}`" :subtitulo="`${fecha(evento.fecha)} · ${ubicacion(evento).car.nombre} › ${ubicacion(evento).ambiente.nombre} · informado por ${evento.informadoPor}`">
        <p v-if="evento.detalle">{{ evento.detalle }}</p>

        <div v-if="evento.tipo === 'reposicion'" class="sg-grid-2">
          <div v-for="(b, idx) in [bienPorId(evento.bienAnteriorId), bienPorId(evento.bienNuevoId)]" :key="b.id" class="sg-box">
            <div class="sg-chips">
              <status-chip v-bind="SITUACIONES[b.situacion]" />
              <status-chip :tono="idx === 0 ? 'ne' : 'in'" :label="idx === 0 ? 'Bien anterior' : 'Reposición'" />
            </div>
            <router-link :to="{ name: 'bienes', query: { bien: b.id } }" class="text-weight-bold">{{ b.nombre }} · {{ b.id }}</router-link>
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
                  <td><router-link :to="{ name: 'bienes', query: { bien: b.id } }">{{ b.nombre }} · {{ b.id }}</router-link></td>
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
              <div v-for="h in asociados" :key="h.id" class="sg-box" :class="{ 'sg-box--dashed': h.revisionPendiente }">
                <div class="sg-chips">
                  <status-chip v-bind="condicion(h.condicion)" />
                  <status-chip v-bind="SITUACIONES[h.situacion]" />
                  <status-chip v-if="h.revisionPendiente" tono="wa" label="Situación por revisar" />
                </div>
                <router-link :to="{ name: 'bienes', query: { bien: h.id } }" class="text-weight-bold">{{ h.nombre }} · {{ h.id }}</router-link>
                <span class="sg-muted">Antes en: {{ evento.bienIds[0] }} ({{ h.asociadoA.posicion }})</span>
              </div>
            </div>
          </template>
        </template>
      </section-card>
    </div>
  </q-page>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { db, bienPorId, bienesDeAmbiente, ubicacionDeAmbiente } from 'src/services/datos'
import { antecedentesDeBien } from 'src/services/bienes'
import { calcularNecesidades } from 'src/services/necesidades'
import { reposicionDe } from 'src/services/acciones'
import { INCIDENTES, SITUACIONES, TIPOS_EVENTO, condicion } from 'src/config/catalogos'
import { ANIO_REVISION } from 'src/config/demo'
import { fecha, plural, soles } from 'src/utils/formato'

const CLASES = { renovacion: 'Renovación', reposicion: 'Reposición' }
const TIPOS_HISTORIAL = ['dano', 'robo', 'incendio', 'baja', 'reposicion']

const { carsEnAmbito, enAmbitoCar, carIdsEnAmbito, puedeAcceder } = usePerfil()

// 'todos' en lugar de null: QSelect no muestra la etiqueta de una opción con valor null.
const TODOS = 'todos'
const opcionesCar = computed(() => [{ label: 'Todos los CAR del ámbito', value: TODOS }, ...carsEnAmbito.value.map((c) => ({ label: c.nombre, value: c.id }))])
const opcionesTipo = [{ label: 'Todos', value: TODOS }, ...TIPOS_HISTORIAL.map((t) => ({ label: TIPOS_EVENTO[t].label, value: t }))]
const opcionesAnio = [{ label: 'Todos los períodos', value: TODOS }, { label: '2026', value: '2026' }, { label: '2025', value: '2025' }]

const filtros = reactive({ carId: TODOS, texto: '', tipo: TODOS, anio: TODOS })

const ubicacion = (ev) => ubicacionDeAmbiente(ev.ambienteId)

const eventos = computed(() => {
  const t = (filtros.texto ?? '').toLowerCase()
  return db.eventos
    .filter((ev) => TIPOS_HISTORIAL.includes(ev.tipo))
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

const evento = computed(() => db.eventos.find((e) => e.id === eventoId.value) ?? null)
const esIncidente = computed(() => INCIDENTES.includes(evento.value?.tipo))
const afectados = computed(() => (evento.value ? evento.value.bienIds.map(bienPorId).filter(Boolean) : []))
const noAfectados = computed(() =>
  evento.value ? bienesDeAmbiente(evento.value.ambienteId).filter((b) => !evento.value.bienIds.includes(b.id) && b.situacion === 'activo') : []
)
const asociados = computed(() => (evento.value ? db.bienes.filter((b) => b.asociadoA?.bienId === evento.value.bienIds[0]) : []))

const pendientes = computed(() => calcularNecesidades({ anio: ANIO_REVISION, carIds: carIdsEnAmbito.value }).pendientes)
const necesidadDe = (bienId) => pendientes.value.find((n) => n.id === bienId) ?? null

function estadoNecesidad (ev) {
  if (ev.tipo === 'reposicion') return { tono: 'ok', label: 'Atendida' }
  if (ev.bienIds.some((id) => reposicionDe(id))) return { tono: 'ok', label: 'Atendida' }
  if (!ev.reportaNecesidad) return { tono: 'si', label: 'No reportada' }
  const abiertas = ev.bienIds.filter((id) => necesidadDe(id)).length
  return abiertas ? { tono: 'da', label: plural(abiertas, 'pendiente', 'pendientes') } : { tono: 'ne', label: 'Sin necesidad abierta' }
}
</script>
