<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #acciones>
          <q-btn outline color="secondary" icon="download" label="Exportar CSV" :disable="!filas.length" @click="exportar" />
          <q-btn v-if="puedeAcceder('necesidades')" unelevated color="primary" icon="assignment" label="Ver necesidades" :to="{ name: 'necesidades', query: carId === TODOS ? {} : { car: carId } }" />
        </template>
      </page-header>

      <div class="sg-filters">
        <q-select v-model="carId" :options="opcionesCar" emit-value map-options outlined dense label="Centro">
          <template #append><boton-dictado v-model="carId" tipo="opcion" :opciones="opcionesCar" emit-value /></template>
        </q-select>
        <q-select v-model="agruparPor" :options="OPCIONES_AGRUPACION" emit-value map-options outlined dense label="Agrupar por">
          <template #append><boton-dictado v-model="agruparPor" tipo="opcion" :opciones="OPCIONES_AGRUPACION" emit-value /></template>
        </q-select>
        <q-select v-model="categoria" :options="OPCIONES_FILTRO_CATEGORIA" emit-value map-options outlined dense label="Categoría">
          <template #append><boton-dictado v-model="categoria" tipo="opcion" :opciones="OPCIONES_FILTRO_CATEGORIA" emit-value /></template>
        </q-select>
        <q-select v-model="anio" :options="ANIOS_REVISION" outlined dense label="Año a revisar">
          <template #append><boton-dictado v-model="anio" tipo="opcion" :opciones="ANIOS_REVISION" /></template>
        </q-select>
      </div>

      <note-banner tono="in">
        Cantidades de bienes <strong>activos</strong> (los componentes cuentan como bienes del ambiente). El valor aproximado es el precio referencial del
        catálogo × la cantidad: no es valor contable ni aprueba compras. Las unidades sin precio referencial se informan aparte y nunca se cuentan como cero.
        Las necesidades del año son las mismas de la pantalla Necesidades.
      </note-banner>

      <div class="sg-kpi-panel">
        <kpi-card icono="inventory_2" tono="azul" :valor="numero(total.cantidad)" etiqueta="Unidades activas" :nota="`${agruparPor === 'tipo' ? plural(total.tipos, 'tipo de bien', 'tipos de bien') : plural(total.tipos, 'categoría', 'categorías')} · ${tituloAmbito}`" />
        <kpi-card icono="payments" tono="verde" :valor="soles(total.valorConocido)" etiqueta="Valor aproximado conocido" :nota="total.unidadesSinValorar ? `${plural(total.unidadesSinValorar, 'unidad sin precio', 'unidades sin precio')} no suman` : 'Todas las unidades tienen precio'" />
        <kpi-card icono="build_circle" tono="ambar" :valor="numero(total.porCondicion.malo + total.porCondicion.inservible)" etiqueta="En mal estado" nota="Condición mala o inservible" />
        <kpi-card icono="assignment_late" tono="rojo" :valor="numero(total.necesidad.unidades)" :etiqueta="`Unidades a renovar o reponer ${anio}`" :nota="`${soles(total.necesidad.importeConocido)} conocido · ${total.necesidad.sinValorar} sin valorar`" />
      </div>

      <section-card :titulo="`Inventario por ${agruparPor === 'tipo' ? 'tipo de bien' : 'categoría'} · ${tituloAmbito}`" :subtitulo="`${plural(filas.length, 'fila', 'filas')} · necesidades ${anio}`" sin-relleno>
        <div v-if="!compacto" class="sg-table-wrap">
          <table class="sg-table">
            <thead>
              <tr>
                <th scope="col">{{ agruparPor === 'tipo' ? 'Tipo de bien' : 'Categoría' }}</th>
                <th scope="col" class="sg-num">Cantidad</th>
                <th v-for="c in COLUMNAS_CONDICION" :key="c.clave" scope="col" class="sg-num">{{ c.label }}</th>
                <th scope="col" class="sg-num">Valor aproximado</th>
                <th scope="col" class="sg-num">Necesidad {{ anio }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="f in filas" :key="f.clave">
                <td>
                  <span class="text-weight-bold">{{ f.nombre }}</span>
                  <div v-if="agruparPor === 'tipo' && f.categoria" class="sg-muted">{{ CATEGORIAS[f.categoria] }}</div>
                </td>
                <td class="sg-num text-weight-bold">{{ numero(f.cantidad) }}</td>
                <td v-for="c in COLUMNAS_CONDICION" :key="c.clave" class="sg-num"><span :class="{ 'sg-muted': !f.porCondicion[c.clave] }">{{ f.porCondicion[c.clave] }}</span></td>
                <td class="sg-num">
                  <status-chip v-if="estadoValoracion(f) === 'sin_valorar'" tono="wa" label="Sin valorar" />
                  <template v-else>
                    {{ soles(f.valorConocido) }}
                    <div v-if="estadoValoracion(f) === 'parcial'" class="sg-muted">+ {{ plural(f.unidadesSinValorar, 'unidad sin precio', 'unidades sin precio') }}</div>
                  </template>
                </td>
                <td class="sg-num"><necesidad-inventario :necesidad="f.necesidad" /></td>
              </tr>
              <tr v-if="filas.length" class="sg-row--total">
                <td>Total</td>
                <td class="sg-num">{{ numero(total.cantidad) }}</td>
                <td v-for="c in COLUMNAS_CONDICION" :key="c.clave" class="sg-num">{{ total.porCondicion[c.clave] }}</td>
                <td class="sg-num">{{ soles(total.valorConocido) }}<div v-if="total.unidadesSinValorar" class="sg-muted">+ {{ plural(total.unidadesSinValorar, 'unidad sin precio', 'unidades sin precio') }}</div></td>
                <td class="sg-num"><necesidad-inventario :necesidad="total.necesidad" /></td>
              </tr>
              <tr v-else><td :colspan="COLUMNAS_CONDICION.length + 4" class="sg-muted">Sin bienes activos para los filtros seleccionados.</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Móvil y tableta: una tarjeta por fila. -->
        <div v-else class="column q-gutter-y-md q-px-md q-pb-md">
          <div v-for="f in filas" :key="f.clave" class="sg-box">
            <span class="text-weight-bold">{{ f.nombre }}</span>
            <span v-if="agruparPor === 'tipo' && f.categoria" class="sg-muted">{{ CATEGORIAS[f.categoria] }}</span>
            <span>Cantidad: <strong>{{ numero(f.cantidad) }}</strong></span>
            <div class="sg-chips">
              <template v-for="c in COLUMNAS_CONDICION" :key="c.clave">
                <status-chip v-if="f.porCondicion[c.clave]" v-bind="condicion(c.clave === 'sin_dato' ? null : c.clave)" :label="`${c.label}: ${f.porCondicion[c.clave]}`" />
              </template>
            </div>
            <span>
              Valor aproximado:
              <status-chip v-if="estadoValoracion(f) === 'sin_valorar'" tono="wa" label="Sin valorar" />
              <template v-else>{{ soles(f.valorConocido) }}<template v-if="estadoValoracion(f) === 'parcial'"> (+ {{ plural(f.unidadesSinValorar, 'unidad sin precio', 'unidades sin precio') }})</template></template>
            </span>
            <span>Necesidad {{ anio }}: <necesidad-inventario :necesidad="f.necesidad" /></span>
          </div>
          <div v-if="filas.length" class="sg-box sg-box--dashed">
            <span class="text-weight-bold">Total · {{ numero(total.cantidad) }} unidades</span>
            <span>Valor aproximado conocido: {{ soles(total.valorConocido) }}</span>
          </div>
          <p v-else class="sg-muted q-mb-none">Sin bienes activos para los filtros seleccionados.</p>
        </div>
      </section-card>
    </div>
  </q-page>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import KpiCard from 'components/common/KpiCard.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import NecesidadInventario from 'components/common/NecesidadInventario.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useCentroSeleccionado } from 'src/composables/useCentroSeleccionado'
import { useEstadoNavegacion } from 'src/composables/useEstadoNavegacion'
import { carPorId } from 'src/services/datos'
import { estadoValoracion, resumenInventario, totalizarInventario } from 'src/services/inventario'
import { CATEGORIAS, CONDICIONES, CONDICION_DESCONOCIDA, OPCIONES_CATEGORIA, TODOS, condicion } from 'src/config/catalogos'
import { ANIO_REVISION, ANIOS_REVISION } from 'src/config/demo'
import { exportarCsv } from 'src/utils/csv'
import { numero, plural, soles } from 'src/utils/formato'

const OPCIONES_AGRUPACION = [
  { label: 'Tipo de bien', value: 'tipo' },
  { label: 'Categoría', value: 'categoria' }
]
const OPCIONES_FILTRO_CATEGORIA = [{ label: 'Todas', value: TODOS }, ...OPCIONES_CATEGORIA]
const COLUMNAS_CONDICION = [
  ...Object.entries(CONDICIONES).map(([clave, c]) => ({ clave, label: c.label })),
  { clave: 'sin_dato', label: CONDICION_DESCONOCIDA.label }
]

const $q = useQuasar()
const route = useRoute()
const { perfil, puedeAcceder } = usePerfil()
const { carId, opcionesCar, carIdsVisibles } = useCentroSeleccionado(route.query.car, { todos: true })

const anio = ref(ANIO_REVISION)
const agruparPor = ref('tipo')
const categoria = ref(TODOS)

// Al volver con «Atrás» se conservan los filtros.
useEstadoNavegacion('inventario', { anio, carId, agruparPor, categoria })

const compacto = computed(() => $q.screen.lt.md)
const tituloAmbito = computed(() => (carId.value === TODOS ? perfil.value.ambito.descripcion : carPorId(carId.value)?.nombre ?? ''))

const filas = computed(() =>
  resumenInventario({
    carIds: carIdsVisibles.value,
    agruparPor: agruparPor.value,
    anio: anio.value,
    categoria: categoria.value === TODOS ? null : categoria.value
  })
)
const total = computed(() => totalizarInventario(filas.value))

function exportar () {
  const columnas = [
    { titulo: agruparPor.value === 'tipo' ? 'Tipo de bien' : 'Categoría', valor: (f) => f.nombre },
    { titulo: 'Categoría', valor: (f) => CATEGORIAS[f.categoria] ?? '' },
    { titulo: 'Cantidad', valor: (f) => f.cantidad },
    ...COLUMNAS_CONDICION.map((c) => ({ titulo: c.label, valor: (f) => f.porCondicion[c.clave] })),
    { titulo: 'Valor aproximado (S/)', valor: (f) => (estadoValoracion(f) === 'sin_valorar' ? 'Sin valorar' : f.valorConocido) },
    { titulo: 'Unidades sin valorar', valor: (f) => f.unidadesSinValorar },
    { titulo: `Bienes con necesidad ${anio.value}`, valor: (f) => f.necesidad.bienes },
    { titulo: `Unidades a renovar o reponer ${anio.value}`, valor: (f) => f.necesidad.unidades },
    { titulo: 'Importe conocido de la necesidad (S/)', valor: (f) => f.necesidad.importeConocido },
    { titulo: 'Necesidades sin valorar', valor: (f) => f.necesidad.sinValorar }
  ]
  const ok = exportarCsv(`sigrec-inventario-${anio.value}-${carId.value}-${agruparPor.value}-${categoria.value}.csv`, columnas, filas.value)
  if (!ok) $q.notify({ type: 'negative', message: 'El navegador bloqueó la descarga del archivo.' })
}
</script>
