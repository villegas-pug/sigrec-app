<template>
  <ul class="sg-descendientes">
    <li v-for="nodo in nodos" :key="`${nodo.tipo}:${nodo.registro.id}`" class="sg-descendientes__item">
      <div class="sg-descendientes__fila">
        <q-btn v-if="nodo.children.length" flat round dense color="secondary" :icon="abiertos.includes(nodo.registro.id) ? 'expand_more' : 'chevron_right'" :aria-label="`${abiertos.includes(nodo.registro.id) ? 'Ocultar' : 'Mostrar'} descendientes de ${nodo.registro.nombre}`" :aria-expanded="abiertos.includes(nodo.registro.id)" @click="alternar(nodo.registro.id)" />
        <span v-else class="sg-descendientes__espaciador" aria-hidden="true" />
        <div class="sg-descendientes__identidad">
          <span class="sg-muted">{{ etiquetas[nodo.tipo] }}<template v-if="nodo.referencia"> · Referencia fuera del filtro</template></span>
          <span v-if="nodo.referencia" class="text-weight-bold">{{ nodo.registro.nombre }} · {{ nodo.registro.id }}</span>
          <button v-else type="button" class="sg-row-btn text-weight-bold" @click="$emit('seleccionar', idNodo(nodo))">{{ nodo.registro.nombre }} · {{ nodo.registro.id }}</button>
          <span v-if="nodo.conteo" class="sg-muted">Registros: {{ nodo.conteo }}</span>
          <span v-if="nodo.tipo === 'modulo'" class="sg-muted">{{ nodo.children.length }} ambientes<template v-if="nodo.registro.capacidad != null"> · {{ nodo.registro.capacidad }} residentes</template></span>
          <span v-if="nodo.registro.asociadoA?.posicion" class="sg-muted">{{ nodo.registro.asociadoA.posicion }}</span>
          <span v-if="nodo.registro.cantidad > 1" class="sg-muted">{{ nodo.registro.cantidad }} unidades</span>
        </div>
        <div class="sg-chips">
          <status-chip v-if="nodo.registro.condicion" v-bind="condicion(nodo.registro.condicion)" />
          <status-chip v-if="!nodo.referencia || nodo.registro.situacion" v-bind="SITUACIONES[estadoNivel(nodo)]" />
          <status-chip v-if="nodo.tipo === 'ambiente' && novedadesAbiertas(nodo.registro).length" tono="da" :label="`${novedadesAbiertas(nodo.registro).length} novedades abiertas`" />
          <status-chip v-if="['ambiente', 'modulo'].includes(nodo.tipo) && elementosCriticos(nodo.registro.estadoElementos, nodo.registro.elementosAdicionales).length" tono="wa" :label="`${elementosCriticos(nodo.registro.estadoElementos, nodo.registro.elementosAdicionales).length} elementos críticos`" />
          <q-btn v-if="nodo.tipo === 'modulo' && puedeRegistrarAmbiente && estadoNivel(nodo) === 'activo'" flat dense no-caps color="secondary" icon="add" label="Ambiente" :aria-label="`Registrar ambiente en ${nodo.registro.nombre}`" @click="$emit('registrar-ambiente', nodo.registro)" />
        </div>
      </div>
      <descendientes-recursos v-if="nodo.children.length && abiertos.includes(nodo.registro.id)" :nodos="nodo.children" :puede-registrar-ambiente="puedeRegistrarAmbiente" @seleccionar="$emit('seleccionar', $event)" @registrar-ambiente="$emit('registrar-ambiente', $event)" />
    </li>
  </ul>
</template>

<script setup>
import { ref } from 'vue'
import StatusChip from 'components/common/StatusChip.vue'
import { condicion, SITUACIONES } from 'src/config/catalogos'
import { nodoModuloId, nodoAmbienteId } from 'src/services/bienes'
import { estadoNivel } from 'src/services/jerarquiaRecursos'
import { novedadesAbiertas } from 'src/services/situacion'
import { elementosCriticos } from 'src/services/infraestructura'

defineProps({ nodos: { type: Array, required: true }, puedeRegistrarAmbiente: { type: Boolean, default: false } })
defineEmits(['seleccionar', 'registrar-ambiente'])
const abiertos = ref([])
const etiquetas = { modulo: 'Módulo', ambiente: 'Ambiente', bien: 'Bien', componente: 'Componente' }
const idNodo = (n) => n.tipo === 'modulo' ? nodoModuloId(n.registro.id) : n.tipo === 'ambiente' ? nodoAmbienteId(n.registro.id) : n.registro.id
function alternar (id) { abiertos.value = abiertos.value.includes(id) ? abiertos.value.filter((v) => v !== id) : [...abiertos.value, id] }
</script>

<style scoped>
.sg-descendientes { list-style: none; padding: 0; margin: 0; min-width: 0; }
.sg-descendientes__item { min-width: 0; border-top: 1px solid var(--sg-border-soft); }
.sg-descendientes__fila { display: flex; align-items: flex-start; flex-wrap: wrap; gap: 8px; padding: 10px; }
.sg-descendientes__identidad { flex: 1 1 160px; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; overflow-wrap: anywhere; }
.sg-descendientes__espaciador { width: 32px; flex-shrink: 0; }
.sg-descendientes__item > .sg-descendientes { margin-left: 20px; border-left: 2px solid var(--sg-border-soft); }
.sg-row-btn { text-align: left; white-space: normal; overflow-wrap: anywhere; }
@media (max-width: 599.98px) {
  .sg-descendientes__item > .sg-descendientes { margin-left: 8px; }
  .sg-descendientes__fila > .sg-chips { margin-left: 40px; }
}
</style>
