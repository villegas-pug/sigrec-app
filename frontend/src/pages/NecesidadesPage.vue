<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #ayuda>
          <p><strong>Clasificación principal.</strong> Cada bien cuenta una sola vez y conserva todos sus motivos.
          Si tiene un incidente vigente que reporta necesidad, su clasificación principal es reposición aunque también haya cumplido su vida útil
          (regla provisional: se muestran ambos motivos).</p>
          <p class="q-mb-none">La reposición exige la baja previa del bien. Ninguno de los dos pasos se ejecuta automáticamente al registrar una necesidad.
          Una necesidad sin precio referencial queda «sin valorar»: su costo es desconocido, no cero.</p>
        </template>
        <template #acciones>
          <q-btn outline color="secondary" icon="download" label="Exportar CSV" :disable="vista === 'infraestructura' ? !resultado.infraestructura.length : vista === 'atendidas' ? !resultado.atendidas.length : !pendientes.length" @click="exportar" />
          <q-btn v-if="puedeAcceder('precios')" unelevated color="primary" icon="sell" label="Tipos de bien y precios" @click="abrirCatalogo" />
        </template>
      </page-header>

      <registro-no-disponible v-if="tipoNoDisponible" entidad="El tipo de bien" :id="tipoPedido" :volver="{ name: 'necesidades' }" etiqueta-volver="Ver todas las necesidades" />

      <div class="sg-filters">
        <q-select v-model="vista" :options="opcionesVista" emit-value map-options outlined dense label="Consulta" />
        <q-select v-model="anio" :options="ANIOS_REVISION" outlined dense label="Año a revisar">
          <template #append><boton-dictado v-model="anio" tipo="opcion" :opciones="ANIOS_REVISION" /></template>
        </q-select>
        <q-select v-model="carId" :options="opcionesCar" emit-value map-options outlined dense label="Centro">
          <template #append><boton-dictado v-model="carId" tipo="opcion" :opciones="opcionesCar" emit-value /></template>
        </q-select>
        <q-select v-model="tipoId" :options="opcionesTipo" emit-value map-options outlined dense label="Tipo de bien">
          <template #append><boton-dictado v-model="tipoId" tipo="opcion" :opciones="opcionesTipo" emit-value /></template>
        </q-select>
        <q-select v-model="clase" :options="OPCIONES_CLASE" emit-value map-options outlined dense label="Clasificación principal">
          <template #append><boton-dictado v-model="clase" tipo="opcion" :opciones="OPCIONES_CLASE" emit-value /></template>
        </q-select>
        <div class="row items-center sg-chips">
          <status-chip tono="pv" label="Regla de vida útil · Por validar" />
          <status-chip tono="pv" label="Priorización provisional · ver simulador" />
        </div>
      </div>


      <div class="sg-kpi-panel">
        <kpi-card icono="assignment_late" tono="rojo" :valor="total.cantidad" etiqueta="Necesidades de bienes pendientes" :nota="`${total.renovacion} renovación · ${total.reposicion} reposición`" />
        <kpi-card icono="payments" tono="verde" :valor="soles(total.importeConocido)" etiqueta="Importe estimado conocido" nota="Con precios referenciales" />
        <kpi-card icono="money_off" tono="ambar" :valor="total.sinValorar" :to="total.sinValorar ? enlaceVista('sin_valorar') : null" etiqueta="Sin valorar" nota="Sin precio referencial: costo desconocido, no cero" />
        <kpi-card icono="foundation" tono="azul" :valor="resultado.infraestructura.length" :to="resultado.infraestructura.length ? enlaceVista('infraestructura') : null" etiqueta="Infraestructura en evaluación" nota="Sin costo estimado" />
        <kpi-card icono="task_alt" tono="morado" :valor="resultado.atendidas.length" :to="resultado.atendidas.length ? enlaceVista('atendidas') : null" etiqueta="Atendidas por reposición" nota="No suman como pendientes" />
      </div>

      <note-banner v-if="total.sinValorar || resultado.infraestructura.length" tono="wa" icono="warning">
        <strong>Presupuesto incompleto.</strong>
        {{ soles(total.importeConocido) }} corresponde solo a las necesidades con precio referencial.
        Faltan valorar {{ plural(total.sinValorar, 'necesidad', 'necesidades') }} y evaluar {{ resultado.infraestructura.length }} de infraestructura.
        Registrar una necesidad no equivale a aprobar una compra.
      </note-banner>

      <section-card v-if="vista === 'todas' && carsVisibles.length > 1" :titulo="`Consolidado por centro · ${anio}`" subtitulo="Seleccione un centro para ver las necesidades que sustentan la cifra" sin-relleno>
        <div class="sg-table-wrap">
          <table class="sg-table">
            <thead>
              <tr>
                <th scope="col">Centro</th>
                <th scope="col" class="sg-num">Renovación</th>
                <th scope="col" class="sg-num">Reposición</th>
                <th scope="col" class="sg-num">Importe conocido</th>
                <th scope="col">Sin valorar</th>
                <th scope="col">Infraestructura</th>
                <th scope="col">Atendidas</th>
                <th scope="col">Antecedentes insuficientes</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="fila in consolidado"
                :id="`consolidado-${fila.car.id}`"
                :key="fila.car.id"
                :class="{ 'sg-row--selected': fila.car.id === centroDesdeConsolidado }"
                :aria-current="fila.car.id === centroDesdeConsolidado ? 'true' : undefined"
              >
                <td><button type="button" class="sg-row-btn" @click="elegirCentro(fila.car.id)"><q-icon name="filter_alt" size="16px" aria-hidden="true" class="q-mr-xs" />{{ fila.car.nombre }}</button></td>
                <td class="sg-num">{{ fila.renovacion }}</td>
                <td class="sg-num">{{ fila.reposicion }}</td>
                <td class="sg-num text-weight-bold">{{ soles(fila.importeConocido) }}</td>
                <td><status-chip :tono="fila.sinValorar ? 'wa' : 'ne'" :label="String(fila.sinValorar)" /></td>
                <td><status-chip :tono="fila.infraestructura ? 'in' : 'ne'" :label="fila.infraestructura ? `${fila.infraestructura} en evaluación` : 'Ninguna'" /></td>
                <td><status-chip :tono="fila.atendidas ? 'ok' : 'ne'" :label="String(fila.atendidas)" /></td>
                <td><status-chip :tono="fila.insuficientes ? 'si' : 'ne'" :label="plural(fila.insuficientes, 'bien', 'bienes')" /></td>
              </tr>
              <tr class="sg-row--total">
                <td>Total</td>
                <td class="sg-num">{{ total.renovacion }}</td>
                <td class="sg-num">{{ total.reposicion }}</td>
                <td class="sg-num">{{ soles(total.importeConocido) }}</td>
                <td><status-chip :tono="total.sinValorar ? 'wa' : 'ne'" :label="String(total.sinValorar)" /></td>
                <td><status-chip tono="in" :label="`${resultado.infraestructura.length} en evaluación`" /></td>
                <td><status-chip tono="ok" :label="String(resultado.atendidas.length)" /></td>
                <td><status-chip tono="si" :label="plural(resultado.insuficientes.length, 'bien', 'bienes')" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section-card>

      <section-card v-if="vista === 'todas' || vista === 'sin_valorar'" ref="detalleRef" :titulo="`Detalle de necesidades · ${tituloAmbito}`" :subtitulo="`${plural(total.cantidad, 'necesidad', 'necesidades')} · ${soles(total.importeConocido)} conocido · ${total.sinValorar} sin valorar`" sin-relleno>
        <template #acciones>
          <!-- Se eligió el centro en el consolidado (que se oculta al filtrar): se ofrece volver a él, a la misma fila (SPEC 011, Ola 5). -->
          <q-btn v-if="centroDesdeConsolidado && carId === centroDesdeConsolidado" flat dense no-caps color="secondary" icon="undo" label="Volver al consolidado por centro" @click="volverAlConsolidado" />
          <status-chip tono="pv" label="Una necesidad por bien, con todos sus motivos · Por validar" />
        </template>
        <div class="sg-table-wrap">
          <table class="sg-table">
            <thead>
              <tr>
                <th scope="col">Bien y ubicación</th>
                <th scope="col">Motivos</th>
                <th scope="col">Condición</th>
                <th scope="col" class="sg-num">Cantidad</th>
                <th scope="col" class="sg-num">Precio referencial</th>
                <th scope="col" class="sg-num">Importe</th>
                <th scope="col">Siguiente paso</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="n in pendientes" :key="n.id" :id="`necesidad-${n.id}`" :class="{ 'sg-row--selected': registroConsultado === n.id }">
                <td>
                  <router-link v-if="puedeAcceder('centros')" :to="{ name: 'centros', query: { bien: n.id } }" @click="registroConsultado = n.id" class="text-weight-bold">{{ n.bien.nombre }} · {{ n.id }}</router-link>
                  <span v-else class="text-weight-bold">{{ n.bien.nombre }} · {{ n.id }}</span>
                  <div class="sg-muted">{{ textoUbicacion(n.ubicacion) }}</div>
                  <status-chip :tono="n.clase === 'reposicion' ? 'da' : 'in'" :label="`Clasificación principal: ${CLASES[n.clase]}`" />
                </td>
                <td>
                  <div class="column q-gutter-y-xs items-start">
                    <status-chip v-for="(m, i) in n.motivos" :key="i" :tono="m.clase === 'incidente' ? 'da' : 'ne'" :label="m.fecha ? `${m.texto} · ${fecha(m.fecha)}` : m.texto" />
                    <span v-if="n.faltantes.length" class="sg-muted">Antecedentes insuficientes: {{ n.faltantes.join(', ') }}</span>
                  </div>
                </td>
                <td><status-chip v-bind="condicion(n.bien.condicion)" /></td>
                <td class="sg-num">{{ n.cantidad }}</td>
                <td class="sg-num">
                  <template v-if="n.precioUnitario != null">{{ soles(n.precioUnitario) }}</template>
                  <template v-else>
                    <status-chip tono="wa" label="Sin precio" />
                    <div v-if="n.tipo">
                      <q-btn v-if="puedeValorar" flat dense no-caps color="primary" icon="sell" :label="`Valorar ${n.tipo.nombre}`" @click="valorar(n.tipo)" />
                      <span v-else class="sg-muted">Pendiente de valoración por equipo central</span>
                    </div>
                  </template>
                </td>
                <td class="sg-num">
                  <template v-if="n.importe != null">{{ soles(n.importe) }}</template>
                  <status-chip v-else tono="wa" label="Sin valorar" />
                </td>
                <td>
                  <div class="column q-gutter-y-xs items-start">
                    <span v-if="pasoDe(n)">Paso pendiente: {{ pasoDe(n).label }}</span>
                    <router-link v-if="puedeAcceder('centros')" :to="{ name: 'centros', query: { bien: n.id } }">Ver ficha del bien</router-link>
                    <span v-if="!pasoDe(n) && siguientePaso(n.bien)" class="sg-muted">Requiere: equipo central</span>
                    <router-link v-if="antecedenteDe(n)" :to="antecedenteDe(n).to">{{ antecedenteDe(n).label }}</router-link>
                  </div>
                </td>
              </tr>
              <tr v-if="pendientes.length" class="sg-row--total">
                <td colspan="5">Importe conocido</td>
                <td class="sg-num">{{ soles(total.importeConocido) }}<div v-if="total.sinValorar" class="sg-muted">+ {{ plural(total.sinValorar, 'necesidad sin valorar', 'necesidades sin valorar') }}</div></td>
                <td />
              </tr>
              <tr v-else><td colspan="7" class="sg-muted">Sin necesidades pendientes para los filtros seleccionados.</td></tr>
            </tbody>
          </table>
        </div>
      </section-card>

      <simulador-presupuesto v-if="vista === 'todas' || vista === 'sin_valorar'" :pendientes="pendientes" :titulo-ambito="tituloAmbito" :anio="anio" />

      <section-card v-if="vista === 'todas' && resultado.porReponer.length" titulo="Bajas pendientes de reposición" subtitulo="Informativo: ya salieron del cálculo de pendientes y no suman al total (regla por validar)">
        <div class="column q-gutter-y-sm">
          <div v-for="r in resultado.porReponer" :key="r.id" class="sg-box">
            <div class="sg-chips"><status-chip v-bind="SITUACIONES.baja" /><status-chip tono="si" label="Sin reposición" /></div>
            <span class="text-weight-bold">{{ r.bien.nombre }} · {{ r.id }}</span>
            <span class="sg-muted">{{ textoUbicacion(r.ubicacion) }}</span>
            <span v-for="e in r.incidentes" :key="e.id" class="sg-muted">{{ TIPOS_EVENTO[e.tipo].label }}: {{ e.titulo }} · {{ fecha(e.fecha) }}</span>
            <div class="row items-center q-gutter-x-md">
              <span>Paso pendiente: registrar reposición</span>
              <router-link v-if="puedeAcceder('centros')" :to="{ name: 'centros', query: { bien: r.bien.id } }">Ver ficha del bien</router-link>
              <router-link v-if="puedeAcceder('incidencias')" :to="{ name: 'incidencias', query: { car: r.ubicacion.car.id, hecho: r.incidentes[0].id } }">Ver incidente</router-link>
            </div>
          </div>
        </div>
      </section-card>

      <p class="sg-muted">Infraestructura, reposiciones atendidas y antecedentes insuficientes corresponden al centro y año seleccionados; no se restringen por tipo de bien ni clasificación.</p>
      <div class="sg-grid-2">
        <section-card v-if="vista === 'todas' || vista === 'infraestructura'" titulo="Infraestructura en evaluación" subtitulo="Se distingue de la reposición de bienes; no se le asigna un costo no sustentado">
          <div class="column q-gutter-y-sm">
            <div v-for="i in resultado.infraestructura" :key="i.id" :id="`necesidad-${i.id}`" class="sg-box" :class="{ 'sg-box--resaltada': registroConsultado === i.id }">
              <div class="sg-chips"><status-chip tono="in" label="Requiere evaluación" /><status-chip tono="si" label="Costo no estimado" /></div>
              <span class="text-weight-bold">{{ i.novedad.titulo }} · {{ i.id }}</span>
              <span class="sg-muted">{{ textoUbicacion(i.ubicacion) }} · informada el {{ fecha(i.novedad.fecha) }}</span>
              <router-link v-if="puedeAcceder('centros')" :to="{ name: 'centros', query: i.esIncidencia ? { hecho: i.id } : { car: i.ubicacion.car.id, ambiente: i.ubicacion.ambiente.id, novedad: i.id } }" @click="registroConsultado = i.id">Ver incidencia de infraestructura</router-link>
            </div>
            <p v-if="!resultado.infraestructura.length" class="sg-muted q-mb-none">Sin necesidades de infraestructura.</p>
          </div>
        </section-card>

        <section-card v-if="vista === 'todas' || vista === 'atendidas'" :titulo="vista === 'atendidas' ? 'Atendidas por reposición' : 'Atendidas y antecedentes insuficientes'">
          <div class="column q-gutter-y-sm">
            <div v-for="a in resultado.atendidas" :key="a.id" :id="`necesidad-${a.id}`" class="sg-box" :class="{ 'sg-box--resaltada': registroConsultado === a.id }">
              <div class="sg-chips"><status-chip tono="ok" label="Atendida por reposición" /><status-chip tono="ne" label="No suma" /></div>
              <span class="text-weight-bold">{{ a.anterior.nombre }} · {{ a.anterior.id }}</span>
              <span class="sg-muted">Repuesto por {{ a.nuevo.id }} el {{ fecha(a.evento.fecha) }}</span>
              <router-link v-if="puedeAcceder('incidencias')" :to="{ name: 'incidencias', query: { car: a.ubicacion.car.id, hecho: a.id } }" @click="registroConsultado = a.id">Ver reposición</router-link>
            </div>
            <div v-for="i in (vista === 'atendidas' ? [] : resultado.insuficientes)" :key="i.bien.id" class="sg-box sg-box--dashed">
              <div class="sg-chips"><status-chip tono="si" label="Antecedentes insuficientes" /></div>
              <span class="text-weight-bold">{{ i.bien.nombre }} · {{ i.bien.id }}</span>
              <span class="sg-muted">Falta {{ i.faltantes.join(' y ') }}: no se calcula renovación por vida útil.</span>
              <router-link v-if="puedeAcceder('centros')" :to="{ name: 'centros', query: { bien: i.bien.id } }">Completar en la ficha del bien</router-link>
            </div>
            <p v-if="!resultado.atendidas.length && (vista === 'atendidas' || !resultado.insuficientes.length)" class="sg-muted q-mb-none">Sin registros.</p>
          </div>
        </section-card>
      </div>
    </div>

    <catalogo-precios-dialog v-if="puedeAcceder('precios')" v-model="catalogoAbierto" :anio="anio" :car-ids="carIdsVisibles" :contexto="tituloAmbito" :tipo-pedido="parametro(route.query.tipoCatalogo) || ''" :filtro-inicial="parametro(route.query.filtroCatalogo) || 'todos'" @hide="restaurarFocoCatalogo" />
    <precio-dialog v-if="dialogoPrecio.tipo" v-model="dialogoPrecio.abierto" :tipo="dialogoPrecio.tipo" />
  </q-page>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import KpiCard from 'components/common/KpiCard.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import PrecioDialog from 'components/precios/PrecioDialog.vue'
import CatalogoPreciosDialog from 'components/precios/CatalogoPreciosDialog.vue'
import SimuladorPresupuesto from 'components/necesidades/SimuladorPresupuesto.vue'
import RegistroNoDisponible from 'components/common/RegistroNoDisponible.vue'
import { primeraVisita } from 'src/router/retorno'
import { usePerfil } from 'src/composables/usePerfil'
import { useCentroSeleccionado } from 'src/composables/useCentroSeleccionado'
import { useEstadoNavegacion } from 'src/composables/useEstadoNavegacion'
import { carPorId, db, etiquetaAmbiente, textoUbicacion, vigentes } from 'src/services/datos'
import { calcularNecesidades, consolidarPorCar, totalizar } from 'src/services/necesidades'
import { siguientePaso } from 'src/services/bienes'
import { SITUACIONES, TIPOS_EVENTO, TODOS, condicion } from 'src/config/catalogos'
import { ANIO_REVISION, ANIOS_REVISION } from 'src/config/demo'
import { exportarCsv } from 'src/utils/csv'
import { fecha, plural, soles } from 'src/utils/formato'
import { mostrarDetalle, parametro } from 'src/utils/navegacion'

const CLASES = { renovacion: 'Renovación por vida útil', reposicion: 'Reposición por incidente' }

const OPCIONES_CLASE = [
  { label: 'Todas', value: TODOS },
  { label: 'Renovación por vida útil', value: 'renovacion' },
  { label: 'Reposición por incidente', value: 'reposicion' }
]

const $q = useQuasar()
const route = useRoute()
const { perfil, puedeAcceder, puedeHacer } = usePerfil()
const { carId, opcionesCar, carIdsVisibles } = useCentroSeleccionado(route.query.car, { todos: true })

const anio = ref(ANIOS_REVISION.find((a) => String(a) === parametro(route.query.anio)) ?? ANIO_REVISION)
const opcionesVista = [{ value: 'todas', label: 'Todas las secciones' }, { value: 'sin_valorar', label: 'Necesidades sin valorar' }, { value: 'infraestructura', label: 'Infraestructura en evaluación' }, { value: 'atendidas', label: 'Atendidas por reposición' }]
const vista = ref(opcionesVista.some((o) => o.value === parametro(route.query.vista)) ? parametro(route.query.vista) : 'todas')
const enlaceVista = (valor) => ({ name: 'necesidades', query: { vista: valor, car: carId.value, anio: anio.value, ...(tipoId.value === TODOS ? {} : { tipo: tipoId.value }) } })
const clase = ref(TODOS)

// ?tipo= filtra por tipo de bien (p. ej. desde Inventario o la ficha del bien); un tipo inexistente se avisa y no filtra.
const opcionesTipo = computed(() => [
  { label: 'Todos los tipos', value: TODOS },
  ...vigentes(db.tiposBien).map((t) => ({ label: t.nombre, value: t.id })).sort((a, b) => a.label.localeCompare(b.label, 'es'))
])
const tipoPedido = parametro(route.query.tipo)
const tipoNoDisponible = !!tipoPedido && !opcionesTipo.value.some((o) => o.value === tipoPedido)
const tipoId = ref(tipoPedido && !tipoNoDisponible ? tipoPedido : TODOS)

// Centro elegido en el consolidado: al filtrar, el consolidado se oculta; se recuerda para ofrecer volver y resaltar su fila.
const centroDesdeConsolidado = ref(null)
const detalleRef = ref(null)
const registroConsultado = ref(null)

function elegirCentro (id) {
  centroDesdeConsolidado.value = id
  carId.value = id
  mostrarDetalle(detalleRef)
}

async function volverAlConsolidado () {
  carId.value = TODOS
  await nextTick()
  mostrarDetalle(document.getElementById(`consolidado-${centroDesdeConsolidado.value}`))
}

// Al volver con «Atrás» desde un bien o desde el catálogo se conservan año, centro, tipo, clasificación y el centro elegido en el consolidado.
useEstadoNavegacion('necesidades', { anio, carId, clase, tipoId, centroDesdeConsolidado, vista, registroConsultado })

onMounted(() => { if (registroConsultado.value) mostrarDetalle(document.getElementById(`necesidad-${registroConsultado.value}`)) })

const puedeValorar = computed(() => puedeHacer('precio.informar'))

const catalogoAbierto = ref(false)
onMounted(() => {
  if (parametro(route.query.catalogo) === 'precios' && puedeAcceder('precios') && primeraVisita()) catalogoAbierto.value = true
})
let botonCatalogo = null

function abrirCatalogo (evento) {
  botonCatalogo = evento.currentTarget
  catalogoAbierto.value = true
}

function restaurarFocoCatalogo () {
  if (botonCatalogo?.isConnected) botonCatalogo.focus({ preventScroll: true })
}

// Valoración en línea (SPEC 011, Ola 2): el precio se informa sin salir de Necesidades y los importes se recalculan al guardar.
const dialogoPrecio = reactive({ abierto: false, tipo: null })
const valorar = (tipo) => Object.assign(dialogoPrecio, { tipo, abierto: true })

// Paso pendiente informativo; su registro se realiza desde la ficha del bien en Gestión de centros.
const pasoDe = (n) => {
  const paso = siguientePaso(n.bien)
  return paso && puedeHacer(paso.permiso) ? paso : null
}

// Antecedente de la necesidad: el incidente que la motivó o, si solo es por vida útil, la ficha del bien.
function antecedenteDe (n) {
  const motivo = n.motivos.find((m) => m.eventoId)
  if (motivo && puedeAcceder('incidencias')) return { label: 'Ver incidente', to: { name: 'incidencias', query: { car: n.ubicacion.car.id, hecho: motivo.eventoId } } }
  return null
}

const carsVisibles = computed(() => carIdsVisibles.value.map(carPorId))
const tituloAmbito = computed(() => (carId.value === TODOS ? perfil.value.ambito.descripcion : carPorId(carId.value).nombre))

const resultado = computed(() => calcularNecesidades({ anio: anio.value, carIds: carsVisibles.value.map((c) => c.id) }))
const pendientes = computed(() =>
  resultado.value.pendientes.filter((n) => (clase.value === TODOS || n.clase === clase.value) && (tipoId.value === TODOS || n.tipo?.id === tipoId.value) && (vista.value !== 'sin_valorar' || n.importe == null))
)
const total = computed(() => totalizar(pendientes.value))
// El consolidado usa las mismas necesidades filtradas que el detalle para que las cifras coincidan.
const consolidado = computed(() => consolidarPorCar({ ...resultado.value, pendientes: pendientes.value }, carsVisibles.value))

const COLUMNAS_CSV = [
  { titulo: 'Rótulo', valor: (n) => n.id },
  { titulo: 'Bien', valor: (n) => n.bien.nombre },
  { titulo: 'CAR', valor: (n) => n.ubicacion.car.nombre },
  { titulo: 'Ambiente', valor: (n) => etiquetaAmbiente(n.ubicacion.ambiente) },
  { titulo: 'Clasificación principal', valor: (n) => CLASES[n.clase] },
  { titulo: 'Motivos', valor: (n) => n.motivos.map((m) => m.texto).join(' | ') },
  { titulo: 'Cantidad', valor: (n) => n.cantidad },
  { titulo: 'Precio referencial', valor: (n) => n.precioUnitario ?? 'Sin precio' },
  { titulo: 'Importe', valor: (n) => n.importe ?? 'Sin valorar' }
]

function exportar () {
  if (vista.value === 'infraestructura' || vista.value === 'atendidas') {
    const filas = vista.value === 'infraestructura' ? resultado.value.infraestructura.map((i) => ({ id: i.id, nombre: i.novedad.titulo, ubicacion: i.ubicacion })) : resultado.value.atendidas.map((a) => ({ id: a.id, nombre: a.anterior.nombre, ubicacion: a.ubicacion }))
    const ok = exportarCsv(`sigrec-necesidades-${vista.value}-${anio.value}.csv`, [{ titulo: 'Identificador', valor: (f) => f.id }, { titulo: 'Descripción', valor: (f) => f.nombre }, { titulo: 'Ubicación', valor: (f) => textoUbicacion(f.ubicacion) }], filas)
    if (!ok) $q.notify({ type: 'negative', message: 'El navegador bloqueó la descarga del archivo.' })
    return
  }
  const ok = exportarCsv(`sigrec-necesidades-${anio.value}-${carId.value}-${tipoId.value}-${clase.value}.csv`, COLUMNAS_CSV, pendientes.value)
  if (!ok) $q.notify({ type: 'negative', message: 'El navegador bloqueó la descarga del archivo.' })
}
</script>
