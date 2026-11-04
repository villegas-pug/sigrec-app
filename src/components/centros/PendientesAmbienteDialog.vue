<template>
  <div>
    <q-dialog :model-value="modelValue" :maximized="$q.screen.lt.sm" @update:model-value="$emit('update:modelValue', $event)">
      <q-card class="sg-dialog" :style="{ width: '720px' }">
        <q-card-section class="sg-dialog__header">
          <h2 class="text-h6 text-weight-bold q-my-none">Resolver los bienes antes de anular el ambiente</h2>
          <p class="sg-muted q-mb-none">{{ ambiente.nombre }} · {{ ambiente.id }}</p>
        </q-card-section>

        <q-card-section class="sg-dialog__body column q-gutter-y-md">
          <note-banner v-if="pendientes.length" tono="wa" icono="block">
            <strong>No se puede anular todavía.</strong>
            {{ plural(pendientes.length, 'bien o componente asociado sigue', 'bienes o componentes asociados siguen') }} en el ambiente.
            Reubique o dé de baja cada uno. Nada se da de baja automáticamente y los antecedentes se conservan.
          </note-banner>
          <note-banner v-else tono="in" icono="task_alt">
            Todos los bienes quedaron resueltos. Ya puede continuar con la anulación del ambiente.
          </note-banner>

          <div v-for="b in pendientes" :key="b.id" class="sg-box" :class="{ 'sg-box--dashed': b.revisionPendiente }">
            <div class="sg-chips items-center">
              <span class="text-weight-bold">{{ b.nombre }} · {{ b.id }}</span>
              <status-chip v-bind="condicion(b.condicion)" />
              <status-chip v-bind="SITUACIONES[b.situacion]" />
              <status-chip v-if="b.revisionPendiente" tono="wa" label="Situación por revisar" />
            </div>
            <span v-if="b.asociadoA" class="sg-muted">Componente de {{ b.asociadoA.bienId }} ({{ b.asociadoA.posicion ?? 'posición no informada' }})</span>
            <span v-if="hijosDe(b).length" class="sg-muted">
              {{ plural(hijosDe(b).length, 'componente asociado', 'componentes asociados') }}: {{ hijosDe(b).map((h) => h.id).join(', ') }}. Si reubica este bien, viajan con él.
            </span>
            <div class="row items-center q-gutter-sm">
              <q-btn v-if="b.situacion === 'activo' && puedeHacer('bien.trasladar')" dense outline no-caps color="secondary" icon="swap_horiz" label="Reubicar" :disable="!hayDestino" @click="abrirTraslado(b)" />
              <q-btn v-if="b.situacion === 'activo' && puedeHacer('bien.baja')" dense outline no-caps color="negative" icon="remove_circle" label="Dar de baja" @click="abrirBaja(b)" />
              <q-btn v-if="b.situacion !== 'activo' && b.revisionPendiente && puedeHacer('bien.baja')" dense outline no-caps color="secondary" icon="task_alt" label="Cerrar revisión" @click="cerrarRevision(b)" />
              <q-btn v-if="puedeAcceder('centros')" flat dense no-caps color="secondary" icon="visibility" label="Ver ficha" :to="{ name: 'centros', query: { bien: b.id } }" />
            </div>
          </div>
          <p v-if="pendientes.length && !hayDestino" class="sg-muted q-mb-none">El centro no tiene otros ambientes vigentes: registre uno para poder reubicar los bienes.</p>
        </q-card-section>

        <q-card-actions align="right" class="sg-dialog__footer q-px-md q-pb-md">
          <q-btn flat color="secondary" icon="close" label="Cerrar" v-close-popup />
          <q-btn unelevated color="negative" icon="block" label="Continuar con la anulación" :disable="pendientes.length > 0" @click="continuar" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <bien-edicion-dialog v-if="accion.bien" v-model="accion.traslado" modo="traslado" :bien="accion.bien" />
    <bien-accion-dialog v-model="accion.baja" modo="baja" :bien="accion.bien" />
  </div>
</template>

<script setup>
// Antes de anular un ambiente hay que resolver sus bienes uno por uno: reubicarlos (con sus componentes) o darlos de baja.
// La lista se recalcula sola; con la lista vacía se puede continuar con la anulación.
import { computed, nextTick, reactive } from 'vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import StatusChip from 'components/common/StatusChip.vue'
import BienEdicionDialog from 'components/bienes/BienEdicionDialog.vue'
import BienAccionDialog from 'components/bienes/BienAccionDialog.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { ambientesDeCar, db } from 'src/services/datos'
import { cerrarRevision, pendientesDeAmbiente } from 'src/services/acciones'
import { SITUACIONES, condicion } from 'src/config/catalogos'
import { plural } from 'src/utils/formato'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  ambiente: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue', 'continuar'])
const { puedeAcceder, puedeHacer } = usePerfil()

const pendientes = computed(() => pendientesDeAmbiente(props.ambiente))
const hijosDe = (bien) => db.bienes.filter((b) => b.asociadoA?.bienId === bien.id && b.situacion === 'activo')
const hayDestino = computed(() => ambientesDeCar(props.ambiente.carId).some((a) => a.id !== props.ambiente.id))

const accion = reactive({ bien: null, traslado: false, baja: false })

// El diálogo de traslado se monta con el bien ya elegido y se abre en el siguiente ciclo, para que cargue sus valores.
async function abrirTraslado (bien) {
  accion.bien = bien
  await nextTick()
  accion.traslado = true
}

function abrirBaja (bien) {
  Object.assign(accion, { bien, baja: true })
}

function continuar () {
  emit('update:modelValue', false)
  emit('continuar')
}
</script>
