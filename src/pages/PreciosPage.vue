<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header />

      <note-banner tono="in">
        El precio referencial es el precio esperado de reposición y no el costo original de adquisición. Su fuente y vigencia están por definir.
      </note-banner>

      <div class="sg-filters">
        <q-input v-model="texto" outlined dense clearable label="Buscar tipo de bien" />
        <q-select v-model="filtro" :options="OPCIONES_FILTRO" emit-value map-options outlined dense label="Mostrar" />
      </div>

      <section-card titulo="Precios por tipo de bien" :subtitulo="`Necesidades del ${ANIO_REVISION} · ${perfil.ambito.descripcion}`" sin-relleno>
        <div class="sg-table-wrap">
          <table class="sg-table">
            <thead>
              <tr>
                <th scope="col">Tipo de bien</th>
                <th scope="col" class="sg-num">Precio referencial</th>
                <th scope="col">Fecha</th>
                <th scope="col">Procedencia</th>
                <th scope="col" class="sg-num">Necesidades que lo usan</th>
                <th scope="col"><span class="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="fila in filas" :key="fila.tipo.id">
                <td>{{ fila.tipo.nombre }}</td>
                <td class="sg-num">
                  <template v-if="fila.tipo.precio != null">{{ soles(fila.tipo.precio) }}</template>
                  <status-chip v-else tono="wa" label="Sin precio" />
                </td>
                <td>
                  <template v-if="fila.tipo.fechaPrecio">{{ fecha(fila.tipo.fechaPrecio) }}</template>
                  <status-chip v-else tono="si" label="No informada" />
                </td>
                <td>
                  <template v-if="fila.tipo.procedencia">{{ fila.tipo.procedencia }}</template>
                  <status-chip v-else tono="si" label="No informada" />
                </td>
                <td class="sg-num">
                  <template v-if="fila.necesidades">{{ fila.necesidades }} ({{ plural(fila.unidades, 'unidad', 'unidades') }})</template>
                  <span v-else class="sg-muted">—</span>
                </td>
                <td class="text-right">
                  <q-btn v-if="puedeHacer('precio.informar')" flat dense color="secondary" icon="edit" label="Informar precio" @click="abrir(fila.tipo)" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section-card>
    </div>

    <q-dialog v-model="dialogo.abierto">
      <q-card style="width: 480px; max-width: 92vw">
        <q-card-section>
          <h2 class="text-h6 text-weight-bold q-my-none">Informar precio referencial</h2>
          <p class="sg-muted q-mb-none">{{ dialogo.tipo?.nombre }}</p>
        </q-card-section>
        <q-card-section>
          <q-form class="column q-gutter-y-md" @submit="guardar">
            <q-input v-model.number="dialogo.precio" outlined dense type="number" min="0" step="0.01" label="Precio (S/) *" :rules="[(v) => Number.isFinite(v) && v > 0 || 'Indique un precio mayor que cero']" />
            <q-input v-model="dialogo.fechaPrecio" outlined dense type="month" stack-label label="Fecha del precio" />
            <q-input v-model="dialogo.procedencia" outlined dense label="Procedencia (cotización, catálogo, factura…)" />
            <div class="row justify-end q-gutter-sm">
              <q-btn flat color="secondary" label="Cancelar" v-close-popup />
              <q-btn unelevated color="primary" type="submit" label="Guardar precio" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { db } from 'src/services/datos'
import { calcularNecesidades } from 'src/services/necesidades'
import { informarPrecio } from 'src/services/acciones'
import { ANIO_REVISION, FECHA_CORTE } from 'src/config/demo'
import { fecha, plural, soles } from 'src/utils/formato'

const OPCIONES_FILTRO = [
  { label: 'Todos los tipos', value: 'todos' },
  { label: 'Usados por necesidades', value: 'usados' },
  { label: 'Necesidades sin precio', value: 'faltantes' }
]

const $q = useQuasar()
const { perfil, carIdsEnAmbito, puedeHacer } = usePerfil()

const texto = ref('')
const filtro = ref('todos')

const pendientes = computed(() => calcularNecesidades({ anio: ANIO_REVISION, carIds: carIdsEnAmbito.value }).pendientes)

const filas = computed(() => {
  const t = (texto.value ?? '').toLowerCase()
  return db.tiposBien
    .map((tipo) => {
      const usan = pendientes.value.filter((n) => n.bien.tipoId === tipo.id)
      return { tipo, necesidades: usan.length, unidades: usan.reduce((s, n) => s + n.cantidad, 0) }
    })
    .filter((f) => !t || f.tipo.nombre.toLowerCase().includes(t))
    .filter((f) => filtro.value === 'todos' || (f.necesidades > 0 && (filtro.value === 'usados' || f.tipo.precio == null)))
    .sort((a, b) => b.necesidades - a.necesidades || a.tipo.nombre.localeCompare(b.tipo.nombre))
})

const dialogo = reactive({ abierto: false, tipo: null, precio: null, fechaPrecio: '', procedencia: '' })

function abrir (tipo) {
  Object.assign(dialogo, {
    abierto: true,
    tipo,
    precio: tipo.precio,
    fechaPrecio: tipo.fechaPrecio ?? FECHA_CORTE.slice(0, 7),
    procedencia: tipo.procedencia ?? ''
  })
}

function guardar () {
  informarPrecio(dialogo.tipo, dialogo)
  dialogo.abierto = false
  $q.notify({ type: 'positive', message: `Precio de «${dialogo.tipo.nombre}» actualizado. Las necesidades se recalculan.` })
}
</script>
