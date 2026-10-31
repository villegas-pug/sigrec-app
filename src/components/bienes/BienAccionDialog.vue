<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="width: 600px; max-width: 94vw">
      <q-card-section>
        <h2 class="text-h6 text-weight-bold q-my-none">{{ TITULOS[modo] }}</h2>
        <p class="sg-muted q-mb-none">{{ bien.nombre }} · {{ bien.id }}</p>
      </q-card-section>

      <q-card-section>
        <q-form class="column q-gutter-y-md" @submit="guardar">
          <template v-if="modo === 'verificacion'">
            <q-option-group v-model="form.resultado" :options="OPCIONES_RESULTADO" />
            <q-input v-model="form.nota" outlined dense type="textarea" autogrow label="Observación de la verificación" />
          </template>

          <template v-if="modo === 'incidente'">
            <q-select v-model="form.tipo" :options="OPCIONES_INCIDENTE" emit-value map-options outlined dense label="Hecho *" />
            <q-input v-model="form.titulo" outlined dense label="Motivo *" :rules="[requerido]" />
            <q-input v-model="form.detalle" outlined dense type="textarea" autogrow label="Detalle" />
            <q-select
              v-model="form.bienIds"
              :options="opcionesAmbiente"
              multiple
              emit-value
              map-options
              use-chips
              outlined
              dense
              label="Bienes afectados *"
              hint="Solo los bienes indicados quedan afectados; el resto del ambiente no cambia."
              :rules="[(v) => v.length > 0 || 'Indique al menos un bien']"
            />
            <q-select v-model="form.condicion" :options="OPCIONES_CONDICION" emit-value map-options clearable outlined dense label="Nueva condición de los bienes afectados" />
            <q-checkbox v-model="form.reportaNecesidad" label="Reportar necesidad de reposición (sin esperar el fin de la vida útil)" />
          </template>

          <template v-if="modo === 'baja'">
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
              <q-input v-model="form.fechaAdquisicion" class="col-12 col-sm-4" outlined dense type="month" stack-label label="Adquisición" />
              <q-input v-model.number="form.costo" class="col-12 col-sm-4" outlined dense type="number" min="0" label="Costo (S/)" />
              <q-input v-model.number="form.vidaUtilAnios" class="col-12 col-sm-4" outlined dense type="number" min="1" label="Vida útil (años)" />
            </div>
          </template>

          <div class="row justify-end q-gutter-sm">
            <q-btn flat color="secondary" label="Cancelar" v-close-popup />
            <q-btn unelevated :color="modo === 'baja' ? 'negative' : 'primary'" type="submit" :label="TITULOS[modo]" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import NoteBanner from 'components/common/NoteBanner.vue'
import { db, bienPorId, bienesDeAmbiente } from 'src/services/datos'
import { darDeBaja, informarVerificacion, registrarIncidente, registrarReposicion, rotuloSugerido } from 'src/services/acciones'
import { OPCIONES_CONDICION } from 'src/config/catalogos'
import { FECHA_CORTE } from 'src/config/demo'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  modo: { type: String, required: true },
  bien: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue', 'hecho'])
const $q = useQuasar()

const TITULOS = {
  verificacion: 'Informar verificación',
  incidente: 'Registrar incidente',
  baja: 'Dar de baja',
  reposicion: 'Registrar reposición'
}
const OPCIONES_RESULTADO = [
  { label: 'Coincide con lo informado', value: 'coincide' },
  { label: 'Se encontraron diferencias', value: 'diferencias' }
]
const OPCIONES_INCIDENTE = [
  { label: 'Daño', value: 'dano' },
  { label: 'Robo', value: 'robo' },
  { label: 'Incendio', value: 'incendio' }
]

const requerido = (v) => !!v || 'Campo obligatorio'
const rotuloLibre = (v) => !bienPorId(v) || 'Ya existe un bien con ese rótulo'

const form = reactive({})

const opcionesAmbiente = computed(() =>
  bienesDeAmbiente(props.bien.ambienteId)
    .filter((b) => b.situacion === 'activo')
    .map((b) => ({ label: `${b.nombre} · ${b.id}`, value: b.id }))
)

const hijosActivos = computed(() => db.bienes.filter((b) => b.asociadoA?.bienId === props.bien.id && b.situacion === 'activo'))

function reiniciar () {
  Object.keys(form).forEach((k) => delete form[k])
  Object.assign(form, {
    resultado: 'coincide',
    nota: '',
    tipo: 'dano',
    titulo: '',
    detalle: '',
    bienIds: [props.bien.id],
    condicion: null,
    reportaNecesidad: true,
    motivo: '',
    rotulo: rotuloSugerido(props.bien.ambienteId, props.bien.tipoId),
    nombre: props.bien.nombre,
    codigoPatrimonial: '',
    fechaAdquisicion: FECHA_CORTE.slice(0, 7),
    costo: null,
    vidaUtilAnios: props.bien.vidaUtilAnios
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
  } else if (props.modo === 'incidente') {
    registrarIncidente({ ...form, ambienteId: props.bien.ambienteId })
    mensaje = `Incidente registrado para ${form.bienIds.length} bien(es).`
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
