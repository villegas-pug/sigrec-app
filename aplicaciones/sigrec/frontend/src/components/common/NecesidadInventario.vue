<template>
  <span v-if="!necesidad.bienes" class="sg-muted">Sin necesidad</span>
  <span v-else>
    {{ plural(necesidad.unidades, 'unidad', 'unidades') }} · {{ soles(necesidad.importeConocido) }}
    <div v-if="necesidad.sinValorar" class="sg-muted">+ {{ plural(necesidad.sinValorar, 'bien sin valorar', 'bienes sin valorar') }}</div>
  </span>
</template>

<script setup>
// Necesidad del año de una fila del inventario: unidades a renovar o reponer, importe conocido y bienes sin precio.
import { plural, soles } from 'src/utils/formato'

defineProps({
  necesidad: { type: Object, required: true }
})
</script>
