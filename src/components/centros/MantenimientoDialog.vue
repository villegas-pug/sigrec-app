<template>
  <form-dialog
    :model-value="modelValue"
    :icono-enviar="mantenimiento ? 'save' : 'add'"
    :titulo="mantenimiento ? 'Actualizar mantenimiento' : 'Registrar mantenimiento'"
    :subtitulo="centro.nombre"
    :ancho="580"
    :etiqueta-enviar="mantenimiento ? 'Guardar cambios' : 'Registrar'"
    :modificado="modificado"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <q-select v-model="form.tipo" :options="OPCIONES_TIPO_MANTENIMIENTO" emit-value map-options outlined dense label="Tipo *" :disable="!!mantenimiento || !!tipoInicial" :rules="[requerido]">
      <template #prepend><q-icon :name="tipoActual?.icono ?? 'build'" aria-hidden="true" /></template>
      <template #append><boton-dictado v-model="form.tipo" tipo="opcion" :opciones="OPCIONES_TIPO_MANTENIMIENTO" emit-value :disable="!!mantenimiento || !!tipoInicial" /></template>
    </q-select>

    <note-banner v-if="!mantenimiento && tipoActual && tipoActual.objetivo !== 'centro' && !opcionesObjetivo.length" tono="wa" icono="warning">
      El centro no tiene {{ textoSinObjetivo }}. Regístrelo primero para poder registrar su mantenimiento.
    </note-banner>
    <!-- Al registrar se pueden elegir varios objetivos (p. ej. todos los extintores recargados el mismo día): un registro por objetivo. -->
    <q-select
      v-if="tipoActual && tipoActual.objetivo !== 'centro'"
      v-model="form.objetivos"
      :options="opcionesObjetivo"
      emit-value
      map-options
      multiple
      use-chips
      outlined
      dense
      :label="`${etiquetaObjetivo} *`"
      :hint="mantenimiento ? '' : 'Puede elegir varios: se registra un mantenimiento por cada uno, con los mismos datos'"
      :disable="!!mantenimiento"
      :rules="[(v) => (v && v.length > 0) || 'Elija al menos uno']"
    >
      <template #after>
        <q-btn v-if="!mantenimiento && opcionesObjetivo.length > 1 && form.objetivos.length < opcionesObjetivo.length" flat dense no-caps color="secondary" icon="done_all" label="Todos" @click="form.objetivos = opcionesObjetivo.map((o) => o.value)" />
      </template>
    </q-select>
    <q-checkbox
      v-if="vehiculoConAtencion && puedeHacer('vehiculo.actualizar')"
      v-model="form.quedaOperativo"
      :label="`El vehículo ${vehiculoConAtencion.id} queda operativo (hoy: ${estadoVehiculo(vehiculoConAtencion.estadoOperativo).label.toLowerCase()})`"
    />

    <div class="row q-col-gutter-md">
      <q-input v-model="form.fecha" class="col-12 col-sm-6" outlined dense type="date" stack-label label="Fecha realizada *" :hint="HINT_FECHA_CORTE" :rules="[requerido, noFutura]">
        <template #append><boton-dictado v-model="form.fecha" tipo="fecha" /></template>
      </q-input>
      <q-input
        v-model="form.proxima"
        class="col-12 col-sm-6"
        outlined
        dense
        type="date"
        stack-label
        label="Próxima fecha"
        :hint="sugerida ? `Sugerida: ${fecha(sugerida)} (cada ${tipoActual.meses} meses, por validar)` : 'Vacío si no se programó: quedará «sin programar»'"
        :rules="[noAnteriorA(() => form.fecha, 'No puede ser anterior a la fecha realizada')]"
      >
        <template #append>
          <q-btn v-if="sugerida && form.proxima !== sugerida" flat round dense icon="event_repeat" color="secondary" aria-label="Usar la fecha sugerida" title="Usar la fecha sugerida" @click="form.proxima = sugerida" />
          <boton-dictado v-model="form.proxima" tipo="fecha" />
        </template>
      </q-input>
    </div>
    <q-input v-model="form.detalle" outlined dense type="textarea" autogrow label="Detalle" hint="Qué se hizo, quién lo ejecutó, observaciones">
      <template #append><boton-dictado v-model="form.detalle" /></template>
    </q-input>
    <q-input v-model.number="form.importe" outlined dense type="number" min="0" step="0.01" label="Importe (S/)" hint="Opcional: costo del servicio si se conoce" :rules="[opcionalMayorQueCero]">
      <template #append><boton-dictado v-model="form.importe" tipo="numero" /></template>
    </q-input>
  </form-dialog>
</template>

<script setup>
// Registro de un mantenimiento o control preventivo (SPEC 010 §7). El tipo decide el objetivo: el centro (fumigación),
// un extintor, un equipo o un vehículo. Al corregir no se cambian el tipo ni el objetivo.
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import { useBorrador } from 'src/composables/useBorrador'
import { usePerfil } from 'src/composables/usePerfil'
import { ambientePorId, db, etiquetaAmbiente, vehiculoPorId, vigentes } from 'src/services/datos'
import { actualizarMantenimiento, actualizarVehiculo, registrarMantenimiento } from 'src/services/acciones'
import { requiereAtencion } from 'src/services/vehiculos'
import { extintoresDeCentro } from 'src/services/mantenimientos'
import { OPCIONES_TIPO_MANTENIMIENTO, TIPOS_MANTENIMIENTO, TIPO_EXTINTOR, estadoVehiculo } from 'src/config/catalogos'
import { FECHA_CORTE } from 'src/config/demo'
import { sumarMeses } from 'src/utils/fechas'
import { fecha } from 'src/utils/formato'
import { HINT_FECHA_CORTE, noAnteriorA, noFutura, opcionalMayorQueCero, requerido } from 'src/utils/validaciones'
import { plural } from 'src/utils/formato'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  centro: { type: Object, required: true },
  // null = mantenimiento nuevo.
  mantenimiento: { type: Object, default: null },
  // Tipo y objetivo precargados (p. ej. «Registrar recarga» desde un extintor). Con tipoInicial el tipo no se cambia.
  tipoInicial: { type: String, default: null },
  bienId: { type: String, default: null },
  vehiculoId: { type: String, default: null },
  // Varios bienes precargados (p. ej. «Registrar recarga de todos» los extintores del centro).
  bienIds: { type: Array, default: null }
})

const emit = defineEmits(['update:modelValue', 'hecho'])
const $q = useQuasar()
const { puedeHacer } = usePerfil()

const form = reactive({})
const { modificado, fijar } = useBorrador(form)

const tipoActual = computed(() => TIPOS_MANTENIMIENTO[form.tipo] ?? null)
const sugerida = computed(() => (tipoActual.value && form.fecha ? sumarMeses(form.fecha, tipoActual.value.meses) : null))

const rotuloBien = (b) => `${b.nombre} ${b.id}`
const bienesDelCentro = computed(() =>
  db.bienes.filter((b) => b.situacion === 'activo' && db.ambientes.some((a) => a.id === b.ambienteId && a.carId === props.centro.id))
)

const opcionesObjetivo = computed(() => {
  const objetivo = tipoActual.value?.objetivo
  const ambienteDe = (b) => { const a = ambientePorId(b.ambienteId); return a ? etiquetaAmbiente(a) : '' }
  const opcionBien = (b) => ({ value: b.id, label: `${rotuloBien(b)} · ${ambienteDe(b)}` })
  if (objetivo === 'extintor') return extintoresDeCentro(props.centro.id, FECHA_CORTE).lista.map((e) => opcionBien(e.bien))
  if (objetivo === 'equipo') return bienesDelCentro.value.filter((b) => b.categoria === 'equipo' && b.tipoId !== TIPO_EXTINTOR).map(opcionBien)
  if (objetivo === 'vehiculo') {
    return vigentes(db.vehiculos).filter((v) => v.carId === props.centro.id).map((v) => ({ value: v.id, label: `${v.tipo} ${v.id} · placa ${v.placa}` }))
  }
  return []
})

const ETIQUETAS_OBJETIVO = { extintor: 'Extintor', equipo: 'Equipo', vehiculo: 'Vehículo' }
const TEXTOS_SIN_OBJETIVO = { extintor: 'extintores activos', equipo: 'equipos activos', vehiculo: 'vehículos vigentes' }
const etiquetaObjetivo = computed(() => ETIQUETAS_OBJETIVO[tipoActual.value?.objetivo] ?? '')
const textoSinObjetivo = computed(() => TEXTOS_SIN_OBJETIVO[tipoActual.value?.objetivo] ?? '')

// Al cambiar el tipo, los objetivos que ya no corresponden se descartan.
watch(() => form.tipo, () => {
  if (props.mantenimiento || !form.objetivos) return
  form.objetivos = form.objetivos.filter((id) => opcionesObjetivo.value.some((o) => o.value === id))
})

// Un único vehículo que requiere mantenimiento o está detenido: se ofrece dejarlo operativo al registrar (SPEC 011, Ola 2).
const vehiculoConAtencion = computed(() => {
  if (props.mantenimiento || tipoActual.value?.objetivo !== 'vehiculo' || form.objetivos?.length !== 1) return null
  const v = vehiculoPorId(form.objetivos[0])
  return v && requiereAtencion(v) ? v : null
})

// `immediate`: la página de vehículos monta este diálogo al elegir el vehículo, ya abierto.
watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  const m = props.mantenimiento
  Object.assign(form, {
    tipo: m?.tipo ?? props.tipoInicial ?? null,
    objetivos: m ? [m.bienId ?? m.vehiculoId].filter(Boolean) : props.bienIds?.length ? [...props.bienIds] : [props.bienId ?? props.vehiculoId].filter(Boolean),
    quedaOperativo: false,
    fecha: m?.fecha ?? FECHA_CORTE,
    proxima: m?.proxima ?? '',
    detalle: m?.detalle ?? '',
    importe: m?.importe ?? null
  })
  fijar()
}, { immediate: true })

function guardar () {
  const datos = { fecha: form.fecha, proxima: form.proxima || null, detalle: form.detalle?.trim() || null, importe: form.importe }
  if (props.mantenimiento) {
    actualizarMantenimiento(props.mantenimiento, datos)
    $q.notify({ type: 'positive', message: 'Mantenimiento actualizado.' })
    emit('update:modelValue', false)
    emit('hecho', props.mantenimiento.id)
    return
  }
  const objetivo = tipoActual.value.objetivo
  const registrar = (objetivoId) => registrarMantenimiento({
    tipo: form.tipo,
    carId: props.centro.id,
    bienId: objetivo === 'extintor' || objetivo === 'equipo' ? objetivoId : null,
    vehiculoId: objetivo === 'vehiculo' ? objetivoId : null,
    ...datos
  }).id
  const ids = objetivo === 'centro' ? [registrar(null)] : form.objetivos.map(registrar)
  let mensaje = ids.length > 1 ? `${plural(ids.length, 'mantenimiento registrado', 'mantenimientos registrados')}: ${tipoActual.value.label}.` : `Mantenimiento registrado: ${tipoActual.value.label}.`
  if (vehiculoConAtencion.value && form.quedaOperativo && puedeHacer('vehiculo.actualizar')) {
    actualizarVehiculo(vehiculoConAtencion.value, { estadoOperativo: 'operativo', mantenimiento: null })
    mensaje += ' El vehículo queda operativo.'
  }
  $q.notify({ type: 'positive', message: mensaje })
  emit('update:modelValue', false)
  emit('hecho', ids[0])
}
</script>
