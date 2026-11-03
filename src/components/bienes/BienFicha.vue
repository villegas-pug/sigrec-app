<template>
  <div class="column q-gutter-y-md">
    <section-card :titulo="`${bien.nombre} · ${bien.id}`" :subtitulo="textoUbicacion(ubicacion) + cadenaAsociacion">
      <template #acciones>
        <q-btn v-if="activo && puedeHacer('bien.actualizar')" outline color="secondary" icon="edit" label="Actualizar información" @click="$emit('accion', 'datos')" />
        <q-btn v-if="!anulado && puedeHacer('bien.verificar')" outline color="secondary" icon="fact_check" label="Informar verificación" @click="$emit('accion', 'verificacion')" />
        <q-btn v-if="activo && puedeHacer('bien.incidente')" outline color="secondary" icon="report" label="Registrar incidente" @click="$emit('accion', 'incidente')" />
        <q-btn v-if="activo && puedeHacer('bien.baja')" outline color="negative" icon="remove_circle" label="Dar de baja" @click="$emit('accion', 'baja')" />
        <q-btn v-if="!activo && !anulado && !reposicion && puedeHacer('bien.reposicion')" unelevated color="primary" icon="swap_horiz" label="Registrar reposición" @click="$emit('accion', 'reposicion')" />
        <menu-acciones :items="accionesMenu" :etiqueta="`Más acciones de ${bien.nombre}`" />
      </template>

      <note-banner v-if="anulado" tono="ne" icono="block" class="q-mb-md">
        Registro anulado el {{ fecha(bien.anulacion.fecha) }} por {{ bien.anulacion.por }}. Motivo: {{ bien.anulacion.motivo }}
        No cuenta en las necesidades ni en los avisos.
      </note-banner>

      <div class="sg-chips q-mb-md">
        <status-chip tono="ne" :label="CATEGORIAS[bien.categoria]" />
        <status-chip v-bind="condicionBien" :label="`Condición: ${condicionBien.label}`" />
        <status-chip v-bind="SITUACIONES[bien.situacion]" />
        <status-chip v-if="bien.verificacion" :tono="bien.verificacion.resultado === 'coincide' ? 'ok' : 'wa'" :label="`Verificado el ${fecha(bien.verificacion.fecha)}`" />
        <status-chip v-else tono="si" label="Pendiente de verificación" />
        <status-chip v-if="bien.revisionPendiente" tono="wa" label="Situación por revisar" />
      </div>

      <div class="sg-kv-grid">
        <key-value etiqueta="Rótulo SIGREC">{{ bien.id }}</key-value>
        <key-value etiqueta="Código patrimonial" :nota="bien.codigoPatrimonial ? '' : 'Sin código patrimonial'">{{ bien.codigoPatrimonial ?? 'No aplica' }}</key-value>
        <key-value v-if="(bien.cantidad ?? 1) > 1" etiqueta="Cantidad">{{ bien.cantidad }} unidades</key-value>
        <key-value etiqueta="Descripción">{{ bien.descripcion || '—' }}</key-value>
        <key-value v-if="bien.marcaModelo" etiqueta="Marca y modelo" :nota="bien.serie ? `Serie ${bien.serie}` : ''">{{ bien.marcaModelo }}</key-value>
        <key-value etiqueta="Deterioro observado">{{ bien.deterioro || 'Sin deterioro informado' }}</key-value>
        <key-value etiqueta="Fecha de adquisición">
          <template v-if="bien.adquisicion?.fecha">{{ fecha(bien.adquisicion.fecha) }}</template>
          <status-chip v-else tono="si" label="No informada" />
        </key-value>
        <key-value etiqueta="Costo de adquisición" nota="Costo original; no se usa para estimar la reposición">
          <template v-if="bien.adquisicion?.costo != null">{{ soles(bien.adquisicion.costo) }}</template>
          <status-chip v-else tono="si" label="No informado" />
        </key-value>
        <key-value etiqueta="Vida útil" nota="Valor de demostración, no es tabla oficial">
          <template v-if="bien.vidaUtilAnios != null">
            {{ plural(bien.vidaUtilAnios, 'año', 'años') }}<template v-if="fin"> · se cumple en {{ fin }}</template>
          </template>
          <status-chip v-else tono="si" label="Pendiente de definir" />
        </key-value>
        <key-value etiqueta="Precio referencial" :nota="tipo?.procedencia ? `${tipo.nombre} · ${tipo.procedencia}` : tipo?.nombre">
          <template v-if="tipo?.precio != null">{{ soles(tipo.precio) }}</template>
          <status-chip v-else tono="wa" label="Sin precio referencial" />
        </key-value>
      </div>

      <note-banner v-if="faltantes.length" tono="ne" icono="help" class="q-mt-md">
        Antecedentes insuficientes: falta {{ faltantes.join(' y ') }}. No se calcula una renovación por vida útil.
      </note-banner>
      <note-banner v-if="necesidad" tono="wa" icono="event_repeat" class="q-mt-md">
        <strong>Necesidad para revisión en {{ ANIO_REVISION }}:</strong> {{ necesidad.motivos.map((m) => m.texto).join(' · ') }}.
        No constituye autorización de baja ni de compra.
        <router-link v-if="puedeAcceder('necesidades')" :to="{ name: 'necesidades' }" class="text-weight-bold">Ver necesidades</router-link>
      </note-banner>
      <note-banner v-if="reposicion" tono="ok" icono="swap_horiz" class="q-mt-md">
        Repuesto por
        <button type="button" class="sg-row-btn" @click="$emit('seleccionar', reposicion.bienNuevoId)">{{ reposicion.bienNuevoId }}</button>
        el {{ fecha(reposicion.fecha) }}. La necesidad quedó atendida.
      </note-banner>
      <note-banner v-if="reemplazaA" tono="in" icono="swap_horiz" class="q-mt-md">
        Alta por reposición de
        <button type="button" class="sg-row-btn" @click="$emit('seleccionar', reemplazaA.bienAnteriorId)">{{ reemplazaA.bienAnteriorId }}</button>.
        Este bien tiene antecedentes y vida útil propios.
      </note-banner>
    </section-card>

    <section-card titulo="Componentes" subtitulo="Bienes asociados entre sí para localizar el objeto concreto, por ejemplo el colchón de una cama">
      <template v-if="activo && puedeHacer('bien.componente')" #acciones>
        <q-btn v-if="!bien.asociadoA" outline color="secondary" icon="link" label="Asociar a otro bien" @click="$emit('accion', 'componente')" />
        <q-btn v-else outline color="secondary" icon="link_off" label="Quitar asociación" @click="$emit('accion', 'desasociar')" />
        <q-btn
          v-if="puedeAcceder('registro') && puedeHacer('bien.registrar')"
          unelevated
          color="primary"
          icon="add"
          label="Registrar componente"
          :to="{ name: 'registro', query: { car: ubicacion.car.id, ambiente: bien.ambienteId, asociar: bien.id } }"
        />
      </template>
      <div class="sg-kv-grid">
        <div v-if="asociaciones.padre" class="sg-box">
          <span class="sg-kv__label">Forma parte de</span>
          <button type="button" class="sg-row-btn" @click="$emit('seleccionar', asociaciones.padre.id)">{{ asociaciones.padre.nombre }} {{ asociaciones.padre.id }}</button>
          <span class="sg-muted">Posición: {{ bien.asociadoA.posicion }} · {{ SITUACIONES[asociaciones.padre.situacion].label }}</span>
        </div>
        <div v-for="h in asociaciones.hermanos" :key="h.id" class="sg-box">
          <span class="sg-kv__label">Componente del mismo bien</span>
          <button type="button" class="sg-row-btn" @click="$emit('seleccionar', h.id)">{{ h.nombre }} {{ h.id }}</button>
          <span class="sg-muted">{{ h.asociadoA.posicion }} · {{ condicion(h.condicion).label }} · {{ SITUACIONES[h.situacion].label }}</span>
        </div>
        <div v-for="h in asociaciones.hijos" :key="h.id" class="sg-box" :class="{ 'sg-box--dashed': h.revisionPendiente }">
          <span class="sg-kv__label">Componente</span>
          <button type="button" class="sg-row-btn" @click="$emit('seleccionar', h.id)">{{ h.nombre }} {{ h.id }}</button>
          <span class="sg-muted">{{ h.asociadoA.posicion }} · {{ condicion(h.condicion).label }} · {{ SITUACIONES[h.situacion].label }}</span>
          <status-chip v-if="h.revisionPendiente" tono="wa" label="Situación por revisar" />
        </div>
      </div>
      <p v-if="!asociaciones.padre && !asociaciones.hijos.length" class="sg-muted q-mb-none">Sin componentes ni asociaciones registradas.</p>
      <div v-if="bien.revisionPendiente" class="row q-gutter-sm q-mt-md">
        <span class="self-center">El bien del que forma parte fue dado de baja. Revise su situación:</span>
        <template v-if="puedeHacer('bien.baja')">
          <q-btn outline color="secondary" label="Mantener activo" @click="$emit('mantener')" />
          <q-btn outline color="negative" label="Dar de baja" @click="$emit('accion', 'baja')" />
        </template>
      </div>
    </section-card>

    <galeria-fotos :bien="bien" titulo="Fotografías del bien" />

    <section-card titulo="Antecedentes">
      <historial-bien :bien="bien" />
    </section-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePerfil } from 'src/composables/usePerfil'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import KeyValue from 'components/common/KeyValue.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import MenuAcciones from 'components/common/MenuAcciones.vue'
import HistorialBien from 'components/bienes/HistorialBien.vue'
import GaleriaFotos from 'components/centros/GaleriaFotos.vue'
import { db, bienPorId, tipoPorId, textoUbicacion, ubicacionDeBien } from 'src/services/datos'
import { asociacionesDeBien } from 'src/services/bienes'
import { antecedentesFaltantes, calcularNecesidades, finVidaUtil } from 'src/services/necesidades'
import { reposicionDe } from 'src/services/acciones'
import { CATEGORIAS, SITUACIONES, condicion } from 'src/config/catalogos'
import { ANIO_REVISION } from 'src/config/demo'
import { fecha, plural, soles } from 'src/utils/formato'

const props = defineProps({
  bien: { type: Object, required: true }
})

const emit = defineEmits(['accion', 'seleccionar', 'mantener'])

const { puedeAcceder, puedeHacer } = usePerfil()

const ubicacion = computed(() => ubicacionDeBien(props.bien))
const tipo = computed(() => tipoPorId(props.bien.tipoId))
const activo = computed(() => props.bien.situacion === 'activo')
const anulado = computed(() => props.bien.situacion === 'anulado')
const condicionBien = computed(() => condicion(props.bien.condicion))
const fin = computed(() => finVidaUtil(props.bien))
const faltantes = computed(() => antecedentesFaltantes(props.bien))
const asociaciones = computed(() => asociacionesDeBien(props.bien))
const reposicion = computed(() => reposicionDe(props.bien.id))
const reemplazaA = computed(() => db.eventos.find((e) => !e.anulacion && e.tipo === 'reposicion' && e.bienNuevoId === props.bien.id) ?? null)

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
  { label: 'Trasladar a otro ambiente', icono: 'moving', visible: activo.value && puedeHacer('bien.trasladar'), accion: () => emit('accion', 'trasladar') },
  { label: 'Anular registro', icono: 'block', peligro: true, visible: !anulado.value && puedeHacer('bien.anular'), accion: () => emit('accion', 'anular') },
  { label: 'Reactivar registro', icono: 'restore', visible: anulado.value && puedeHacer('bien.anular'), accion: () => emit('accion', 'reactivar') }
])
</script>
