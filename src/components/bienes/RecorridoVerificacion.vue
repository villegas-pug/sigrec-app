<template>
  <form-dialog
    :model-value="modelValue"
    icono-enviar="fact_check"
    :titulo="`Verificar ${ambiente.nombre}`"
    :subtitulo="`${textoUbicacion(ubicacionDeAmbiente(ambiente.id))} · un toque por bien`"
    :ancho="780"
    :etiqueta-enviar="marcados ? `Guardar ${plural(marcados, 'verificación', 'verificaciones')}` : 'Guardar'"
    :deshabilitar-enviar="!marcados"
    :modificado="modificado"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <div class="row items-center q-col-gutter-md">
      <q-input v-model="form.fecha" class="col-12 col-sm-5" outlined dense type="date" stack-label label="Fecha del recorrido *" :hint="HINT_FECHA_CORTE" :rules="[requerido, noFutura]">
        <template #append><boton-dictado v-model="form.fecha" tipo="fecha" /></template>
      </q-input>
      <div class="col-12 col-sm-7 column q-gutter-y-xs">
        <span class="text-weight-bold">{{ marcados }} de {{ bienes.length }} marcados</span>
        <q-linear-progress :value="bienes.length ? marcados / bienes.length : 0" color="primary" rounded size="8px" />
        <div class="row q-gutter-sm">
          <q-btn outline dense no-caps color="primary" icon="qr_code_scanner" label="Escanear rótulos" @click="escaner = true" />
          <q-btn v-if="pendientes.length" flat dense no-caps color="secondary" icon="done_all" :label="`Marcar los ${pendientes.length} sin marcar como «Coincide»`" @click="marcarPendientes" />
        </div>
      </div>
    </div>

    <div v-for="b in bienes" :key="b.id" class="sg-box" :class="{ 'sg-box--resaltada': form.marcas[b.id] }">
      <div class="row items-center justify-between q-gutter-sm">
        <div class="column" style="min-width: 0">
          <span class="text-weight-bold">{{ b.nombre }} · {{ b.id }}</span>
          <span class="sg-muted">
            <template v-if="b.asociadoA">Componente de {{ b.asociadoA.bienId }} · </template>
            {{ (b.cantidad ?? 1) > 1 ? `${b.cantidad} unidades · ` : '' }}{{ condicion(b.condicion).label }}
            · {{ b.verificacion ? `verificado el ${fecha(b.verificacion.fecha)}` : 'sin verificar' }}
          </span>
        </div>
        <q-btn-toggle
          :model-value="form.marcas[b.id]?.resultado ?? null"
          :options="OPCIONES"
          clearable
          dense
          no-caps
          unelevated
          toggle-color="primary"
          color="grey-2"
          text-color="dark"
          :aria-label="`Resultado de ${b.nombre} ${b.id}`"
          @update:model-value="(v) => marcar(b.id, v)"
        />
      </div>
      <q-input
        v-if="form.marcas[b.id] && form.marcas[b.id].resultado !== 'coincide'"
        v-model="form.marcas[b.id].nota"
        outlined
        dense
        class="q-mt-sm"
        :label="form.marcas[b.id].resultado === 'no_encontrado' ? 'Dónde se buscó u otra observación' : 'Diferencia encontrada'"
      >
        <template #append><boton-dictado v-model="form.marcas[b.id].nota" /></template>
      </q-input>
    </div>
    <p v-if="!bienes.length" class="sg-muted q-mb-none">El ambiente no tiene bienes activos para verificar.</p>
    <escaner-rotulo v-model="escaner" continuo titulo="Escanear rótulos del ambiente" @leido="alEscanear" />
    <p class="sg-muted q-mb-none">
      Escanear un rótulo lo marca como «Coincide». Solo se registran los bienes marcados. «No encontrado» se registra como verificación con diferencias; si se confirma la pérdida,
      registre el incidente desde la ficha del bien.
    </p>
  </form-dialog>
</template>

<script setup>
// Recorrido de verificación de un ambiente (SPEC 011, Ola 2): todos los bienes activos en una lista, un toque por bien
// y un solo guardado. Cada bien marcado genera la misma verificación que «Informar verificación» (informarVerificacion).
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import EscanerRotulo from 'components/common/EscanerRotulo.vue'
import { useBorrador } from 'src/composables/useBorrador'
import { bienPorId, bienesDeAmbiente, textoUbicacion, ubicacionDeAmbiente } from 'src/services/datos'
import { informarVerificacion } from 'src/services/acciones'
import { condicion } from 'src/config/catalogos'
import { FECHA_CORTE } from 'src/config/demo'
import { fecha, plural } from 'src/utils/formato'
import { HINT_FECHA_CORTE, noFutura, requerido } from 'src/utils/validaciones'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  ambiente: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue', 'seleccionar'])
const $q = useQuasar()

const OPCIONES = [
  { value: 'coincide', label: 'Coincide', icon: 'check' },
  { value: 'diferencias', label: 'Diferencia', icon: 'rule' },
  { value: 'no_encontrado', label: 'No está', icon: 'search_off' }
]

const form = reactive({ fecha: FECHA_CORTE, marcas: {} })
const { modificado, fijar } = useBorrador(form)

// Primero los que nunca se verificaron; luego por rótulo.
const bienes = computed(() =>
  bienesDeAmbiente(props.ambiente.id)
    .filter((b) => b.situacion === 'activo')
    .sort((a, b) => (!!a.verificacion - !!b.verificacion) || a.id.localeCompare(b.id))
)
const marcados = computed(() => Object.keys(form.marcas).length)
const pendientes = computed(() => bienes.value.filter((b) => !form.marcas[b.id]))

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  Object.assign(form, { fecha: FECHA_CORTE, marcas: {} })
  fijar()
})

function marcar (bienId, resultado) {
  if (!resultado) {
    delete form.marcas[bienId]
    return
  }
  form.marcas[bienId] = { resultado, nota: form.marcas[bienId]?.nota ?? '' }
}

const marcarPendientes = () => pendientes.value.forEach((b) => marcar(b.id, 'coincide'))

// Escaneo continuo (Ola 3): cada rótulo leído del ambiente se marca «Coincide» (si ya tenía otra marca, se respeta).
const escaner = ref(false)
function alEscanear (rotulo) {
  const bien = bienes.value.find((b) => b.id.toUpperCase() === rotulo)
  if (!bien) {
    $q.notify({ type: 'warning', message: `${rotulo} no es un bien activo de ${props.ambiente.nombre}. Si está aquí por error, regístrelo o trasládelo.` })
    return
  }
  if (!form.marcas[bien.id]) marcar(bien.id, 'coincide')
  $q.notify({ type: 'positive', message: `${bien.nombre} · ${bien.id}: ${form.marcas[bien.id].resultado === 'coincide' ? 'coincide' : 'ya estaba marcado'}. ${marcados.value} de ${bienes.value.length}.`, timeout: 1500 })
}

function guardar () {
  const noEncontrados = []
  for (const [bienId, { resultado, nota }] of Object.entries(form.marcas)) {
    const bien = bienPorId(bienId)
    if (!bien) continue
    if (resultado === 'no_encontrado') {
      noEncontrados.push(bien)
      informarVerificacion(bien, { resultado: 'diferencias', nota: ['No encontrado en el recorrido de verificación.', nota?.trim()].filter(Boolean).join(' '), fecha: form.fecha })
    } else {
      informarVerificacion(bien, { resultado, nota: nota?.trim() || '', fecha: form.fecha })
    }
  }
  $q.notify({
    type: noEncontrados.length ? 'warning' : 'positive',
    message: `${plural(marcados.value, 'verificación registrada', 'verificaciones registradas')}${noEncontrados.length ? `. ${plural(noEncontrados.length, 'bien no encontrado', 'bienes no encontrados')}: revise si corresponde un incidente.` : '.'}`,
    timeout: noEncontrados.length ? 8000 : undefined,
    actions: noEncontrados.length ? [{ label: `Ver ${noEncontrados[0].id}`, color: 'white', handler: () => emit('seleccionar', noEncontrados[0].id) }] : []
  })
  fijar()
  emit('update:modelValue', false)
}
</script>
