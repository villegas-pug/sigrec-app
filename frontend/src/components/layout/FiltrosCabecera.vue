<template>
  <!-- SPEC 052: filtros de cabecera, con la referencia visual de sigeif-app. Se aplican al instante. -->
  <section ref="barra" class="sg-page sg-filtros-cabecera" aria-label="Filtros de cabecera">
    <div class="sg-page__inner">
      <div class="sg-filters sg-filtros-cabecera__campos">
        <q-input :model-value="TIPO_ENTIDAD" label="Tipo de Entidad" outlined dense stack-label disable class="bg-grey-2" />
        <q-input :model-value="ENTIDAD" label="Entidad" outlined dense stack-label disable class="bg-grey-2 sg-filtros-cabecera__entidad" />
        <q-input :model-value="nombreCentro" label="Centro" outlined dense stack-label readonly placeholder="Todos los centros"
                 class="cursor-pointer" @click="buscador = true" @keydown.enter.prevent="buscador = true">
          <template #append>
            <q-btn v-if="filtros.centro" flat round dense icon="cancel" aria-label="Quitar centro (todos los centros)" title="Todos los centros" @click.stop="fijarCentro(null)" />
            <q-btn flat round dense icon="search" aria-label="Buscar centro" title="Buscar centro" @click.stop="buscador = true" />
          </template>
        </q-input>
        <q-select :model-value="filtros.anio" :options="anios" emit-value map-options outlined dense label="Año" @update:model-value="fijarAnio" />
        <q-select :model-value="filtros.mes" :options="OPCIONES_MES" emit-value map-options outlined dense label="Mes"
                  :disable="filtros.anio === TODOS" :hint="filtros.anio === TODOS ? 'Elija un año' : ''" @update:model-value="fijarMes" />
      </div>
      <q-linear-progress v-if="recargando" indeterminate color="primary" aria-label="Actualizando datos" />
    </div>
    <centro-buscador-dialog v-model="buscador" @seleccionar="({ codigo, nombre }) => fijarCentro(codigo, nombre)" />
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import CentroBuscadorDialog from 'components/centros/CentroBuscadorDialog.vue'
import { ENTIDAD, TIPO_ENTIDAD, useFiltrosCabecera } from 'src/composables/useFiltrosCabecera'
import { TODOS } from 'src/config/catalogos'
import { carPorId } from 'src/services/datos'

defineProps({ recargando: Boolean })

const { filtros, fijarCentro, fijarAnio, fijarMes, opcionesAnio, OPCIONES_MES } = useFiltrosCabecera()
const buscador = ref(false)
const barra = ref(null)

// La altura de la barra se publica en `--sg-filtros-alto` para las pantallas de alto fijo (explorador de Gestión de centros).
const raiz = document.documentElement.style
let observador = null
onMounted(() => {
  observador = new ResizeObserver(([entrada]) => raiz.setProperty('--sg-filtros-alto', `${Math.ceil(entrada.borderBoxSize?.[0]?.blockSize ?? entrada.target.offsetHeight)}px`))
  observador.observe(barra.value)
})
onBeforeUnmount(() => {
  observador?.disconnect()
  raiz.removeProperty('--sg-filtros-alto')
})
const anios = opcionesAnio()
// Un centro llegado por enlace (?car=) aún no trae nombre: se toma de los datos cargados.
const nombreCentro = computed(() => {
  if (!filtros.centro) return ''
  const nombre = filtros.centroNombre || carPorId(filtros.centro)?.nombre
  return nombre ? `${filtros.centro} · ${nombre}` : filtros.centro
})
</script>

<style scoped>
.sg-filtros-cabecera { padding-bottom: 0; }
.sg-filtros-cabecera__campos { grid-template-columns: minmax(140px, 1fr) minmax(260px, 2.4fr) minmax(240px, 2fr) minmax(120px, 0.8fr) minmax(140px, 1fr); }

@media (max-width: 1199.98px) {
  .sg-filtros-cabecera__campos { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
}
</style>
