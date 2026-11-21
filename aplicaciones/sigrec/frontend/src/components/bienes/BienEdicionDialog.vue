<template>
  <form-dialog
    :model-value="modelValue"
    :titulo="TITULOS[modo]"
    :subtitulo="`${bien.nombre} · ${bien.id}`"
    :ancho="640"
    :modificado="modificado"
    @update:model-value="$emit('update:modelValue', $event)"
    @enviar="guardar"
  >
    <template v-if="modo === 'datos'">
      <div class="row q-col-gutter-md">
        <q-input v-model="form.nombre" class="col-12 col-sm-6" outlined dense label="Nombre *" :rules="[requerido]">
          <template #append><boton-dictado v-model="form.nombre" /></template>
        </q-input>
        <q-input v-model="form.codigoPatrimonial" class="col-12 col-sm-6" outlined dense label="Código patrimonial" hint="Vacío si no tiene">
          <template #append><boton-dictado v-model="form.codigoPatrimonial" tipo="codigo" /></template>
        </q-input>
        <q-input v-model="form.marcaModelo" class="col-12 col-sm-6" outlined dense label="Marca y modelo">
          <template #append><boton-dictado v-model="form.marcaModelo" /></template>
        </q-input>
        <q-input v-model="form.serie" class="col-12 col-sm-6" outlined dense label="Serie">
          <template #append><boton-dictado v-model="form.serie" tipo="codigo" /></template>
        </q-input>
        <q-input v-model.number="form.cantidad" class="col-12 col-sm-6" outlined dense type="number" min="1" label="Cantidad *" :rules="[minimo(1)]">
          <template #append><boton-dictado v-model="form.cantidad" tipo="numero" /></template>
        </q-input>
      </div>
      <div>
        <condicion-selector v-model="form.condicion" etiqueta="Condición" />
        <div class="sg-muted q-mt-xs">Un cambio de condición queda en los antecedentes del bien.</div>
      </div>
      <q-input v-model="form.deterioro" outlined dense type="textarea" autogrow label="Deterioro observado">
        <template #append><boton-dictado v-model="form.deterioro" /></template>
      </q-input>
      <campo-adquisicion v-model="form.fechaAdquisicion" label="Adquisición" hint="Indique solo lo que conoce. Vacío si se desconoce" />
      <div class="row q-col-gutter-md">
        <q-input v-model.number="form.costo" class="col-12 col-sm-6" outlined dense type="number" min="0" label="Costo original (S/)" hint="Dato histórico; no es el precio referencial">
          <template #append><boton-dictado v-model="form.costo" tipo="numero" /></template>
        </q-input>
        <q-input v-model.number="form.vidaUtilAnios" class="col-12 col-sm-6" outlined dense type="number" min="1" label="Vida útil (años)">
          <template #append><boton-dictado v-model="form.vidaUtilAnios" tipo="numero" /></template>
        </q-input>
      </div>
    </template>

    <template v-else-if="modo === 'componente'">
      <q-select
        v-model="form.padreId"
        :options="opcionesPadre"
        emit-value
        map-options
        outlined
        dense
        label="Forma parte de *"
        hint="Solo bienes activos del mismo ambiente que no sean componentes. Un componente no admite componentes"
        :rules="[requerido]">
        <template #append><boton-dictado v-model="form.padreId" tipo="opcion" :opciones="opcionesPadre" emit-value /></template>
      </q-select>
      <q-input v-model="form.posicion" outlined dense label="Posición" placeholder="Ej.: Cama inferior, silla 3">
        <template #append><boton-dictado v-model="form.posicion" /></template>
      </q-input>
      <p v-if="!opcionesPadre.length" class="sg-muted q-mb-none">No hay otros bienes activos en el ambiente a los que pueda asociarse (un componente no puede asociarse a otro componente, ni un bien con componentes pasar a serlo).</p>
    </template>

    <template v-else>
      <q-select
        v-model="form.ambienteId"
        :options="opcionesAmbiente"
        emit-value
        map-options
        outlined
        dense
        label="Ambiente de destino *"
        hint="Del mismo centro (cualquier módulo)"
        :rules="[requerido]">
        <template #append><boton-dictado v-model="form.ambienteId" tipo="opcion" :opciones="opcionesAmbiente" emit-value /></template>
      </q-select>
      <q-input v-model="form.fecha" outlined dense type="date" stack-label label="Fecha del traslado *" :rules="[requerido, noFutura]">
        <template #append><boton-dictado v-model="form.fecha" tipo="fecha" /></template>
      </q-input>
      <note-banner v-if="bien.asociadoA" tono="wa" icono="warning">
        Este bien es componente de {{ bien.asociadoA.bienId }}. Al trasladarlo por separado deja de ser su componente.
      </note-banner>
      <note-banner v-else-if="componentes.length" tono="in">
        Se trasladan también sus componentes: {{ componentes.map((c) => c.id).join(', ') }}.
      </note-banner>
      <p v-if="!opcionesAmbiente.length" class="sg-muted q-mb-none">El centro no tiene otros ambientes vigentes. Registre uno antes de trasladar el bien.</p>
    </template>
  </form-dialog>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import CondicionSelector from 'components/common/CondicionSelector.vue'
import CampoAdquisicion from 'components/common/CampoAdquisicion.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import { useBorrador } from 'src/composables/useBorrador'
import { ambientesDeCar, bienesDeAmbiente, opcionesAmbientes, ubicacionDeBien } from 'src/services/datos'
import { actualizarBien, asociarBien, numeroONulo, puedeAsociar, trasladarBien } from 'src/services/acciones'
import { asociacionesDeBien } from 'src/services/bienes'
import { FECHA_CORTE } from 'src/config/demo'
import { minimo, noFutura, requerido } from 'src/utils/validaciones'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // 'datos' corrige la información del bien; 'componente' lo asocia a otro bien; 'traslado' lo lleva a otro ambiente.
  modo: { type: String, required: true },
  bien: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue', 'hecho'])
const $q = useQuasar()

const TITULOS = {
  datos: 'Actualizar información',
  componente: 'Asociar a otro bien',
  traslado: 'Trasladar a otro ambiente'
}

const form = reactive({})
const { modificado, fijar } = useBorrador(form)

const opcionesPadre = computed(() =>
  bienesDeAmbiente(props.bien.ambienteId)
    .filter((b) => puedeAsociar(props.bien, b))
    .map((b) => ({ label: `${b.nombre} · ${b.id}`, value: b.id }))
)

const opcionesAmbiente = computed(() =>
  opcionesAmbientes(ambientesDeCar(ubicacionDeBien(props.bien).car.id).filter((a) => a.id !== props.bien.ambienteId))
)

const componentes = computed(() => asociacionesDeBien(props.bien).hijos)

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  const b = props.bien
  Object.assign(form, {
    nombre: b.nombre,
    codigoPatrimonial: b.codigoPatrimonial ?? '',
    marcaModelo: b.marcaModelo ?? '',
    serie: b.serie ?? '',
    cantidad: b.cantidad ?? 1,
    condicion: b.condicion,
    deterioro: b.deterioro ?? '',
    fechaAdquisicion: b.adquisicion?.fecha ?? '',
    costo: b.adquisicion?.costo ?? null,
    vidaUtilAnios: b.vidaUtilAnios ?? null,
    padreId: b.asociadoA?.bienId ?? null,
    posicion: b.asociadoA?.posicion ?? '',
    ambienteId: null,
    fecha: FECHA_CORTE
  })
  fijar()
})

function guardar () {
  let mensaje
  if (props.modo === 'datos') {
    actualizarBien(props.bien, {
      nombre: form.nombre,
      codigoPatrimonial: form.codigoPatrimonial || null,
      marcaModelo: form.marcaModelo || null,
      serie: form.serie || null,
      cantidad: numeroONulo(form.cantidad) ?? 1,
      condicion: form.condicion,
      deterioro: form.deterioro || null,
      adquisicion: { fecha: form.fechaAdquisicion || null, costo: numeroONulo(form.costo) },
      vidaUtilAnios: numeroONulo(form.vidaUtilAnios)
    })
    mensaje = 'Información del bien actualizada.'
  } else if (props.modo === 'componente') {
    asociarBien(props.bien, form.padreId, form.posicion)
    mensaje = 'Componente asociado.'
  } else {
    trasladarBien(props.bien, form.ambienteId, { fecha: form.fecha })
    mensaje = 'Bien trasladado. El traslado queda en sus antecedentes.'
  }
  $q.notify({ type: 'positive', message: mensaje })
  emit('update:modelValue', false)
  emit('hecho', props.bien.id)
}
</script>
