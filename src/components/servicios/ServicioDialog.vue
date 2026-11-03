<template>
  <form-dialog
    :model-value="modelValue"
    :titulo="servicio ? 'Actualizar ficha del servicio' : 'Registrar servicio'"
    :subtitulo="centro.nombre"
    :etiqueta-enviar="servicio ? 'Guardar cambios' : 'Registrar servicio'"
    :modificado="modificado"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <div class="row q-col-gutter-md">
      <q-select v-if="!servicio" v-model="form.tipo" class="col-12 col-sm-6" :options="opcionesTipo" emit-value map-options outlined dense label="Servicio *" :rules="[requerido]">
        <template #append><boton-dictado v-model="form.tipo" tipo="opcion" :opciones="opcionesTipo" emit-value /></template>
      </q-select>
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
        :hint="periodicidadBloqueada ? 'Tiene períodos informados: no puede cambiarse.' : ''">
        <template #append><boton-dictado v-model="form.periodicidad" tipo="opcion" :opciones="OPCIONES_PERIODICIDAD" emit-value :disable="periodicidadBloqueada" /></template>
      </q-select>
    </div>
    <q-input v-model="form.proveedor" outlined dense label="Proveedor *" :rules="[requerido]">
      <template #append><boton-dictado v-model="form.proveedor" /></template>
    </q-input>
    <div class="row q-col-gutter-md">
      <q-input v-model="form.telefono" class="col-12 col-sm-6" outlined dense type="tel" label="Teléfono del proveedor" hint="Solo se muestra como dato de contacto" :rules="[telefonoValido]">
        <template #append><boton-dictado v-model="form.telefono" tipo="telefono" /></template>
      </q-input>
      <q-input v-model="form.contactoNombre" class="col-12 col-sm-6" outlined dense label="Contacto" hint="Opcional. Ej.: Mesa de ayuda, ejecutivo de cuenta">
        <template #append><boton-dictado v-model="form.contactoNombre" local /></template>
      </q-input>
    </div>
    <q-input v-model="form.suministro" outlined dense label="N.º de suministro o contrato">
      <template #append><boton-dictado v-model="form.suministro" tipo="codigo" /></template>
    </q-input>
    <q-input v-model="form.contratacion" outlined dense label="Contratación" hint="Ej.: a nombre del arrendador, pago por el CAR">
      <template #append><boton-dictado v-model="form.contratacion" /></template>
    </q-input>
    <q-input v-model="form.observaciones" outlined dense type="textarea" autogrow label="Observaciones de instalación">
      <template #append><boton-dictado v-model="form.observaciones" /></template>
    </q-input>
  </form-dialog>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import { useBorrador } from 'src/composables/useBorrador'
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
const { modificado, fijar } = useBorrador(form)

const telefonoValido = (v) => !v || /^[\d+()\-\s]{6,20}$/.test(v) || 'Use solo dígitos, espacios y + - ( )'

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  const s = props.servicio
  Object.assign(form, {
    tipo: s?.tipo ?? props.tipoInicial ?? props.tiposDisponibles[0] ?? null,
    periodicidad: s?.periodicidad ?? 'mensual',
    proveedor: s?.proveedor ?? '',
    telefono: s?.contacto?.telefono ?? '',
    contactoNombre: s?.contacto?.nombre ?? '',
    suministro: s?.suministro && s.suministro !== 'No informado' ? s.suministro : '',
    contratacion: s?.contratacion && s.contratacion !== 'No informada' ? s.contratacion : '',
    observaciones: s?.observaciones ?? ''
  })
  fijar()
})

function guardar () {
  const datos = {
    proveedor: form.proveedor,
    contacto: form.telefono?.trim() || form.contactoNombre?.trim() ? { telefono: form.telefono?.trim() || null, nombre: form.contactoNombre?.trim() || null } : null,
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
