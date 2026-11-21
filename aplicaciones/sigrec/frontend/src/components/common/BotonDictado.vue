<template>
  <q-btn
    v-if="dictadoDisponible"
    flat
    round
    dense
    class="sg-dictado"
    :class="{ 'sg-dictado--activo': estado === 'escuchando' }"
    :color="estado === 'escuchando' ? 'negative' : 'secondary'"
    :disable="disable"
    :aria-label="etiqueta"
    :aria-pressed="estado === 'inactivo' ? 'false' : 'true'"
    :title="etiqueta"
    @click.stop="alternar"
    @mousedown.stop
    @touchstart.stop
  >
    <q-icon v-if="estado === 'inactivo'" name="mic" />
    <q-icon v-else-if="estado === 'escuchando'" name="stop" />
    <q-circular-progress v-else-if="estado === 'descargando'" :value="progreso" size="22px" :thickness="0.3" color="secondary" track-color="grey-4" />
    <q-spinner v-else size="20px" color="secondary" />
  </q-btn>
</template>

<script setup>
// Botón de dictado para el slot `#append` de q-input y q-select (SPEC 007).
// `tipo` decide cómo se interpreta lo dictado: texto (se añade al final), codigo, telefono, numero, anio, mes, fecha, hora u opcion.
// Los tipos distintos de texto reemplazan el valor, lo muestran y permiten deshacer; si no se entiende nada, el campo no cambia.
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { dictadoDisponible, unirDictado, useDictado } from 'src/composables/useDictado'
import { aAnio, aCodigo, aFecha, aHora, aMes, aNumero, aTelefono, elegirOpcion } from 'src/utils/interpretacionVoz'
import { fecha } from 'src/utils/formato'

const props = defineProps({
  modelValue: { type: [String, Number, Object, Array, Boolean], default: null },
  disable: { type: Boolean, default: false },
  tipo: { type: String, default: 'texto' },
  // Obliga a usar el reconocimiento en el dispositivo (campos con datos personales).
  local: { type: Boolean, default: false },
  // Un número en un campo cuyo valor es texto (v-model sin .number) se emite como texto.
  comoTexto: { type: Boolean, default: false },
  // Solo para tipo «opcion» (q-select).
  opciones: { type: Array, default: () => [] },
  optionLabel: { type: [String, Function], default: 'label' },
  optionValue: { type: [String, Function], default: 'value' },
  emitValue: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

const $q = useQuasar()
const { estado, progreso, iniciar, detener, cancelar } = useDictado()

const etiqueta = computed(() => {
  if (estado.value === 'escuchando') return 'Detener dictado'
  if (estado.value === 'descargando') return 'Descargando el modelo de voz. Pulse para cancelar'
  if (estado.value === 'transcribiendo') return 'Transcribiendo. Pulse para cancelar'
  return 'Dictar por voz'
})

const leer = (o, clave) => (typeof clave === 'function' ? clave(o) : o?.[clave])

// Devuelve { valor, mostrado } o null si no se entendió.
function interpretar (texto) {
  const t = props.tipo
  const num = (n) => (n == null ? null : { valor: props.comoTexto ? String(n) : n, mostrado: String(n).replace('.', ',') })
  if (t === 'numero') return num(aNumero(texto))
  if (t === 'anio') {
    const a = aAnio(texto)
    return a ? { valor: props.comoTexto ? a : Number(a), mostrado: a } : null
  }
  if (t === 'mes') {
    const m = aMes(texto)
    return m ? { valor: m, mostrado: fecha(m) } : null
  }
  if (t === 'fecha') {
    const f = aFecha(texto)
    return f ? { valor: f, mostrado: fecha(f) } : null
  }
  if (t === 'hora') {
    const h = aHora(texto)
    return h ? { valor: h, mostrado: h } : null
  }
  if (t === 'telefono') {
    const d = aTelefono(texto)
    return d ? { valor: d, mostrado: d } : null
  }
  if (t === 'codigo') {
    const c = aCodigo(texto)
    return c ? { valor: c, mostrado: c } : null
  }
  if (t === 'opcion') {
    const etiquetaDe = (o) => String(leer(o, props.optionLabel) ?? o)
    const valorDe = (o) => (props.emitValue ? leer(o, props.optionValue) : o)
    const v = elegirOpcion(texto, props.opciones, { etiqueta: etiquetaDe, valor: valorDe })
    if (v == null) return null
    const opcion = props.opciones.find((o) => valorDe(o) === v)
    return { valor: v, mostrado: opcion ? etiquetaDe(opcion) : String(v) }
  }
  return null
}

const NOMBRES = {
  numero: 'un número', anio: 'un año', mes: 'un mes', fecha: 'una fecha', hora: 'una hora', telefono: 'un teléfono', codigo: 'un código', opcion: 'una opción de la lista'
}

function alternar () {
  if (estado.value === 'escuchando') {
    detener()
    return
  }
  if (estado.value !== 'inactivo') {
    cancelar()
    return
  }
  const previo = props.modelValue
  if (props.tipo === 'texto') {
    // El texto previo del campo se conserva: el dictado se añade al final y se ve en vivo mientras se habla.
    const base = typeof previo === 'string' ? previo : ''
    iniciar({
      local: props.local,
      alParcial: (t) => emit('update:modelValue', unirDictado(base, t)),
      alFinal: (t) => emit('update:modelValue', unirDictado(base, t)),
      alCancelar: () => emit('update:modelValue', previo ?? '')
    })
    return
  }
  iniciar({
    local: props.local,
    alFinal: (texto) => {
      const r = interpretar(texto)
      if (!r) {
        $q.notify({ type: 'warning', message: `No se entendió ${NOMBRES[props.tipo] ?? 'un valor'} en «${texto.trim()}». El campo no cambió.` })
        return
      }
      emit('update:modelValue', r.valor)
      $q.notify({
        type: 'positive',
        message: `Se entendió «${texto.trim()}» → ${r.mostrado}`,
        timeout: 5000,
        actions: [{ label: 'Deshacer', color: 'white', handler: () => emit('update:modelValue', previo) }]
      })
    }
  })
}
</script>
