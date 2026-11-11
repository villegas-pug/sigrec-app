<template>
  <form-dialog
    :model-value="modelValue"
    :icono-enviar="ambiente ? 'save' : 'add'"
    :titulo="ambiente ? 'Actualizar ambiente' : 'Registrar ambiente'"
    :subtitulo="ambiente ? `${ambiente.nombre} · ${ambiente.id}` : centro.nombre"
    :etiqueta-enviar="ambiente ? 'Guardar cambios' : 'Registrar ambiente'"
    :modificado="modificado"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <q-select
      v-model="form.moduloId"
      outlined
      dense
      emit-value
      map-options
      :options="opcionesModulo"
      label="Módulo *"
      :hint="ambiente ? 'Puede moverlo a otro módulo del mismo centro' : 'Casa o módulo de uso común donde está el ambiente'"
      :rules="[requerido]"
    >
      <template #option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section avatar><q-icon :name="scope.opt.icono" aria-hidden="true" /></q-item-section>
          <q-item-section>
            <q-item-label>{{ scope.opt.label }}</q-item-label>
            <q-item-label caption>{{ scope.opt.caption }}</q-item-label>
          </q-item-section>
        </q-item>
      </template>
      <template #no-option>
        <q-item><q-item-section class="sg-muted">El centro no tiene módulos activos: registre primero un módulo.</q-item-section></q-item>
      </template>
    </q-select>
    <div class="row q-col-gutter-md">
      <q-input v-model="form.nombre" class="col-12 col-sm-8" outlined dense label="Nombre *" hint="Ej.: Dormitorio 3, Lavandería" :rules="[requerido]">
        <template #append><boton-dictado v-model="form.nombre" /></template>
      </q-input>
      <q-input v-model.number="form.piso" class="col-12 col-sm-4" outlined dense type="number" min="0" label="Piso">
        <template #append><boton-dictado v-model="form.piso" tipo="numero" /></template>
      </q-input>
      <q-input v-model="form.bloque" class="col-12 col-sm-6" outlined dense label="Bloque" hint="Opcional. Ej.: Bloque A">
        <template #append><boton-dictado v-model="form.bloque" /></template>
      </q-input>
      <q-input v-model="form.ubicacion" class="col-12 col-sm-6" outlined dense label="Ubicación" hint="Opcional. Ej.: Ala este, junto al patio">
        <template #append><boton-dictado v-model="form.ubicacion" /></template>
      </q-input>
      <q-input v-model.number="form.areaM2" class="col-12 col-sm-4" outlined dense type="number" min="0" label="Área (m²)">
        <template #append><boton-dictado v-model="form.areaM2" tipo="numero" /></template>
      </q-input>
      <q-input v-model.number="form.puertas" class="col-6 col-sm-4" outlined dense type="number" min="0" label="Puertas">
        <template #append><boton-dictado v-model="form.puertas" tipo="numero" /></template>
      </q-input>
      <q-input v-model.number="form.ventanas" class="col-6 col-sm-4" outlined dense type="number" min="0" label="Ventanas">
        <template #append><boton-dictado v-model="form.ventanas" tipo="numero" /></template>
      </q-input>
    </div>
    <condicion-selector v-model="form.condicion" etiqueta="Condición *" />
    <q-input v-model="form.ultimoPintado" outlined dense type="month" stack-label label="Último pintado" hint="Vacío si no se conoce" :rules="[noFutura]">
      <template #append><boton-dictado v-model="form.ultimoPintado" tipo="mes" /></template>
    </q-input>
    <div class="sg-kv__label">Estado de la infraestructura</div>
    <estado-elementos v-model="form.estadoElementos" sugerir-novedad />
  </form-dialog>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import CondicionSelector from 'components/common/CondicionSelector.vue'
import EstadoElementos from 'components/common/EstadoElementos.vue'
import { useBorrador } from 'src/composables/useBorrador'
import { actualizarAmbiente, numeroONulo, registrarAmbiente } from 'src/services/acciones'
import { completarElementos, normalizarElementos } from 'src/services/infraestructura'
import { modulosDeCar } from 'src/services/datos'
import { iconoModulo } from 'src/services/bienes'
import { TIPOS_MODULO } from 'src/config/catalogos'
import { noFutura, requerido } from 'src/utils/validaciones'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  centro: { type: Object, required: true },
  // null = alta de un ambiente nuevo en el centro.
  ambiente: { type: Object, default: null },
  // Módulo preseleccionado en el alta (al registrar desde un módulo).
  modulo: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'hecho'])
const $q = useQuasar()

const form = reactive({})
const { modificado, fijar } = useBorrador(form)

// Módulos activos del centro, casas primero. Un ambiente activo siempre está en un módulo activo (SPEC 020).
const opcionesModulo = computed(() =>
  modulosDeCar(props.centro.id).map((m) => ({ value: m.id, label: m.nombre, caption: `${TIPOS_MODULO[m.tipo]?.label ?? ''} · ${m.id}`, icono: iconoModulo(m) }))
)

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  const a = props.ambiente
  const unicoModulo = opcionesModulo.value.length === 1 ? opcionesModulo.value[0].value : null
  Object.assign(form, {
    moduloId: a?.moduloId ?? props.modulo?.id ?? unicoModulo,
    nombre: a?.nombre ?? '',
    piso: a?.piso ?? 1,
    bloque: a?.bloque ?? '',
    ubicacion: a?.ubicacion ?? '',
    areaM2: a?.areaM2 ?? null,
    puertas: a?.puertas ?? null,
    ventanas: a?.ventanas ?? null,
    condicion: a?.condicion ?? 'bueno',
    ultimoPintado: a?.ultimoPintado ?? '',
    estadoElementos: completarElementos(a?.estadoElementos)
  })
  fijar()
})

function guardar () {
  const datos = {
    moduloId: form.moduloId,
    nombre: form.nombre,
    piso: numeroONulo(form.piso),
    bloque: form.bloque?.trim() || null,
    ubicacion: form.ubicacion?.trim() || null,
    areaM2: numeroONulo(form.areaM2),
    puertas: numeroONulo(form.puertas),
    ventanas: numeroONulo(form.ventanas),
    condicion: form.condicion,
    ultimoPintado: form.ultimoPintado || null,
    estadoElementos: normalizarElementos(form.estadoElementos)
  }
  let id
  if (props.ambiente) {
    actualizarAmbiente(props.ambiente, datos)
    id = props.ambiente.id
  } else {
    id = registrarAmbiente(props.centro, datos).id
  }
  $q.notify({ type: 'positive', message: props.ambiente ? 'Ambiente actualizado.' : `Ambiente «${datos.nombre}» registrado.` })
  emit('update:modelValue', false)
  emit('hecho', id)
}
</script>
