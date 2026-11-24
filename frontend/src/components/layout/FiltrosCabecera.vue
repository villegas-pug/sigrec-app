<template>
  <!-- SPEC 052: filtros de cabecera, con la referencia visual de sigeif-app. Se aplican al instante. -->
  <section class="sg-page sg-filtros-cabecera" aria-label="Filtros de cabecera">
    <div class="sg-page__inner">
      <div class="sg-filtros-cabecera__fila sg-filtros-cabecera__entidad">
        <q-input :model-value="TIPO_ENTIDAD" label="Tipo de Entidad" outlined dense stack-label hide-bottom-space disable bg-color="grey-2" />
        <q-input :model-value="ENTIDAD" label="Entidad" outlined dense stack-label hide-bottom-space disable bg-color="grey-2" :title="ENTIDAD" />
      </div>
      <div class="sg-filtros-cabecera__fila sg-filtros-cabecera__filtros">
        <!-- SPEC 055: informativo y de solo lectura; no filtra datos. -->
        <q-select :model-value="linea?.id ?? null" :options="opcionesLinea" option-value="id" option-label="nombre" emit-value map-options
                  outlined dense stack-label hide-bottom-space readonly label="Línea de intervención"
                  :placeholder="cargandoLinea ? 'Cargando…' : errorLinea ? 'No disponible' : ''" :title="linea?.nombre" />
        <q-input :model-value="nombreCentro" label="Centro de Acogida Residencial" outlined dense stack-label readonly placeholder="Todos los centros"
                 class="cursor-pointer" :title="nombreCentro" @click="buscador = true" @keydown.enter.prevent="buscador = true">
          <template #append>
            <q-btn v-if="filtros.centro" flat round dense icon="cancel" aria-label="Quitar centro (todos los centros)" title="Todos los centros" @click.stop="fijarCentro(null)" />
            <q-btn flat round dense icon="search" aria-label="Buscar centro" title="Buscar centro" @click.stop="buscador = true" />
          </template>
        </q-input>
        <q-select :model-value="filtros.anio" :options="anios" emit-value map-options outlined dense label="Año" @update:model-value="fijarAnio" />
      </div>
      <q-linear-progress v-if="recargando" indeterminate color="primary" aria-label="Actualizando datos" />
    </div>
    <centro-buscador-dialog v-model="buscador" @seleccionar="({ codigo, nombre }) => fijarCentro(codigo, nombre)" />
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import CentroBuscadorDialog from 'components/centros/CentroBuscadorDialog.vue'
import { ENTIDAD, TIPO_ENTIDAD, useFiltrosCabecera } from 'src/composables/useFiltrosCabecera'
import { carPorId } from 'src/services/datos'
import { useLineaIntervencion } from 'src/composables/useLineaIntervencion'

defineProps({ recargando: Boolean })

const { linea, cargando: cargandoLinea, error: errorLinea } = useLineaIntervencion()
const opcionesLinea = computed(() => (linea.value ? [linea.value] : []))

const { filtros, fijarCentro, fijarAnio, opcionesAnio } = useFiltrosCabecera()
const buscador = ref(false)
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
.sg-filtros-cabecera > .sg-page__inner { gap: 8px; }
.sg-filtros-cabecera__fila { display: grid; gap: 12px; }
.sg-filtros-cabecera__entidad { grid-template-columns: minmax(140px, 1fr) minmax(0, 5fr); }
.sg-filtros-cabecera__filtros { grid-template-columns: minmax(0, 3fr) minmax(0, 3fr) minmax(0, 1fr); }

@media (max-width: 599.98px) {
  .sg-filtros-cabecera__entidad, .sg-filtros-cabecera__filtros { grid-template-columns: minmax(0, 1fr); }
}
</style>
