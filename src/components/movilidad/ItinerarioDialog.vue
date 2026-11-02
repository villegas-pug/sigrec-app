<template>
  <form-dialog
    :model-value="modelValue"
    :titulo="TITULOS[modo]"
    :subtitulo="`${vehiculo.id} · ${vehiculo.chofer ?? 'chofer no asignado'}`"
    :ancho="600"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <template v-if="modo !== 'ejecucion'">
      <div class="row q-col-gutter-md">
        <q-input v-model="form.fecha" class="col-12 col-sm-4" outlined dense type="date" stack-label label="Fecha *" :rules="[requerido, fechaCoherente]" />
        <q-input v-model="form.proposito" class="col-12 col-sm-8" outlined dense label="Propósito *" :rules="[requerido]" />
      </div>
      <q-input v-model="form.destinos" outlined dense label="Destinos, separados por comas *" hint="Ej.: CAR, Centro de salud, CAR" :rules="[requerido]" />
      <div class="sg-kv__label">Previsto</div>
      <div class="row q-col-gutter-md">
        <q-input v-model="form.previsto.salida" class="col-6 col-sm-4" outlined dense type="time" stack-label label="Salida" />
        <q-input v-model="form.previsto.llegada" class="col-6 col-sm-4" outlined dense type="time" stack-label label="Llegada" :rules="[llegadaPosterior(() => form.previsto.salida)]" />
        <q-input v-model.number="form.previsto.km" class="col-12 col-sm-4" outlined dense type="number" min="0" label="Distancia (km)" />
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
    </template>
  </form-dialog>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
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
const form = reactive({ fecha: FECHA_CORTE, proposito: '', destinos: '', previsto: tramoVacio(), conRealizado: false, realizado: tramoVacio() })

// Un recorrido ya realizado no puede tener fecha posterior a la fecha de corte; uno previsto sí.
const fechaCoherente = (v) => (form.conRealizado ? noFutura(v) : true)

const copiarTramo = (t) => ({ salida: t?.salida ?? '', llegada: t?.llegada ?? '', km: t?.km ?? null })

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  const it = props.itinerario
  if (props.modo === 'ejecucion') {
    // Se propone el horario previsto; la distancia realizada se constata.
    Object.assign(form, { realizado: { ...copiarTramo(it?.previsto), km: null } })
    return
  }
  Object.assign(form, {
    fecha: it?.fecha ?? FECHA_CORTE,
    proposito: it?.proposito ?? '',
    destinos: it?.destinos?.join(', ') ?? '',
    previsto: copiarTramo(it?.previsto),
    conRealizado: !!it?.realizado,
    realizado: copiarTramo(it?.realizado)
  })
})

const tramo = (t) => ({ salida: t.salida || null, llegada: t.llegada || null, km: numeroONulo(t.km) })

function guardar () {
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
      destinos: form.destinos.split(',').map((d) => d.trim()).filter(Boolean),
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
