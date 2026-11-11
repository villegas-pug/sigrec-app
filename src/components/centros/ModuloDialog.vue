<template>
  <form-dialog
    :model-value="modelValue"
    :icono-enviar="modulo ? 'save' : 'add'"
    :titulo="modulo ? 'Actualizar módulo' : 'Registrar módulo'"
    :subtitulo="modulo ? `${modulo.nombre} · ${modulo.id}` : `${centro.nombre} · código ${codigoSugerido} (se asigna al registrar)`"
    :etiqueta-enviar="modulo ? 'Guardar cambios' : 'Registrar módulo'"
    :modificado="modificado"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <q-input v-model="form.nombre" outlined dense label="Nombre *" hint="Ej.: Casa Los Girasoles, Comedor y cocina" :rules="[requerido]">
      <template #append><boton-dictado v-model="form.nombre" /></template>
    </q-input>

    <div>
      <div class="sg-kv__label q-mb-xs">Tipo de módulo *</div>
      <q-option-group v-model="form.tipo" :options="OPCIONES_TIPO_MODULO" type="radio" inline color="secondary" aria-label="Tipo de módulo" />
      <p class="sg-muted q-mb-none">{{ TIPOS_MODULO[form.tipo]?.descripcion }}</p>
    </div>

    <div class="row q-col-gutter-md">
      <!-- La capacidad solo aplica a las casas: aparece al elegir «Casa». -->
      <q-input
        v-if="form.tipo === 'casa'"
        v-model.number="form.capacidad"
        class="col-12 col-sm-4"
        outlined
        dense
        type="number"
        min="0"
        step="1"
        label="Capacidad de residentes"
        hint="Opcional"
        :rules="[enteroOpcional]"
      >
        <template #append><boton-dictado v-model="form.capacidad" tipo="numero" /></template>
      </q-input>
      <q-input v-model.number="form.pisos" class="col-6 col-sm-4" outlined dense type="number" min="1" step="1" label="N.º de pisos *" :rules="[pisosValidos]">
        <template #append><boton-dictado v-model="form.pisos" tipo="numero" /></template>
      </q-input>
      <q-input v-model.number="form.areaM2" class="col-6 col-sm-4" outlined dense type="number" min="0" label="Área construida (m²)" hint="Opcional" :rules="[opcionalMayorQueCero]">
        <template #append><boton-dictado v-model="form.areaM2" tipo="numero" /></template>
      </q-input>
    </div>

    <condicion-selector v-model="form.condicion" etiqueta="Condición *" />

    <q-input v-model="form.ubicacion" outlined dense label="Referencia de ubicación en el centro" hint="Opcional. Ej.: Al fondo, junto al patio">
      <template #append><boton-dictado v-model="form.ubicacion" /></template>
    </q-input>
  </form-dialog>
</template>

<script setup>
// Alta y actualización de un módulo del centro (SPEC 020): casa o módulo de uso común.
import { computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import BotonDictado from 'components/common/BotonDictado.vue'
import CondicionSelector from 'components/common/CondicionSelector.vue'
import { useBorrador } from 'src/composables/useBorrador'
import { actualizarModulo, numeroONulo, registrarModulo, siguienteCodigo } from 'src/services/acciones'
import { moduloPorId } from 'src/services/datos'
import { OPCIONES_TIPO_MODULO, TIPOS_MODULO } from 'src/config/catalogos'
import { opcionalMayorQueCero, requerido } from 'src/utils/validaciones'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  centro: { type: Object, required: true },
  // null = alta de un módulo nuevo en el centro.
  modulo: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'hecho'])
const $q = useQuasar()

const form = reactive({})
const { modificado, fijar } = useBorrador(form)

const codigoSugerido = computed(() => siguienteCodigo(`${props.centro.id}-M`, moduloPorId))

const enteroOpcional = (v) => v === null || v === undefined || v === '' || (Number.isInteger(v) && v >= 0) || 'Indique un número entero, cero o mayor'
const pisosValidos = (v) => (Number.isInteger(v) && v >= 1) || 'Indique al menos 1 piso'

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  const m = props.modulo
  Object.assign(form, {
    nombre: m?.nombre ?? '',
    tipo: m?.tipo ?? 'casa',
    capacidad: m?.capacidad ?? null,
    pisos: m?.pisos ?? 1,
    areaM2: m?.areaM2 ?? null,
    condicion: m?.condicion ?? 'bueno',
    ubicacion: m?.ubicacion ?? ''
  })
  fijar()
})

function guardar () {
  const datos = {
    nombre: form.nombre.trim(),
    tipo: form.tipo,
    // Un módulo de uso común no tiene capacidad de residentes.
    capacidad: form.tipo === 'casa' ? numeroONulo(form.capacidad) : null,
    pisos: numeroONulo(form.pisos),
    areaM2: numeroONulo(form.areaM2),
    condicion: form.condicion,
    ubicacion: form.ubicacion?.trim() || null
  }
  let id
  if (props.modulo) {
    actualizarModulo(props.modulo, datos)
    id = props.modulo.id
  } else {
    id = registrarModulo(props.centro, datos).id
  }
  $q.notify({ type: 'positive', message: props.modulo ? 'Módulo actualizado.' : `Módulo «${datos.nombre}» registrado.` })
  emit('update:modelValue', false)
  emit('hecho', id)
}
</script>
