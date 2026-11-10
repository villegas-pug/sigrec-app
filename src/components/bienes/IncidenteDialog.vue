<template>
  <form-dialog :model-value="modelValue" :titulo="evento ? 'Actualizar incidente' : 'Registrar incidente'" :subtitulo="ubicacion" :ancho="1000" :modificado="modificado" :etiqueta-enviar="evento ? 'Guardar cambios' : 'Registrar incidente'" @update:model-value="$emit('update:modelValue', $event)" @enviar="guardar">
    <div v-if="contexto" class="sg-box" aria-label="Contexto fijo de la incidencia">
      <span v-if="contexto.padre">{{ contexto.padre.tipo === 'centro' ? 'Centro' : contexto.padre.tipo === 'ambiente' ? 'Ambiente' : 'Bien principal' }}: {{ contexto.padre.nombre }} · {{ contexto.padre.id }}</span>
      <strong>{{ etiquetas[origen.tipo] }}: {{ contexto.nombre }} · {{ origen.id }}</strong>
      <span class="sg-muted">Para registrar en otro recurso, cierre y seleccione su ficha.</span>
    </div>
    <div class="row q-col-gutter-md">
      <q-select v-model="form.tipo" class="col-12 col-sm-6" :options="opcionesTipo" emit-value map-options outlined dense label="Hecho *" :rules="[requerido]"><template #append><boton-dictado v-model="form.tipo" tipo="opcion" :opciones="opcionesTipo" emit-value /></template></q-select>
      <q-input v-model="form.fecha" class="col-12 col-sm-6" outlined dense type="date" stack-label label="Fecha del hecho *" :hint="HINT_FECHA_CORTE" :rules="[requerido, noFutura]"><template #append><boton-dictado v-model="form.fecha" tipo="fecha" /></template></q-input>
    </div>
    <q-input v-model="form.titulo" outlined dense label="Motivo *" :rules="[requerido]"><template #append><boton-dictado v-model="form.titulo" /></template></q-input>
    <q-input v-model="form.detalle" outlined dense type="textarea" autogrow label="Detalle"><template #append><boton-dictado v-model="form.detalle" /></template></q-input>
    <q-checkbox v-if="['centro', 'ambiente'].includes(origen?.tipo)" v-model="form.requiereEvaluacion" label="Requiere evaluación de infraestructura" />
    <p v-if="['centro', 'ambiente'].includes(origen?.tipo)" class="sg-muted">Genera seguimiento de infraestructura sin asignar un costo ni una reposición de bienes.</p>
    <selector-afectados v-if="origen?.tipo !== 'centro'" ref="selector" v-model="form.bienIds" v-model:evaluaciones="form.evaluaciones" v-model:condiciones="form.condiciones" :candidatos="recursos" :multiple="origen?.tipo === 'ambiente'" :permitir-condicion="!evento" />
    <p v-if="form.bienIds.length" class="sg-muted">Sí incorpora el recurso a Necesidades mientras esté activo; no registra una baja, reposición ni compra. Elegir «No» no elimina una necesidad por vida útil. Al dar de baja, el bien pasa al seguimiento informativo de reposición.</p>
    <template #resumen>{{ form.bienIds.length }} afectados · {{ selector?.ocultos ?? 0 }} fuera del filtro · {{ cantidadReposicion }} requieren reposición · {{ decisionesPendientes }} decisiones pendientes</template>
  </form-dialog>
</template>
<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import BotonDictado from 'components/common/BotonDictado.vue'
import SelectorAfectados from './SelectorAfectados.vue'
import { useBorrador } from 'src/composables/useBorrador'
import { usePerfil } from 'src/composables/usePerfil'
import { bienPorId, bienesDeAmbiente } from 'src/services/datos'
import { contextoIncidencia, origenIncidencia, requiereReposicion, unidadesAfectadas } from 'src/services/incidencias'
import { actualizarIncidente, registrarIncidente } from 'src/services/acciones'
import { OPCIONES_INCIDENTE, OPCIONES_INCIDENCIA_INFRAESTRUCTURA } from 'src/config/catalogos'
import { FECHA_CORTE } from 'src/config/demo'
import { HINT_FECHA_CORTE, noFutura, requerido } from 'src/utils/validaciones'
const props = defineProps({ modelValue: Boolean, evento: Object, bien: Object, ambienteInicial: String, centroInicial: String, sugerencia: Object })
const emit = defineEmits(['update:modelValue', 'hecho'])
const $q = useQuasar()
const { puedeHacer, enAmbitoCar } = usePerfil()
const etiquetas = { centro: 'Centro', ambiente: 'Ambiente', bien: 'Bien', componente: 'Componente' }
const selector = ref(null)
const opcionesTipo = computed(() => ['centro', 'ambiente'].includes(origen.value?.tipo) ? OPCIONES_INCIDENCIA_INFRAESTRUCTURA : OPCIONES_INCIDENTE)
const origen = computed(() => props.evento ? origenIncidencia(props.evento) : props.bien ? { tipo: props.bien.asociadoA ? 'componente' : 'bien', id: props.bien.id } : props.ambienteInicial ? { tipo: 'ambiente', id: props.ambienteInicial } : props.centroInicial ? { tipo: 'centro', id: props.centroInicial } : null)
const contexto = computed(() => origen.value ? props.evento?.contextoOrigen ?? contextoIncidencia(origen.value) : null)
const ubicacion = computed(() => contexto.value ? `${etiquetas[origen.value.tipo]} · ${origen.value.id}` : '')
const form = reactive({ bienIds: [], evaluaciones: {}, condiciones: {}, requiereEvaluacion: false })
const { modificado, fijar } = useBorrador(form)
const candidatos = computed(() => contexto.value?.ambienteId ? bienesDeAmbiente(contexto.value.ambienteId).filter((b) => b.situacion === 'activo' || props.evento?.bienIds?.includes(b.id)) : [])
const recursos = computed(() => origen.value?.tipo === 'ambiente' ? [...new Map([...candidatos.value, ...(props.evento?.bienIds ?? []).map(bienPorId).filter(Boolean)].map((b) => [b.id, b])).values()] : props.bien ? [props.bien] : form.bienIds.map(bienPorId).filter(Boolean))
const decisionesPendientes = computed(() => form.bienIds.filter((id) => typeof form.evaluaciones[id]?.requiereReposicion !== 'boolean').length)
const cantidadReposicion = computed(() => form.bienIds.filter((id) => form.evaluaciones[id]?.requiereReposicion === true).length)
watch(() => form.bienIds, (ids) => {
  for (const id of ids) if (!form.evaluaciones[id]) form.evaluaciones[id] = { requiereReposicion: null, unidades: bienPorId(id).cantidad ?? 1 }
}, { flush: 'sync' })
watch(() => props.modelValue, (abierto) => {
  if (!abierto || !origen.value) return
  const e = props.evento
  const ids = e ? [...e.bienIds] : props.bien ? [props.bien.id] : []
  Object.assign(form, { tipo: e?.tipo ?? props.sugerencia?.tipo ?? 'dano', fecha: e?.fecha ?? FECHA_CORTE, titulo: e?.titulo ?? props.sugerencia?.titulo ?? '', detalle: e?.detalle ?? props.sugerencia?.detalle ?? '', requiereEvaluacion: e?.requiereEvaluacion ?? props.sugerencia?.requiereEvaluacion ?? false, condiciones: {}, evaluaciones: {} })
  form.bienIds = ids
  for (const id of ids) form.evaluaciones[id] = { requiereReposicion: e ? requiereReposicion(e, id) : null, unidades: e ? unidadesAfectadas(e, bienPorId(id)) : bienPorId(id).cantidad ?? 1 }
  fijar()
})
async function guardar () {
  if (selector.value && !(await selector.value.validar())) return
  const permiso = ['centro', 'ambiente'].includes(origen.value?.tipo) ? `${origen.value.tipo}.incidente` : 'bien.incidente'
  if (!contexto.value || !enAmbitoCar(contexto.value.carId) || !puedeHacer(permiso) || (props.evento && !puedeHacer('incidente.actualizar'))) return
  try {
    const datos = { ...form, origen: origen.value }
    const e = props.evento ? (actualizarIncidente(props.evento, datos), props.evento) : registrarIncidente(datos)
    $q.notify({ type: 'positive', message: `${props.evento ? 'Incidente actualizado' : 'Incidente registrado'}: ${e.titulo} · ${e.id}.` })
    emit('update:modelValue', false); emit('hecho', e.id)
  } catch (error) { $q.notify({ type: 'negative', message: error.message }) }
}
</script>
