<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #ayuda>
          Cantidades de bienes <strong>activos</strong> (los componentes cuentan como bienes del ambiente). El valor aproximado es el precio referencial del
          catálogo × la cantidad: no es valor contable ni aprueba compras. Las unidades sin precio referencial se informan aparte y nunca se cuentan como cero.
          Las necesidades del año son las mismas de la pantalla Necesidades. En «Consulta por equipo», un centro sin el equipo figura como «No tiene este equipo»
          y un equipo sin controles programados figura «Sin programar», no «Al día».
        </template>
        <template #acciones>
          <q-btn outline color="secondary" icon="download" label="Exportar CSV" :disable="vista === 'mal_estado' ? !bienesMalos.length : vista === 'detalle' ? !bienesDetalle.length : vista === 'equipo' ? !equipo.length : !filas.length" @click="exportar" />
          <q-btn v-if="puedeAcceder('necesidades')" unelevated color="primary" icon="assignment" label="Ver necesidades" :to="{ name: 'necesidades', query: carId === TODOS ? {} : { car: carId } }" />
        </template>
      </page-header>

      <registro-no-disponible v-if="tipoNoDisponible" entidad="El tipo de bien" :id="tipoPedido" :volver="{ name: 'inventario' }" etiqueta-volver="Ver el inventario" />

      <q-tabs v-model="vista" dense no-caps align="left" active-color="primary" indicator-color="primary" class="q-mb-md">
        <q-tab name="resumen" icon="inventory_2" label="Resumen del inventario" />
        <q-tab name="equipo" icon="travel_explore" label="Consulta por equipo" />
        <q-tab name="detalle" icon="list" label="Detalle de bienes" />
        <q-tab name="mal_estado" icon="build_circle" label="Bienes en mal estado" />
      </q-tabs>

      <div class="sg-filters">
        <q-select v-model="carId" :options="opcionesCar" emit-value map-options outlined dense label="Centro">
          <template #append><boton-dictado v-model="carId" tipo="opcion" :opciones="opcionesCar" emit-value /></template>
        </q-select>
        <q-select v-if="vista === 'equipo' || vista === 'detalle' || vista === 'mal_estado'" v-model="tipoId" :options="vista !== 'equipo' ? [{ label: 'Todos los tipos', value: TODOS }, ...opcionesTipo] : opcionesTipo" emit-value map-options outlined dense label="Tipo de bien" style="min-width: min(280px, 100%)">
          <template #append><boton-dictado v-model="tipoId" tipo="opcion" :opciones="opcionesTipo" emit-value /></template>
        </q-select>
        <q-select v-if="vista === 'resumen'" v-model="agruparPor" :options="OPCIONES_AGRUPACION" emit-value map-options outlined dense label="Agrupar por">
          <template #append><boton-dictado v-model="agruparPor" tipo="opcion" :opciones="OPCIONES_AGRUPACION" emit-value /></template>
        </q-select>
        <q-select v-if="vista === 'resumen'" v-model="categoria" :options="OPCIONES_FILTRO_CATEGORIA" emit-value map-options outlined dense label="Categoría">
          <template #append><boton-dictado v-model="categoria" tipo="opcion" :opciones="OPCIONES_FILTRO_CATEGORIA" emit-value /></template>
        </q-select>
        <q-select v-if="vista === 'resumen'" v-model="anio" :options="ANIOS_REVISION" outlined dense label="Año a revisar">
          <template #append><boton-dictado v-model="anio" tipo="opcion" :opciones="ANIOS_REVISION" /></template>
        </q-select>
      </div>

      <div v-if="vista === 'detalle'" class="sg-filters">
        <q-select v-model="verificacion" :options="opcionesVerificacion" emit-value map-options outlined dense label="Verificación" />
        <q-select v-model="controlFiltro" :options="[{ label: 'Todos los controles', value: TODOS }, { label: 'Control vencido', value: 'vencido' }]" emit-value map-options outlined dense label="Control" />
      </div>
      <template v-if="vista === 'resumen'">

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
              <tr
                v-for="f in filas"
                :id="`fila-${f.clave}`"
                :key="f.clave"
                :class="{ 'sg-row--selected': f.clave === tipoDesdeResumen }"
                :aria-current="f.clave === tipoDesdeResumen ? 'true' : undefined"
              >
                <td>
                  <span class="text-weight-bold">{{ f.nombre }}</span>
                  <div v-if="agruparPor === 'tipo' && f.categoria" class="sg-muted">{{ CATEGORIAS[f.categoria] }}</div>
                  <div v-if="agruparPor === 'tipo' && esTipo(f)" class="row q-gutter-x-md">
                    <button type="button" class="sg-row-btn" @click="verPorCentro(f)"><q-icon name="travel_explore" size="16px" aria-hidden="true" class="q-mr-xs" />Ver por centro</button>
                    <router-link v-if="puedeAcceder('necesidades') && f.necesidad.bienes" :to="{ name: 'necesidades', query: { ...(carId === TODOS ? {} : { car: carId }), tipo: f.clave } }">Ver necesidades</router-link>
                  </div>
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
          <div
            v-for="f in filas"
            :id="`fila-${f.clave}`"
            :key="f.clave"
            class="sg-box"
            :class="{ 'sg-box--resaltada': f.clave === tipoDesdeResumen }"
            :aria-current="f.clave === tipoDesdeResumen ? 'true' : undefined"
          >
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
            <div v-if="agruparPor === 'tipo' && esTipo(f)" class="row q-gutter-x-md">
                    <button type="button" class="sg-row-btn" @click="verPorCentro(f)"><q-icon name="travel_explore" size="16px" aria-hidden="true" class="q-mr-xs" />Ver por centro</button>
                    <router-link v-if="puedeAcceder('necesidades') && f.necesidad.bienes" :to="{ name: 'necesidades', query: { ...(carId === TODOS ? {} : { car: carId }), tipo: f.clave } }">Ver necesidades</router-link>
                  </div>
          </div>
          <div v-if="filas.length" class="sg-box sg-box--dashed">
            <span class="text-weight-bold">Total · {{ numero(total.cantidad) }} unidades</span>
            <span>Valor aproximado conocido: {{ soles(total.valorConocido) }}</span>
          </div>
          <p v-else class="sg-muted q-mb-none">Sin bienes activos para los filtros seleccionados.</p>
        </div>
      </section-card>
      </template>

      <!-- Consulta por equipo (antes en el «Tablero de control», SPEC 011). -->
      <section-card v-else-if="vista === 'equipo'" titulo="Consulta por equipo" subtitulo="¿Qué centros tienen este equipo, en qué condición, cuándo recibió mantenimiento y dónde requiere atención?" sin-relleno>
        <div class="q-px-md q-pt-md sg-chips items-center">
          <!-- Se llegó con «Ver por centro» desde el resumen: se ofrece volver a él, a la misma fila (SPEC 011, Ola 5). -->
          <q-btn v-if="tipoDesdeResumen" flat dense no-caps color="secondary" icon="undo" label="Volver al resumen" @click="volverAlResumen" />
          <status-chip tono="in" :label="`${centrosConEquipo} de ${plural(equipo.length, 'centro', 'centros')} tienen este equipo`" />
          <status-chip v-if="centrosConAtencion" tono="da" :label="`${plural(centrosConAtencion, 'centro requiere', 'centros requieren')} atención`" />
          <status-chip tono="ne" :label="`${numero(unidadesEquipo)} unidades activas`" />
          <router-link v-if="tipoId && puedeAcceder('necesidades')" :to="{ name: 'necesidades', query: { ...(carId === TODOS ? {} : { car: carId }), tipo: tipoId } }" class="text-weight-bold">Ver necesidades del tipo</router-link>
        </div>

        <div v-if="!compacto" class="sg-table-wrap">
          <table class="sg-table">
            <thead>
              <tr>
                <th scope="col">Centro</th>
                <th scope="col" class="sg-num">Cantidad</th>
                <th scope="col">Condición</th>
                <th scope="col">Último mantenimiento</th>
                <th scope="col">Control</th>
                <th scope="col">Atención requerida</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in equipo" :key="e.car.id">
                <td>
                  <router-link v-if="puedeAcceder('centros')" :to="{ name: 'inventario', query: { car: e.car.id, tipo: tipoId, vista: 'detalle' } }" class="text-weight-bold">{{ e.car.nombre }}</router-link>
                  <span v-else class="text-weight-bold">{{ e.car.nombre }}</span>
                </td>
                <td class="sg-num">{{ e.cantidad }}</td>
                <td><condicion-equipo :fila="e" /></td>
                <td><template v-if="e.ultimoFecha">{{ fecha(e.ultimoFecha) }}</template><span v-else class="sg-muted">{{ e.cantidad ? 'Sin registro' : '—' }}</span></td>
                <td><status-chip v-if="e.estadoControl" v-bind="ESTADOS_CONTROL[e.estadoControl]" /><span v-else class="sg-muted">—</span></td>
                <td><atencion-equipo :fila="e" />
                  <div class="column">
                    <router-link :to="{ name: 'inventario', query: { car: e.car.id, tipo: tipoId, vista: 'detalle' } }">Ver bienes del tipo</router-link>
                    <router-link v-if="e.enMalEstado" :to="{ name: 'inventario', query: { car: e.car.id, tipo: tipoId, vista: 'mal_estado' } }">Ver bienes en mal estado</router-link>
                    <router-link v-if="e.controlesVencidos" :to="{ name: 'inventario', query: { car: e.car.id, tipo: tipoId, vista: 'detalle', control: 'vencido' } }">Ver controles vencidos</router-link>
                  </div></td>
              </tr>
              <tr v-if="!equipo.length"><td colspan="6" class="sg-muted">Elija un tipo de bien.</td></tr>
            </tbody>
          </table>
        </div>

        <div v-else class="column q-gutter-y-md q-pa-md">
          <div v-for="e in equipo" :key="e.car.id" class="sg-box">
            <span class="text-weight-bold">{{ e.car.nombre }}</span>
            <span>Cantidad: <strong>{{ e.cantidad }}</strong></span>
            <condicion-equipo :fila="e" />
            <span class="sg-muted">Último mantenimiento: {{ e.ultimoFecha ? fecha(e.ultimoFecha) : e.cantidad ? 'sin registro' : '—' }}</span>
            <div class="sg-chips">
              <status-chip v-if="e.estadoControl" v-bind="ESTADOS_CONTROL[e.estadoControl]" />
              <atencion-equipo :fila="e" />
                  <div class="column">
                    <router-link :to="{ name: 'inventario', query: { car: e.car.id, tipo: tipoId, vista: 'detalle' } }">Ver bienes del tipo</router-link>
                    <router-link v-if="e.enMalEstado" :to="{ name: 'inventario', query: { car: e.car.id, tipo: tipoId, vista: 'mal_estado' } }">Ver bienes en mal estado</router-link>
                    <router-link v-if="e.controlesVencidos" :to="{ name: 'inventario', query: { car: e.car.id, tipo: tipoId, vista: 'detalle', control: 'vencido' } }">Ver controles vencidos</router-link>
                  </div>
            </div>
          </div>
          <p v-if="!equipo.length" class="sg-muted q-mb-none">Elija un tipo de bien.</p>
        </div>
      </section-card>
      <bienes-mal-estado v-else :mal-estado="vista === 'mal_estado'" :titulo-detalle="controlFiltro === 'vencido' ? 'Bienes con controles vencidos' : verificacion === 'registrada' ? 'Bienes con verificación registrada' : verificacion === 'sin_registro' ? 'Bienes sin verificación registrada' : 'Detalle de bienes activos'" :filas="vista === 'mal_estado' ? bienesMalos : bienesDetalle" :unidades="vista === 'mal_estado' ? unidadesMalas : unidadesDetalle" :unidades-activas="unidadesActivas"
                        :titulo-ambito="tituloAmbito" :compacto="compacto" :seleccionado="bienConsultado"
                        @seleccionar="bienConsultado = $event" @resumen="vista = 'resumen'" />
    </div>
  </q-page>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import KpiCard from 'components/common/KpiCard.vue'
import NecesidadInventario from 'components/common/NecesidadInventario.vue'
import CondicionEquipo from 'components/common/CondicionEquipo.vue'
import AtencionEquipo from 'components/common/AtencionEquipo.vue'
import RegistroNoDisponible from 'components/common/RegistroNoDisponible.vue'
import BienesMalEstado from 'components/bienes/BienesMalEstado.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useCentroSeleccionado } from 'src/composables/useCentroSeleccionado'
import { useEstadoNavegacion } from 'src/composables/useEstadoNavegacion'
import { bienesActivosDeCentros, carPorId, db, tipoPorId, vigentes } from 'src/services/datos'
import { detalleInventario, consultaPorTipo, estadoValoracion, requiereAtencionEquipo, resumenInventario, totalizarInventario } from 'src/services/inventario'
import { CATEGORIAS, CONDICIONES, CONDICION_DESCONOCIDA, ESTADOS_CONTROL, OPCIONES_CATEGORIA, TIPO_EXTINTOR, TODOS, condicion } from 'src/config/catalogos'
import { ANIO_REVISION, ANIOS_REVISION, FECHA_CORTE } from 'src/config/demo'
import { exportarCsv } from 'src/utils/csv'
import { fecha, numero, plural, soles } from 'src/utils/formato'
import { mostrarDetalle, parametro } from 'src/utils/navegacion'

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

// ---------- Consulta por equipo ----------
// ?tipo= (o ?vista=equipo) abre la consulta con ese tipo; un tipo inexistente muestra «Registro no disponible».
const opcionesTipo = computed(() =>
  vigentes(db.tiposBien).map((t) => ({ value: t.id, label: t.nombre })).sort((a, b) => a.label.localeCompare(b.label, 'es'))
)
const tipoPedido = parametro(route.query.tipo)
const tipoNoDisponible = !!tipoPedido && !opcionesTipo.value.some((o) => o.value === tipoPedido)
const tipoPorDefecto = opcionesTipo.value.some((o) => o.value === TIPO_EXTINTOR) ? TIPO_EXTINTOR : opcionesTipo.value[0]?.value ?? null
const tipoId = ref(tipoPedido && !tipoNoDisponible ? tipoPedido : tipoPorDefecto)
const vistaPedida = parametro(route.query.vista)
const vista = ref(['mal_estado', 'detalle'].includes(vistaPedida) ? vistaPedida :
  (tipoPedido && !tipoNoDisponible) || parametro(route.query.vista) === 'equipo' ? 'equipo' : 'resumen')
const bienConsultado = ref(null)
const opcionesVerificacion = [{ label: 'Todas', value: TODOS }, { label: 'Con verificación registrada', value: 'registrada' }, { label: 'Sin verificación registrada', value: 'sin_registro' }]
const verificacion = ref(opcionesVerificacion.some((o) => o.value === parametro(route.query.verificacion)) ? parametro(route.query.verificacion) : TODOS)
const controlFiltro = ref(parametro(route.query.control) === 'vencido' ? 'vencido' : TODOS)
if (['detalle', 'mal_estado'].includes(vista.value) && !tipoPedido) tipoId.value = TODOS

const equipo = computed(() => (tipoId.value ? consultaPorTipo(tipoId.value, carIdsVisibles.value.map(carPorId), { anio: ANIO_REVISION, fechaCorte: FECHA_CORTE }) : []))
const centrosConEquipo = computed(() => equipo.value.filter((e) => e.cantidad > 0).length)
const centrosConAtencion = computed(() => equipo.value.filter(requiereAtencionEquipo).length)
const unidadesEquipo = computed(() => equipo.value.reduce((suma, e) => suma + e.cantidad, 0))

// Desde el resumen por tipo: «Ver por centro» abre la consulta con ese tipo y recuerda la fila de origen, para ofrecer
// «Volver al resumen» y resaltarla al regresar (SPEC 011, Ola 5).
const esTipo = (f) => !!tipoPorId(f.clave)
const tipoDesdeResumen = ref(null)
function verPorCentro (f) {
  tipoDesdeResumen.value = f.clave
  tipoId.value = f.clave
  vista.value = 'equipo'
}

async function volverAlResumen () {
  vista.value = 'resumen'
  await nextTick()
  mostrarDetalle(document.getElementById(`fila-${tipoDesdeResumen.value}`))
}

// Al volver con «Atrás» se conservan los filtros, la vista, el equipo consultado y la fila de origen.
useEstadoNavegacion('inventario', { anio, carId, agruparPor, categoria, vista, tipoId, tipoDesdeResumen, bienConsultado, verificacion, controlFiltro })

watch(vista, (valor, previo) => {
  if (valor === 'equipo' && tipoId.value === TODOS) tipoId.value = tipoPorDefecto
  if (['detalle', 'mal_estado'].includes(valor) && previo === 'resumen') tipoId.value = TODOS
})

const bienesMalos = computed(() => detalleInventario({ carIds: carIdsVisibles.value, tipoId: tipoId.value === TODOS ? null : tipoId.value, malEstado: true }))
const bienesDetalle = computed(() => detalleInventario({ carIds: carIdsVisibles.value, tipoId: tipoId.value === TODOS ? null : tipoId.value, verificacion: verificacion.value === TODOS ? null : verificacion.value, control: controlFiltro.value, fechaCorte: FECHA_CORTE }))
const unidadesDetalle = computed(() => bienesDetalle.value.reduce((suma, f) => suma + (f.bien.cantidad ?? 1), 0))
const unidadesMalas = computed(() => bienesMalos.value.reduce((suma, f) => suma + (f.bien.cantidad ?? 1), 0))
// El denominador usa el mismo ámbito que Inicio, independientemente de los filtros del resumen.
const unidadesActivas = computed(() => bienesActivosDeCentros(carIdsVisibles.value).reduce((suma, b) => suma + (b.cantidad ?? 1), 0))

onMounted(() => {
  if (['mal_estado', 'detalle'].includes(vista.value) && bienConsultado.value) {
    mostrarDetalle(document.getElementById(`bien-${bienConsultado.value}`))
  }
})

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
  if (vista.value === 'equipo') {
    const columnas = [
      { titulo: 'Centro', valor: (f) => f.car.nombre },
      { titulo: 'Tipo', valor: () => tipoPorId(tipoId.value)?.nombre ?? tipoId.value },
      { titulo: 'Cantidad', valor: (f) => f.cantidad },
      ...COLUMNAS_CONDICION.map((c) => ({ titulo: c.label, valor: (f) => f.porCondicion?.[c.clave] ?? 0 })),
      { titulo: 'Último mantenimiento', valor: (f) => f.ultimoFecha ?? 'Sin registro' },
      { titulo: 'Control', valor: (f) => ESTADOS_CONTROL[f.estadoControl]?.label ?? 'Sin equipo' },
      { titulo: 'Unidades en mal estado', valor: (f) => f.enMalEstado },
      { titulo: 'Controles vencidos', valor: (f) => f.controlesVencidos }
    ]
    const ok = exportarCsv(`sigrec-equipo-${tipoId.value}-${carId.value}.csv`, columnas, equipo.value)
    if (!ok) $q.notify({ type: 'negative', message: 'El navegador bloqueó la descarga del archivo.' })
    return
  }
  if (vista.value === 'mal_estado' || vista.value === 'detalle') {
    const columnas = [
      { titulo: 'Bien', valor: (f) => f.bien.nombre },
      { titulo: 'Identificador', valor: (f) => f.bien.id },
      { titulo: 'Código patrimonial', valor: (f) => f.bien.codigoPatrimonial || 'Sin código patrimonial' },
      { titulo: 'Centro', valor: (f) => f.car.nombre },
      { titulo: 'Ambiente', valor: (f) => f.ambiente.nombre },
      { titulo: 'Cantidad', valor: (f) => f.bien.cantidad ?? 1 },
      { titulo: 'Condición', valor: (f) => condicion(f.bien.condicion).label },
      { titulo: 'Verificación', valor: (f) => f.bien.verificacion ? `${f.bien.verificacion.fecha} · ${f.bien.verificacion.resultado}` : 'Sin verificación registrada' },
      { titulo: 'Control', valor: (f) => f.control ? ESTADOS_CONTROL[f.control.estado].label : '' },
      { titulo: 'Próxima fecha de control', valor: (f) => f.control?.proxima ?? '' },
      { titulo: 'Deterioro informado', valor: (f) => f.bien.deterioro || 'Sin deterioro informado' },
      { titulo: 'Bien principal', valor: (f) => f.principal?.nombre ?? '' },
      { titulo: 'Identificador principal', valor: (f) => f.bien.asociadoA?.bienId ?? '' }
    ]
    const ok = exportarCsv(`sigrec-bienes-${vista.value}-${carId.value}.csv`, columnas, vista.value === 'mal_estado' ? bienesMalos.value : bienesDetalle.value)
    if (!ok) $q.notify({ type: 'negative', message: 'El navegador bloqueó la descarga del archivo.' })
    return
  }
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
