<template>
      <section-card v-if="evento" :titulo="`${TIPOS_EVENTO[evento.tipo].label} · ${evento.titulo}`" :subtitulo="`${fecha(evento.fecha)} · ${ubicacion(evento).nombre} · informado por ${evento.informadoPor}`">
        <template #acciones><slot name="acciones" /></template>
        <note-banner v-if="evento.anulacion" tono="ne" icono="block" class="q-mb-md">
          Hecho anulado el {{ fecha(evento.anulacion.fecha) }} por {{ evento.anulacion.por }}. Motivo: {{ evento.anulacion.motivo }}
          No genera necesidades.
        </note-banner>
        <p v-if="evento.requiereEvaluacion" class="sg-muted">Infraestructura: {{ evento.atendida ? 'Atendida' : 'Requiere evaluación, sin costo estimado' }}</p>
        <p v-if="evento.detalle">{{ evento.detalle }}</p>
        <router-link v-if="esIncidente && puedeAcceder('centros')" :to="{ name: 'centros', query: { hecho: evento.id } }">Ver hecho en su origen</router-link>
        <p v-if="evento.registradoEl && evento.registradoEl !== evento.fecha" class="sg-muted">Registrado el {{ fecha(evento.registradoEl) }}.</p>

        <div v-if="evento.tipo === 'reposicion'" class="sg-grid-2">
          <div v-for="(b, idx) in [bienPorId(evento.bienAnteriorId), bienPorId(evento.bienNuevoId)]" :key="b.id" class="sg-box">
            <div class="sg-chips">
              <status-chip v-bind="SITUACIONES[b.situacion]" />
              <status-chip :tono="idx === 0 ? 'ne' : 'in'" :label="idx === 0 ? 'Bien anterior' : 'Reposición'" />
            </div>
            <router-link v-if="puedeAcceder('centros')" :to="enlaceBien(b)" class="text-weight-bold">{{ b.nombre }} · {{ b.id }}</router-link>
            <span v-else class="text-weight-bold">{{ b.nombre }} · {{ b.id }}</span>
            <span class="sg-muted">{{ textoUbicacion(ubicacionDeBien(b)) }}</span>
            <span class="sg-muted">Adquisición {{ fecha(b.adquisicion?.fecha) }} · vida útil {{ b.vidaUtilAnios != null ? plural(b.vidaUtilAnios, 'año', 'años') : '—' }}</span>
            <q-expansion-item dense label="Historial del bien" header-class="q-px-none">
              <historial-bien :bien="b" :tipos-seleccionables="TIPOS_HISTORIAL" @seleccionar="irAHecho" />
            </q-expansion-item>
          </div>
        </div>

        <template v-else>
          <h3 class="sg-kv__label q-mt-none">Recursos afectados</h3>
          <p v-if="!afectados.length" class="sg-muted">Hecho propio de {{ origenIncidencia(evento).tipo }} sin bienes afectados.</p>
          <div class="sg-table-wrap">
            <table class="sg-table">
              <thead>
                <tr><th scope="col">Bien</th><th scope="col">Condición actual</th><th scope="col">Situación</th><th scope="col">Necesidad</th><th v-if="esIncidente" scope="col">Siguiente paso</th></tr>
              </thead>
              <tbody>
                <tr v-for="b in afectados" :key="b.id">
                  <td>
                    <router-link v-if="puedeAcceder('centros')" :to="enlaceBien(b)">{{ b.nombre }} · {{ b.id }}</router-link>
                    <template v-else>{{ b.nombre }} · {{ b.id }}</template>
                    <div class="sg-muted">{{ textoUbicacion(ubicacionDeBien(b)) }}</div>
                    <div v-if="evento.unidades && afectados.length === 1" class="sg-muted">{{ evento.unidades }} de {{ b.cantidad }} unidades afectadas</div>
                  </td>
                  <td><status-chip v-bind="condicion(b.condicion)" /><div class="sg-muted">{{ unidadesAfectadas(evento, b) }} unidades afectadas · {{ requiereReposicion(evento, b.id) ? 'Requiere reposición' : 'No requiere reposición por este hecho' }}</div></td>
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
                    <span v-if="pasoDe(evento, b.id)">{{ pasoDe(evento, b.id).label }}</span>
                    <span v-else class="sg-muted">Ninguno</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <q-expansion-item v-for="b in afectados" :key="`h-${b.id}`" dense :default-opened="afectados.length === 1" :label="`Historial de ${b.nombre} · ${b.id}`" header-class="q-px-none">
            <historial-bien :bien="b" :tipos-seleccionables="TIPOS_HISTORIAL" @seleccionar="irAHecho">
              <template #extra="{ item }">
                <status-chip v-if="esHechoIncidente(item)" class="q-ml-xs" :tono="estadoDeBien(item, b.id).tono" :label="estadoDeBien(item, b.id).label" />
              </template>
            </historial-bien>
          </q-expansion-item>

          <div v-if="esIncidente && evento.ambienteId" class="sg-box sg-box--dashed q-mt-md">
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
</template>
<script setup>
import { computed } from 'vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import HistorialBien from './HistorialBien.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { db, bienPorId, bienesDeAmbiente, textoUbicacion, ubicacionDeAmbiente, ubicacionDeBien } from 'src/services/datos'
import { calcularNecesidades } from 'src/services/necesidades'
import { siguientePaso } from 'src/services/bienes'
import { esIncidencia as esHechoIncidente, TIPOS_HECHO, estadoDeBien as estadoBien, ubicacionHecho, origenIncidencia, requiereReposicion, unidadesAfectadas } from 'src/services/incidencias'
import { CHIP_ANULADO, SITUACIONES, TIPOS_EVENTO, condicion } from 'src/config/catalogos'
import { ANIO_REVISION } from 'src/config/demo'
import { fecha, plural, soles } from 'src/utils/formato'
const props = defineProps({ evento: { type: Object, required: true } })
const emit = defineEmits(['seleccionar'])
const evento = computed(() => props.evento)
const { puedeAcceder, carIdsEnAmbito } = usePerfil()
const pendientes = computed(() => calcularNecesidades({ anio: ANIO_REVISION, carIds: carIdsEnAmbito.value }).pendientes)
const necesidadDe = (id) => pendientes.value.find((n) => n.id === id)
const estadoDeBien = (ev, id) => estadoBien(ev, id, pendientes.value)
const pasoDe = (ev, id) => estadoDeBien(ev, id).clave === 'pendiente' ? siguientePaso(bienPorId(id)) : null
const esIncidente = computed(() => esHechoIncidente(evento.value))
const ubicacion = ubicacionHecho
const irAHecho = (id) => emit('seleccionar', id)
const enlaceBien = (b) => ({ name: 'centros', query: { bien: b.id, ...(evento.value.bienIds.includes(b.id) ? { hecho: evento.value.id, tab: 'antecedentes' } : {}) } })
const CLASES = { renovacion: 'Renovación', reposicion: 'Reposición' }
const TIPOS_HISTORIAL = TIPOS_HECHO
const afectados = computed(() => (evento.value ? evento.value.bienIds.map(bienPorId).filter(Boolean) : []))
const noAfectados = computed(() =>
  evento.value?.ambienteId ? bienesDeAmbiente(evento.value.ambienteId).filter((b) => !evento.value.bienIds.includes(b.id) && b.situacion === 'activo') : []
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

</script>
