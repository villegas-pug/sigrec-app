<template>
  <form-dialog
    :model-value="modelValue"
    :titulo="TITULOS[modo]"
    :subtitulo="`${bien.nombre} · ${bien.id}`"
    :ancho="600"
    :etiqueta-enviar="TITULOS[modo]"
    :color-enviar="modo === 'baja' ? 'negative' : 'primary'"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <template v-if="modo === 'verificacion'">
      <q-input v-model="form.fecha" outlined dense type="date" stack-label label="Fecha de la verificación *" :rules="[requerido, noFutura]" />
      <q-option-group v-model="form.resultado" :options="OPCIONES_RESULTADO" />
      <q-input v-model="form.nota" outlined dense type="textarea" autogrow label="Observación de la verificación" />
    </template>

    <template v-if="modo === 'baja'">
      <q-input v-model="form.fecha" outlined dense type="date" stack-label label="Fecha de la baja *" :rules="[requerido, noFutura]" />
      <q-input v-model="form.motivo" outlined dense label="Motivo de la baja *" :rules="[requerido]" />
      <q-input v-model="form.detalle" outlined dense type="textarea" autogrow label="Sustento o detalle" />
      <note-banner v-if="hijosActivos.length" tono="wa" icono="warning">
        La baja no se aplica a los bienes asociados. Quedarán marcados para revisar su situación uno por uno:
        {{ hijosActivos.map((h) => `${h.nombre} ${h.id}`).join(', ') }}.
      </note-banner>
    </template>

    <template v-if="modo === 'reposicion'">
      <q-input v-model="form.rotulo" outlined dense label="Rótulo SIGREC del bien nuevo *" :rules="[requerido, rotuloLibre]" />
      <q-input v-model="form.nombre" outlined dense label="Nombre *" :rules="[requerido]" />
      <q-input v-model="form.codigoPatrimonial" outlined dense label="Código patrimonial" />
      <div class="row q-col-gutter-md">
        <q-input v-model="form.fechaAdquisicion" class="col-12 col-sm-4" outlined dense type="month" stack-label label="Adquisición" :rules="[noFutura]" />
        <q-input v-model.number="form.costo" class="col-12 col-sm-4" outlined dense type="number" min="0" label="Costo (S/)" />
        <q-input v-model.number="form.vidaUtilAnios" class="col-12 col-sm-4" outlined dense type="number" min="1" label="Vida útil (años)" />
      </div>
      <q-checkbox
        v-if="hijosActivos.length"
        v-model="form.trasladarComponentes"
        :label="`Trasladar al bien nuevo sus ${hijosActivos.length} componente(s): ${hijosActivos.map((h) => h.id).join(', ')}`"
      />
    </template>
  </form-dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import { db, bienPorId, tipoPorId } from 'src/services/datos'
import { darDeBaja, informarVerificacion, registrarReposicion, rotuloSugerido } from 'src/services/acciones'
import { FECHA_CORTE } from 'src/config/demo'
import { noFutura, requerido } from 'src/utils/validaciones'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // verificacion | baja | reposicion (los incidentes se registran con IncidenteDialog).
  modo: { type: String, required: true },
  bien: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue', 'hecho'])
const $q = useQuasar()

const TITULOS = {
  verificacion: 'Informar verificación',
  baja: 'Dar de baja',
  reposicion: 'Registrar reposición'
}
const OPCIONES_RESULTADO = [
  { label: 'Coincide con lo informado', value: 'coincide' },
  { label: 'Se encontraron diferencias', value: 'diferencias' }
]

const rotuloLibre = (v) => !bienPorId(v) || 'Ya existe un bien con ese rótulo'

const form = reactive({})

const hijosActivos = computed(() => db.bienes.filter((b) => b.asociadoA?.bienId === props.bien.id && b.situacion === 'activo'))

function reiniciar () {
  Object.keys(form).forEach((k) => delete form[k])
  Object.assign(form, {
    fecha: FECHA_CORTE,
    resultado: 'coincide',
    nota: '',
    motivo: '',
    detalle: '',
    rotulo: rotuloSugerido(props.bien.ambienteId, props.bien.tipoId),
    nombre: props.bien.nombre,
    codigoPatrimonial: '',
    fechaAdquisicion: FECHA_CORTE.slice(0, 7),
    costo: null,
    vidaUtilAnios: props.bien.vidaUtilAnios ?? tipoPorId(props.bien.tipoId)?.vidaUtilSugerida ?? null,
    trasladarComponentes: false
  })
}

watch(() => props.modelValue, (abierto) => {
  if (abierto) reiniciar()
})

function guardar () {
  let mensaje = ''
  let nuevoId = null
  if (props.modo === 'verificacion') {
    informarVerificacion(props.bien, form)
    mensaje = 'Verificación registrada.'
  } else if (props.modo === 'baja') {
    darDeBaja(props.bien, form)
    mensaje = hijosActivos.value.length ? 'Baja registrada. Revise los bienes asociados.' : 'Baja registrada.'
  } else if (props.modo === 'reposicion') {
    nuevoId = registrarReposicion(props.bien, form).id
    mensaje = `Reposición registrada: ${nuevoId}.`
  }
  $q.notify({ type: 'positive', message: mensaje })
  emit('update:modelValue', false)
  emit('hecho', nuevoId)
}
</script>
