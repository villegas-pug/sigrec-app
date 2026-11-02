<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #acciones>
          <q-btn v-if="puedeHacer('centro.registrar')" outline color="secondary" icon="add_business" label="Registrar centro" @click="dialogos.centro = true" />
          <q-btn v-if="puedeHacer('local.actualizar')" outline color="secondary" icon="edit" label="Actualizar ficha" :disable="!local" @click="dialogos.ficha = true" />
          <q-btn v-if="puedeHacer('local.foto')" unelevated color="primary" icon="add_a_photo" label="Incorporar fotografía" :disable="!local" @click="dialogos.foto = true" />
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
              <status-chip tono="ne" :label="plural(ambientesDeCar(car.id).length, 'ambiente', 'ambientes')" />
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
              <key-value etiqueta="Dirección">
                <template v-if="local.direccion">{{ local.direccion }}</template>
                <status-chip v-else tono="si" label="No informada" />
              </key-value>
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
              <key-value v-for="campo in camposConstruccion" :key="campo.etiqueta" :etiqueta="campo.etiqueta" :nota="campo.nota || ''">
                <template v-if="campo.valor != null && campo.valor !== ''">{{ campo.valor }}</template>
                <status-chip v-else tono="si" label="No informado" />
              </key-value>
              <key-value etiqueta="Estado general">
                <status-chip v-bind="condicion(local.construccion.estado)" />
              </key-value>
              <key-value etiqueta="Última actualización" :nota="local.actualizado.por">{{ fecha(local.actualizado.fecha) }}</key-value>
            </div>
            <h3 class="sg-kv__label q-mt-lg q-mb-sm">Fotografías ({{ local.fotos.length }})</h3>
            <div v-if="local.fotos.length" class="sg-kv-grid">
              <figure v-for="(foto, i) in local.fotos" :key="i" class="sg-photo q-ma-none">
                <img v-if="foto.url" :src="foto.url" :alt="foto.titulo" style="max-width: 100%; max-height: 160px; object-fit: cover; border-radius: 4px">
                <template v-else>
                  <q-icon name="image" size="28px" aria-hidden="true" />
                  <span>[Foto: {{ foto.titulo }}]</span>
                </template>
                <figcaption class="sg-muted text-center">
                  <template v-if="foto.url">{{ foto.titulo }} · </template>{{ fecha(foto.fecha) }}<template v-if="foto.nota"> · {{ foto.nota }}</template>
                </figcaption>
              </figure>
            </div>
            <p v-else class="sg-muted">No hay fotografías registradas.</p>
            <p class="q-mt-md q-mb-none">
              <router-link :to="{ name: 'ambientes', query: { car: carId } }" class="text-weight-bold">Ver ambientes del centro</router-link>
            </p>
          </section-card>
        </div>
      </div>
    </div>

    <centro-dialog v-model="dialogos.centro" @hecho="(id) => (carId = id)" />
    <local-ficha-dialog v-if="local" v-model="dialogos.ficha" :local="local" />
    <foto-dialog v-if="local" v-model="dialogos.foto" :local="local" />
  </q-page>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import KeyValue from 'components/common/KeyValue.vue'
import CentroDialog from 'components/centros/CentroDialog.vue'
import LocalFichaDialog from 'components/centros/LocalFichaDialog.vue'
import FotoDialog from 'components/centros/FotoDialog.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { ambientesDeCar, carPorId, localesDeCar } from 'src/services/datos'
import { condicion } from 'src/config/catalogos'
import { fecha, plural } from 'src/utils/formato'

const route = useRoute()
const { perfil, carsEnAmbito, enAmbitoCar, puedeHacer } = usePerfil()

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

const camposConstruccion = computed(() => {
  const c = local.value.construccion
  return [
    { etiqueta: 'Material de construcción', valor: c.material },
    { etiqueta: 'Antigüedad', valor: c.antiguedad, nota: c.antiguedadNota },
    { etiqueta: 'Pisos', valor: c.pisos },
    { etiqueta: 'Área construida', valor: c.areaM2 ? `${c.areaM2} m²` : null },
    { etiqueta: 'Características', valor: c.caracteristicas }
  ]
})

const dialogos = reactive({ centro: false, ficha: false, foto: false })
</script>
