<template>
  <form-dialog
    :model-value="modelValue"
    :titulo="TITULOS[modo]"
    :subtitulo="`${vehiculo.id} · ${vehiculo.chofer ?? 'chofer no asignado'}`"
    :ancho="900"
    :modificado="modificado"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <template v-if="modo !== 'ejecucion'">
      <div class="row q-col-gutter-md">
        <q-input v-model="form.fecha" class="col-12 col-sm-4" outlined dense type="date" stack-label label="Fecha *" :rules="[requerido, fechaCoherente]" />
        <q-input v-model="form.proposito" class="col-12 col-sm-8" outlined dense label="Propósito *" :rules="[requerido]" />
      </div>
      <q-option-group v-model="form.modoRuta" inline :options="[{ label: 'Ingreso manual', value: 'manual' }, { label: 'Definir en mapa', value: 'mapa' }]" />
      <mapa-itinerario v-if="form.modoRuta === 'mapa'" v-model="form.ruta" />
      <q-input v-if="form.modoRuta === 'manual'" v-model="form.destinos" outlined dense label="Destinos, separados por comas *" hint="Ej.: CAR, Centro de salud, CAR" :rules="[requerido]" />
      <div class="sg-kv__label">Previsto</div>
      <div class="row q-col-gutter-md">
        <q-input v-model="form.previsto.salida" class="col-6 col-sm-4" outlined dense type="time" stack-label label="Salida" />
        <q-input v-model="form.previsto.llegada" class="col-6 col-sm-4" outlined dense type="time" stack-label label="Llegada" :rules="[llegadaPosterior(() => form.previsto.salida)]" />
        <q-input v-model.number="form.previsto.km" class="col-12 col-sm-4" outlined dense type="number" min="0" label="Distancia (km)" :readonly="form.modoRuta === 'mapa'" />
      </div>
      <q-checkbox v-model="form.conRealizado" label="El recorrido ya se realizó" />
    </template>
    <template v-if="modo === 'ejecucion' || form.conRealizado">
      <div class="sg-kv__label">Realizado</div>
      <div class="row q-col-gutter-md">
        <q-input v-model="form.realizado.salida" class="col-6 col-sm-4" outlined dense type="time" stack-label label="Salida" />
        <q-input v-model="form.realizado.llegada" class="col-6 col-sm-4" outlined dense type="time" stack-label label="Llegada" :rules="[llegadaPosterior(() => form.realizado.salida)]" />
        <q-input v-model.number="form.realizado.km" class="col-12 col-sm-4" outlined dense type="number" min="0" label="Distancia (km)" hint="Vacío si no se conoce" />
      </div>
      <q-checkbox v-if="sugerenciaEjecucion" v-model="form.confirmaKm" label="Confirmo o he corregido la distancia realizada" />
    </template>
  </form-dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import MapaItinerario from 'components/movilidad/MapaItinerario.vue'
import { useBorrador } from 'src/composables/useBorrador'
import { actualizarItinerario, informarEjecucion, numeroONulo, registrarItinerario } from 'src/services/acciones'
import { FECHA_CORTE } from 'src/config/demo'
import { llegadaPosterior, noFutura, requerido } from 'src/utils/validaciones'

const TITULOS = { nuevo: 'Registrar itinerario', editar: 'Actualizar itinerario', ejecucion: 'Informar ejecución' }

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  vehiculo: { type: Object, required: true },
  // nuevo | editar | ejecucion (solo lo realizado de un itinerario existente).
  modo: { type: String, default: 'nuevo' },
  itinerario: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'hecho'])
const $q = useQuasar()

const tramoVacio = () => ({ salida: '', llegada: '', km: null })
const form = reactive({ fecha: FECHA_CORTE, proposito: '', destinos: '', modoRuta: 'manual', ruta: null, previsto: tramoVacio(), conRealizado: false, realizado: tramoVacio(), confirmaKm: false })
const { modificado, fijar } = useBorrador(form)
const sugerenciaEjecucion = computed(() => props.modo === 'ejecucion' && props.itinerario?.ruta?.distanciaM != null)
watch(() => form.ruta, (ruta) => { if (form.modoRuta === 'mapa') form.previsto.km = ruta ? Number((ruta.distanciaM / 1000).toFixed(2)) : null })

// Un recorrido ya realizado no puede tener fecha posterior a la fecha de corte; uno previsto sí.
const fechaCoherente = (v) => (form.conRealizado ? noFutura(v) : true)

const copiarTramo = (t) => ({ salida: t?.salida ?? '', llegada: t?.llegada ?? '', km: t?.km ?? null })

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  const it = props.itinerario
  if (props.modo === 'ejecucion') {
    // Se propone el horario previsto; la distancia realizada se constata.
    Object.assign(form, { realizado: { ...copiarTramo(it?.previsto), km: it?.ruta?.distanciaM != null ? Number((it.ruta.distanciaM / 1000).toFixed(2)) : null }, confirmaKm: false })
    fijar()
    return
  }
  Object.assign(form, {
    fecha: it?.fecha ?? FECHA_CORTE,
    proposito: it?.proposito ?? '',
    destinos: it?.destinos?.join(', ') ?? '',
    modoRuta: it?.ruta ? 'mapa' : 'manual',
    ruta: it?.ruta ? structuredClone(it.ruta) : null,
    confirmaKm: false,
    previsto: copiarTramo(it?.previsto),
    conRealizado: !!it?.realizado,
    realizado: copiarTramo(it?.realizado)
  })
  fijar()
})

const tramo = (t) => ({ salida: t.salida || null, llegada: t.llegada || null, km: numeroONulo(t.km) })

function guardar () {
  if (props.modo !== 'ejecucion' && form.modoRuta === 'mapa' && !form.ruta) { $q.notify({ type: 'warning', message: 'Complete y calcule la ruta antes de guardar.' }); return }
  if (sugerenciaEjecucion.value && !form.confirmaKm) { $q.notify({ type: 'warning', message: 'Confirme o corrija la distancia realizada.' }); return }
  let id = props.itinerario?.id
  let mensaje
  if (props.modo === 'ejecucion') {
    informarEjecucion(props.itinerario, form.realizado)
    mensaje = 'Ejecución del recorrido registrada.'
  } else {
    const tienePrevisto = form.previsto.salida || form.previsto.llegada || Number.isFinite(form.previsto.km)
    const datos = {
      fecha: form.fecha,
      proposito: form.proposito,
      destinos: form.modoRuta === 'mapa' ? form.ruta.puntos.map(p => p.nombre) : form.destinos.split(',').map((d) => d.trim()).filter(Boolean),
      ruta: form.modoRuta === 'mapa' ? form.ruta : null,
      previsto: tienePrevisto ? tramo(form.previsto) : null,
      realizado: form.conRealizado ? tramo(form.realizado) : null
    }
    if (props.modo === 'editar') {
      actualizarItinerario(props.itinerario, datos)
      mensaje = `Itinerario ${id} actualizado.`
    } else {
      id = registrarItinerario({ vehiculoId: props.vehiculo.id, ...datos }).id
      mensaje = `Itinerario ${id} registrado.`
    }
  }
  $q.notify({ type: 'positive', message: mensaje })
  emit('update:modelValue', false)
  emit('hecho', id)
}
</script>
