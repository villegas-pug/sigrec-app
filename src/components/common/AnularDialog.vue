<template>
  <form-dialog
    :model-value="modelValue"
    icono-enviar="block"
    :titulo="titulo"
    :subtitulo="subtitulo"
    :ancho="520"
    etiqueta-enviar="Anular"
    color-enviar="negative"
    :deshabilitar-enviar="dependencias.length > 0"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="$emit('confirmar', motivo)"
  >
    <note-banner v-if="dependencias.length" tono="wa" icono="block">
      <strong>No se puede anular todavía.</strong> Tiene elementos vigentes que dependen de este registro:
      <ul class="q-my-xs q-pl-md">
        <li v-for="d in dependencias.slice(0, LIMITE)" :key="d">{{ d }}</li>
        <li v-if="dependencias.length > LIMITE">y {{ dependencias.length - LIMITE }} más.</li>
      </ul>
    </note-banner>
    <note-banner v-else tono="in">
      {{ aviso || 'El registro se conserva como antecedente, deja de contar en los cálculos y puede reactivarse con «Mostrar inactivos».' }}
    </note-banner>
    <q-input v-model="motivo" outlined dense type="textarea" autogrow label="Motivo *" :rules="[requerido]" :disable="dependencias.length > 0">
      <template #append><boton-dictado v-model="motivo" :disable="dependencias.length > 0" /></template>
    </q-input>
  </form-dialog>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { ref, watch } from 'vue'
import FormDialog from 'components/common/FormDialog.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import { requerido } from 'src/utils/validaciones'

const LIMITE = 8

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  titulo: { type: String, default: 'Anular registro' },
  subtitulo: { type: String, default: '' },
  aviso: { type: String, default: '' },
  // Elementos vigentes que impiden anular (lista vacía = se puede anular).
  dependencias: { type: Array, default: () => [] }
})

defineEmits(['update:modelValue', 'confirmar'])

const motivo = ref('')

watch(() => props.modelValue, (abierto) => {
  if (abierto) motivo.value = ''
})
</script>
