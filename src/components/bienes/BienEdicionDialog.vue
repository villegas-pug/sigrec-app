<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="width: 640px; max-width: 94vw">
      <q-card-section>
        <h2 class="text-h6 text-weight-bold q-my-none">{{ modo === 'datos' ? 'Actualizar información' : 'Asociar a otro bien' }}</h2>
        <p class="sg-muted q-mb-none">{{ bien.nombre }} · {{ bien.id }}</p>
      </q-card-section>

      <q-card-section>
        <q-form class="column q-gutter-y-md" @submit="guardar">
          <template v-if="modo === 'datos'">
            <div class="row q-col-gutter-md">
              <q-input v-model="form.nombre" class="col-12 col-sm-6" outlined dense label="Nombre *" :rules="[(v) => !!v || 'Campo obligatorio']" />
              <q-input v-model="form.codigoPatrimonial" class="col-12 col-sm-6" outlined dense label="Código patrimonial" hint="Vacío si no tiene" />
              <q-input v-model="form.marcaModelo" class="col-12 col-sm-6" outlined dense label="Marca y modelo" />
              <q-input v-model="form.serie" class="col-12 col-sm-6" outlined dense label="Serie" />
              <q-input v-model.number="form.cantidad" class="col-12 col-sm-6" outlined dense type="number" min="1" label="Cantidad *" :rules="[(v) => v >= 1 || 'Mínimo 1']" />
            </div>
            <div>
              <div class="sg-kv__label q-mb-xs">Condición</div>
              <q-btn-toggle v-model="form.condicion" :options="OPCIONES_CONDICION" unelevated toggle-color="secondary" color="white" text-color="secondary" no-caps />
              <div class="sg-muted q-mt-xs">Un cambio de condición queda en los antecedentes del bien.</div>
            </div>
            <q-input v-model="form.deterioro" outlined dense type="textarea" autogrow label="Deterioro observado" />
            <div class="row q-col-gutter-md">
              <q-input v-model="form.fechaAdquisicion" class="col-12 col-sm-4" outlined dense type="month" stack-label label="Adquisición" hint="Vacío si se desconoce" />
              <q-input v-model.number="form.costo" class="col-12 col-sm-4" outlined dense type="number" min="0" label="Costo de adquisición (S/)" />
              <q-input v-model.number="form.vidaUtilAnios" class="col-12 col-sm-4" outlined dense type="number" min="1" label="Vida útil (años)" />
            </div>
          </template>

          <template v-else>
            <q-select
              v-model="form.padreId"
              :options="opcionesPadre"
              emit-value
              map-options
              outlined
              dense
              label="Forma parte de *"
              hint="Solo bienes activos del mismo ambiente que no sean componentes de este bien"
              :rules="[(v) => !!v || 'Seleccione el bien']"
            />
            <q-input v-model="form.posicion" outlined dense label="Posición" placeholder="Ej.: Cama inferior, silla 3" />
            <p v-if="!opcionesPadre.length" class="sg-muted q-mb-none">No hay otros bienes activos en el ambiente a los que pueda asociarse.</p>
          </template>

          <div class="row justify-end q-gutter-sm">
            <q-btn flat color="secondary" label="Cancelar" v-close-popup />
            <q-btn unelevated color="primary" type="submit" label="Guardar" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import { bienesDeAmbiente } from 'src/services/datos'
import { actualizarBien, asociarBien, numeroONulo, puedeAsociar } from 'src/services/acciones'
import { OPCIONES_CONDICION } from 'src/config/catalogos'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // 'datos' corrige la información del bien; 'componente' lo asocia a otro bien.
  modo: { type: String, required: true },
  bien: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue'])
const $q = useQuasar()

const form = reactive({})

const opcionesPadre = computed(() =>
  bienesDeAmbiente(props.bien.ambienteId)
    .filter((b) => puedeAsociar(props.bien, b))
    .map((b) => ({ label: `${b.nombre} · ${b.id}`, value: b.id }))
)

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
    posicion: b.asociadoA?.posicion ?? ''
  })
})

function guardar () {
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
    $q.notify({ type: 'positive', message: 'Información del bien actualizada.' })
  } else {
    asociarBien(props.bien, form.padreId, form.posicion)
    $q.notify({ type: 'positive', message: 'Componente asociado.' })
  }
  emit('update:modelValue', false)
}
</script>
