<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #acciones>
          <q-btn outline color="secondary" icon="edit" label="Actualizar ficha" :disable="!local" @click="abrirEdicion" />
          <q-btn unelevated color="primary" icon="add_a_photo" label="Incorporar fotografía" :disable="!local" @click="avisarFoto" />
        </template>
      </page-header>

      <div class="sg-split">
        <section-card titulo="Centros" :subtitulo="perfil.ambito.descripcion" sin-relleno>
          <div class="q-px-md q-pb-md">
            <q-input v-model="busqueda" dense outlined clearable label="Buscar CAR o local" />
          </div>
          <button
            v-for="car in carsFiltrados"
            :key="car.id"
            type="button"
            class="sg-list-btn"
            :aria-current="car.id === carId ? 'true' : 'false'"
            @click="carId = car.id"
          >
            <span class="text-weight-bold">{{ car.nombre }}</span>
            <span v-for="l in localesDeCar(car.id)" :key="l.id" class="sg-muted">{{ l.id }} · {{ l.nombre }}</span>
            <span class="sg-chips">
              <status-chip
                v-for="l in localesDeCar(car.id)"
                :key="l.id"
                :tono="l.condicion === 'alquilado' ? 'in' : 'ne'"
                :label="l.condicion === 'alquilado' ? 'Alquilado' : 'Propio'"
              />
            </span>
          </button>
          <p v-if="!carsFiltrados.length" class="q-pa-md sg-muted">Sin resultados.</p>
        </section-card>

        <div v-if="local" class="column q-gutter-y-md">
          <section-card :titulo="`Ficha del local · ${local.id}`" :subtitulo="`Inmueble donde funciona ${car.nombre}. El centro y el inmueble se registran por separado.`">
            <template #acciones>
              <status-chip :tono="local.condicion === 'alquilado' ? 'in' : 'ne'" :label="local.condicion === 'alquilado' ? 'Alquilado' : 'Propio'" />
              <status-chip tono="pv" label="1 local por CAR · Por validar" />
            </template>
            <div class="sg-kv-grid">
              <key-value etiqueta="Dirección">{{ local.direccion }}</key-value>
              <key-value etiqueta="Referencia de fundación" :nota="local.fundacion.nota || ''">
                <template v-if="local.fundacion.referencia">{{ local.fundacion.referencia }}</template>
                <status-chip v-else tono="si" label="No informada" />
              </key-value>
              <key-value etiqueta="Condición del inmueble">{{ local.condicion === 'alquilado' ? 'Alquilado' : 'Propio' }}</key-value>
              <template v-if="local.condicion === 'alquilado'">
                <key-value etiqueta="Arrendador">
                  <template v-if="local.arrendador">{{ local.arrendador }}</template>
                  <status-chip v-else tono="si" label="Información pendiente" />
                </key-value>
                <key-value etiqueta="Contrato de alquiler">
                  <template v-if="local.contratoHasta">Vigente hasta el {{ fecha(local.contratoHasta) }}</template>
                  <status-chip v-else tono="si" label="Información pendiente" />
                </key-value>
              </template>
              <key-value etiqueta="Litigios" :nota="local.litigios ? '' : 'No se ha informado si existen litigios'">
                <template v-if="local.litigios">{{ local.litigios }}</template>
                <status-chip v-else tono="si" label="Información pendiente" />
              </key-value>
            </div>
          </section-card>

          <section-card titulo="Construcción e infraestructura">
            <div class="sg-kv-grid">
              <key-value etiqueta="Material de construcción">{{ local.construccion.material }}</key-value>
              <key-value etiqueta="Antigüedad" :nota="local.construccion.antiguedadNota || ''">{{ local.construccion.antiguedad }}</key-value>
              <key-value etiqueta="Pisos">{{ local.construccion.pisos }}</key-value>
              <key-value etiqueta="Área construida">
                <template v-if="local.construccion.areaM2">{{ local.construccion.areaM2 }} m²</template>
                <status-chip v-else tono="si" label="No informada" />
              </key-value>
              <key-value etiqueta="Estado general">
                <status-chip v-bind="condicion(local.construccion.estado)" />
              </key-value>
              <key-value etiqueta="Última actualización" :nota="local.actualizado.por">{{ fecha(local.actualizado.fecha) }}</key-value>
              <key-value etiqueta="Características">{{ local.construccion.caracteristicas }}</key-value>
            </div>
            <h3 class="sg-kv__label q-mt-lg q-mb-sm">Fotografías ({{ local.fotos.length }})</h3>
            <div v-if="local.fotos.length" class="sg-kv-grid">
              <div v-for="foto in local.fotos" :key="foto.titulo" class="sg-photo">
                <q-icon name="image" size="28px" aria-hidden="true" />
                <span>[Foto: {{ foto.titulo }}]</span>
                <span class="sg-muted">{{ fecha(foto.fecha) }}<template v-if="foto.nota"> · {{ foto.nota }}</template></span>
              </div>
            </div>
            <p v-else class="sg-muted">No hay fotografías registradas.</p>
            <p class="q-mt-md q-mb-none">
              <router-link :to="{ name: 'ambientes', query: { car: carId } }" class="text-weight-bold">Ver ambientes del local</router-link>
            </p>
          </section-card>
        </div>
      </div>
    </div>

    <q-dialog v-model="edicion.abierta">
      <q-card style="width: 560px; max-width: 92vw">
        <q-card-section>
          <h2 class="text-h6 text-weight-bold q-my-none">Actualizar ficha del local</h2>
          <p class="sg-muted q-mb-none">{{ local?.id }} · los campos vacíos quedan como información pendiente.</p>
        </q-card-section>
        <q-card-section class="column q-gutter-y-md">
          <q-option-group v-model="edicion.condicion" inline :options="[{ label: 'Propio', value: 'propio' }, { label: 'Alquilado', value: 'alquilado' }]" />
          <template v-if="edicion.condicion === 'alquilado'">
            <q-input v-model="edicion.arrendador" outlined dense label="Arrendador" />
            <q-input v-model="edicion.contratoHasta" outlined dense type="date" label="Contrato vigente hasta" stack-label />
          </template>
          <q-input v-model="edicion.litigios" outlined dense label="Litigios conocidos" />
          <q-input v-model.number="edicion.areaM2" outlined dense type="number" min="0" label="Área construida (m²)" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat color="secondary" label="Cancelar" v-close-popup />
          <q-btn unelevated color="primary" label="Guardar cambios" @click="guardarEdicion" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import KeyValue from 'components/common/KeyValue.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { carPorId, localesDeCar } from 'src/services/datos'
import { actualizarLocal } from 'src/services/acciones'
import { condicion } from 'src/config/catalogos'
import { fecha } from 'src/utils/formato'

const $q = useQuasar()
const route = useRoute()
const { perfil, carsEnAmbito, enAmbitoCar } = usePerfil()

const busqueda = ref('')
const carId = ref(enAmbitoCar(route.query.car) ? route.query.car : carsEnAmbito.value[0]?.id)

watch(carsEnAmbito, (cars) => {
  if (!cars.some((c) => c.id === carId.value)) carId.value = cars[0]?.id
})

const carsFiltrados = computed(() => {
  const t = (busqueda.value ?? '').toLowerCase()
  return carsEnAmbito.value.filter(
    (c) => !t || c.nombre.toLowerCase().includes(t) || localesDeCar(c.id).some((l) => l.id.toLowerCase().includes(t))
  )
})

const car = computed(() => carPorId(carId.value))
const local = computed(() => (carId.value ? localesDeCar(carId.value)[0] ?? null : null))

const edicion = reactive({ abierta: false, condicion: 'propio', arrendador: '', contratoHasta: '', litigios: '', areaM2: null })

function abrirEdicion () {
  Object.assign(edicion, {
    abierta: true,
    condicion: local.value.condicion,
    arrendador: local.value.arrendador ?? '',
    contratoHasta: local.value.contratoHasta ?? '',
    litigios: local.value.litigios ?? '',
    areaM2: local.value.construccion.areaM2
  })
}

function guardarEdicion () {
  const alquilado = edicion.condicion === 'alquilado'
  actualizarLocal(local.value, {
    condicion: edicion.condicion,
    arrendador: alquilado ? edicion.arrendador || null : null,
    contratoHasta: alquilado ? edicion.contratoHasta || null : null,
    litigios: edicion.litigios || null,
    construccion: { ...local.value.construccion, areaM2: edicion.areaM2 || null }
  })
  edicion.abierta = false
  $q.notify({ type: 'positive', message: 'Ficha del local actualizada.' })
}

function avisarFoto () {
  $q.notify({ type: 'info', message: 'Prototipo: la carga de fotografías se implementará con el almacenamiento definitivo.' })
}
</script>
