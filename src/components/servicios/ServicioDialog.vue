<template>
  <form-dialog
    :model-value="modelValue"
    :titulo="servicio ? 'Actualizar ficha del servicio' : 'Registrar servicio'"
    :subtitulo="centro.nombre"
    :etiqueta-enviar="servicio ? 'Guardar cambios' : 'Registrar servicio'"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <div class="row q-col-gutter-md">
      <q-select v-if="!servicio" v-model="form.tipo" class="col-12 col-sm-6" :options="opcionesTipo" emit-value map-options outlined dense label="Servicio *" :rules="[requerido]" />
      <q-select
        v-model="form.periodicidad"
        class="col-12 col-sm-6"
        :options="OPCIONES_PERIODICIDAD"
        emit-value
        map-options
        outlined
        dense
        label="Periodicidad *"
        :disable="periodicidadBloqueada"
        :hint="periodicidadBloqueada ? 'Tiene períodos informados: no puede cambiarse.' : ''"
      />
    </div>
    <q-input v-model="form.proveedor" outlined dense label="Proveedor *" :rules="[requerido]" />
    <q-input v-model="form.suministro" outlined dense label="N.º de suministro o contrato" />
    <q-input v-model="form.contratacion" outlined dense label="Contratación" hint="Ej.: a nombre del arrendador, pago por el CAR" />
    <q-input v-model="form.observaciones" outlined dense type="textarea" autogrow label="Observaciones de instalación" />
  </form-dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import { actualizarServicio, registrarServicio } from 'src/services/acciones'
import { tienePeriodosInformados } from 'src/services/servicios'
import { OPCIONES_PERIODICIDAD, TIPOS_SERVICIO } from 'src/config/catalogos'
import { requerido } from 'src/utils/validaciones'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  centro: { type: Object, required: true },
  // null = alta de uno de los tipos aún no registrados.
  servicio: { type: Object, default: null },
  tiposDisponibles: { type: Array, default: () => [] },
  tipoInicial: { type: String, default: null }
})

const emit = defineEmits(['update:modelValue', 'hecho'])
const $q = useQuasar()

const opcionesTipo = computed(() => props.tiposDisponibles.map((t) => ({ label: TIPOS_SERVICIO[t], value: t })))
const periodicidadBloqueada = computed(() => !!props.servicio && tienePeriodosInformados(props.servicio))

const form = reactive({})

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  const s = props.servicio
  Object.assign(form, {
    tipo: s?.tipo ?? props.tipoInicial ?? props.tiposDisponibles[0] ?? null,
    periodicidad: s?.periodicidad ?? 'mensual',
    proveedor: s?.proveedor ?? '',
    suministro: s?.suministro && s.suministro !== 'No informado' ? s.suministro : '',
    contratacion: s?.contratacion && s.contratacion !== 'No informada' ? s.contratacion : '',
    observaciones: s?.observaciones ?? ''
  })
})

function guardar () {
  const datos = {
    proveedor: form.proveedor,
    suministro: form.suministro || 'No informado',
    contratacion: form.contratacion || 'No informada',
    observaciones: form.observaciones || null
  }
  let id
  if (props.servicio) {
    actualizarServicio(props.servicio, periodicidadBloqueada.value ? datos : { ...datos, periodicidad: form.periodicidad })
    id = props.servicio.id
  } else {
    id = registrarServicio(props.centro, { tipo: form.tipo, periodicidad: form.periodicidad, ...datos }).id
  }
  $q.notify({ type: 'positive', message: props.servicio ? 'Ficha del servicio actualizada.' : `Servicio de ${TIPOS_SERVICIO[form.tipo]} registrado.` })
  emit('update:modelValue', false)
  emit('hecho', id)
}
</script>
