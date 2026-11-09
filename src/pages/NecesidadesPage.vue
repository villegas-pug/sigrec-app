<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #acciones>
          <q-btn outline color="secondary" icon="download" label="Exportar CSV" :disable="!pendientes.length" @click="exportar" />
          <q-btn v-if="puedeAcceder('precios')" unelevated color="primary" icon="sell" label="Tipos de bien y precios" :to="{ name: 'precios' }" />
        </template>
      </page-header>

      <div class="sg-filters">
        <q-select v-model="anio" :options="ANIOS_REVISION" outlined dense label="Año a revisar">
          <template #append><boton-dictado v-model="anio" tipo="opcion" :opciones="ANIOS_REVISION" /></template>
        </q-select>
        <q-select v-model="carId" :options="opcionesCar" emit-value map-options outlined dense label="Centro">
          <template #append><boton-dictado v-model="carId" tipo="opcion" :opciones="opcionesCar" emit-value /></template>
        </q-select>
        <q-select v-model="clase" :options="OPCIONES_CLASE" emit-value map-options outlined dense label="Clasificación principal">
          <template #append><boton-dictado v-model="clase" tipo="opcion" :opciones="OPCIONES_CLASE" emit-value /></template>
        </q-select>
        <div class="row items-center sg-chips">
          <status-chip tono="pv" label="Regla de vida útil · Por validar" />
          <status-chip tono="pv" label="Priorización · ampliación posterior" />
        </div>
      </div>

      <note-banner tono="in">
        <strong>Clasificación principal.</strong> Cada bien cuenta una sola vez y conserva todos sus motivos.
        Si tiene un incidente vigente que reporta necesidad, su clasificación principal es reposición aunque también haya cumplido su vida útil
        (regla provisional: se muestran ambos motivos).
      </note-banner>

      <div class="sg-kpi-panel">
        <kpi-card icono="assignment_late" tono="rojo" :valor="total.cantidad" etiqueta="Necesidades de bienes pendientes" :nota="`${total.renovacion} renovación · ${total.reposicion} reposición`" />
        <kpi-card icono="payments" tono="verde" :valor="soles(total.importeConocido)" etiqueta="Importe estimado conocido" nota="Con precios referenciales" />
        <kpi-card icono="money_off" tono="ambar" :valor="total.sinValorar" etiqueta="Sin valorar" nota="Sin precio referencial: costo desconocido, no cero" />
        <kpi-card icono="foundation" tono="azul" :valor="resultado.infraestructura.length" etiqueta="Infraestructura en evaluación" nota="Sin costo estimado" />
        <kpi-card icono="task_alt" tono="morado" :valor="resultado.atendidas.length" etiqueta="Atendidas por reposición" nota="No suman como pendientes" />
      </div>

      <note-banner v-if="total.sinValorar || resultado.infraestructura.length" tono="wa" icono="warning">
        <strong>Presupuesto incompleto.</strong>
        {{ soles(total.importeConocido) }} corresponde solo a las necesidades con precio referencial.
        Faltan valorar {{ plural(total.sinValorar, 'necesidad', 'necesidades') }} y evaluar {{ resultado.infraestructura.length }} de infraestructura.
        Registrar una necesidad no equivale a aprobar una compra.
      </note-banner>

      <section-card v-if="carsVisibles.length > 1" :titulo="`Consolidado por centro · ${anio}`" subtitulo="Seleccione un centro para ver las necesidades que sustentan la cifra" sin-relleno>
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
              <tr v-for="fila in consolidado" :key="fila.car.id">
                <td><button type="button" class="sg-row-btn" @click="carId = fila.car.id"><q-icon name="filter_alt" size="16px" aria-hidden="true" class="q-mr-xs" />{{ fila.car.nombre }}</button></td>
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

      <section-card :titulo="`Detalle de necesidades · ${tituloAmbito}`" :subtitulo="`${plural(total.cantidad, 'necesidad', 'necesidades')} · ${soles(total.importeConocido)} conocido · ${total.sinValorar} sin valorar`" sin-relleno>
        <template #acciones>
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
              <tr v-for="n in pendientes" :key="n.id">
                <td>
                  <router-link v-if="puedeAcceder('centros')" :to="{ name: 'centros', query: { bien: n.id } }" class="text-weight-bold">{{ n.bien.nombre }} · {{ n.id }}</router-link>
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
                      <router-link v-if="puedeValorar" :to="{ name: 'precios', query: { tipo: n.tipo.id } }" class="text-weight-bold">Valorar {{ n.tipo.nombre }}</router-link>
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
                    <q-btn v-if="pasoDe(n)" dense outline no-caps :color="pasoDe(n).color" :icon="pasoDe(n).icono" :label="pasoDe(n).label" @click="abrirPaso(n.bien, pasoDe(n).modo)" />
                    <span v-else-if="siguientePaso(n.bien)" class="sg-muted">Requiere: equipo central</span>
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
        <note-banner tono="ne" icono="info" class="q-ma-md">
          La reposición exige la baja previa del bien. Ninguno de los dos pasos se ejecuta automáticamente al registrar una necesidad.
        </note-banner>
      </section-card>

      <section-card v-if="resultado.porReponer.length" titulo="Bajas pendientes de reposición" subtitulo="Informativo: ya salieron del cálculo de pendientes y no suman al total (regla por validar)">
        <div class="column q-gutter-y-sm">
          <div v-for="r in resultado.porReponer" :key="r.id" class="sg-box">
            <div class="sg-chips"><status-chip v-bind="SITUACIONES.baja" /><status-chip tono="si" label="Sin reposición" /></div>
            <span class="text-weight-bold">{{ r.bien.nombre }} · {{ r.id }}</span>
            <span class="sg-muted">{{ textoUbicacion(r.ubicacion) }}</span>
            <span v-for="e in r.incidentes" :key="e.id" class="sg-muted">{{ TIPOS_EVENTO[e.tipo].label }}: {{ e.titulo }} · {{ fecha(e.fecha) }}</span>
            <div class="row items-center q-gutter-x-md">
              <q-btn v-if="puedeHacer('bien.reposicion')" dense outline no-caps color="primary" icon="swap_horiz" label="Registrar reposición" @click="abrirPaso(r.bien, 'reposicion')" />
              <router-link v-if="puedeAcceder('incidencias')" :to="{ name: 'incidencias', query: { car: r.ubicacion.car.id, hecho: r.incidentes[0].id } }">Ver incidente</router-link>
            </div>
          </div>
        </div>
      </section-card>

      <div class="sg-grid-2">
        <section-card titulo="Infraestructura en evaluación" subtitulo="Se distingue de la reposición de bienes; no se le asigna un costo no sustentado">
          <div class="column q-gutter-y-sm">
            <div v-for="i in resultado.infraestructura" :key="i.id" class="sg-box">
              <div class="sg-chips"><status-chip tono="in" label="Requiere evaluación" /><status-chip tono="si" label="Costo no estimado" /></div>
              <span class="text-weight-bold">{{ i.novedad.titulo }}</span>
              <span class="sg-muted">{{ textoUbicacion(i.ubicacion) }} · informada el {{ fecha(i.novedad.fecha) }}</span>
              <router-link v-if="puedeAcceder('centros')" :to="{ name: 'centros', query: { car: i.ubicacion.car.id, ambiente: i.ubicacion.ambiente.id, novedad: i.id } }">Ver novedad en el ambiente</router-link>
            </div>
            <p v-if="!resultado.infraestructura.length" class="sg-muted q-mb-none">Sin necesidades de infraestructura.</p>
          </div>
        </section-card>

        <section-card titulo="Atendidas y antecedentes insuficientes">
          <div class="column q-gutter-y-sm">
            <div v-for="a in resultado.atendidas" :key="a.id" class="sg-box">
              <div class="sg-chips"><status-chip tono="ok" label="Atendida por reposición" /><status-chip tono="ne" label="No suma" /></div>
              <span class="text-weight-bold">{{ a.anterior.nombre }} · {{ a.anterior.id }}</span>
              <span class="sg-muted">Repuesto por {{ a.nuevo.id }} el {{ fecha(a.evento.fecha) }}</span>
              <router-link v-if="puedeAcceder('incidencias')" :to="{ name: 'incidencias', query: { car: a.ubicacion.car.id, hecho: a.id } }">Ver reposición</router-link>
            </div>
            <div v-for="i in resultado.insuficientes" :key="i.bien.id" class="sg-box sg-box--dashed">
              <div class="sg-chips"><status-chip tono="si" label="Antecedentes insuficientes" /></div>
              <span class="text-weight-bold">{{ i.bien.nombre }} · {{ i.bien.id }}</span>
              <span class="sg-muted">Falta {{ i.faltantes.join(' y ') }}: no se calcula renovación por vida útil.</span>
              <router-link v-if="puedeAcceder('centros')" :to="{ name: 'centros', query: { bien: i.bien.id } }">Completar en la ficha del bien</router-link>
            </div>
            <p v-if="!resultado.atendidas.length && !resultado.insuficientes.length" class="sg-muted q-mb-none">Sin registros.</p>
          </div>
        </section-card>
      </div>
    </div>

    <bien-accion-dialog v-model="dialogoAccion.abierto" :modo="dialogoAccion.modo" :bien="dialogoAccion.bien" />
  </q-page>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import KpiCard from 'components/common/KpiCard.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import BienAccionDialog from 'components/bienes/BienAccionDialog.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useCentroSeleccionado } from 'src/composables/useCentroSeleccionado'
import { useEstadoNavegacion } from 'src/composables/useEstadoNavegacion'
import { carPorId, textoUbicacion } from 'src/services/datos'
import { calcularNecesidades, consolidarPorCar, totalizar } from 'src/services/necesidades'
import { siguientePaso } from 'src/services/bienes'
import { SITUACIONES, TIPOS_EVENTO, TODOS, condicion } from 'src/config/catalogos'
import { ANIO_REVISION, ANIOS_REVISION } from 'src/config/demo'
import { exportarCsv } from 'src/utils/csv'
import { fecha, plural, soles } from 'src/utils/formato'

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

const anio = ref(ANIO_REVISION)
const clase = ref(TODOS)

// Al volver con «Atrás» desde un bien o desde el catálogo se conservan año, centro y clasificación.
useEstadoNavegacion('necesidades', { anio, carId, clase })

const puedeValorar = computed(() => puedeHacer('precio.informar') && puedeAcceder('precios'))

// Siguiente paso de la atención (baja o reposición) si el perfil puede darlo; el paso abre el formulario con el bien ya elegido.
const pasoDe = (n) => {
  const paso = siguientePaso(n.bien)
  return paso && puedeHacer(paso.permiso) ? paso : null
}
const dialogoAccion = reactive({ abierto: false, modo: 'baja', bien: null })
const abrirPaso = (bien, modo) => Object.assign(dialogoAccion, { abierto: true, modo, bien })

// Antecedente de la necesidad: el incidente que la motivó o, si solo es por vida útil, la ficha del bien.
function antecedenteDe (n) {
  const motivo = n.motivos.find((m) => m.eventoId)
  if (motivo && puedeAcceder('incidencias')) return { label: 'Ver incidente', to: { name: 'incidencias', query: { car: n.ubicacion.car.id, hecho: motivo.eventoId } } }
  return null
}

const carsVisibles = computed(() => carIdsVisibles.value.map(carPorId))
const tituloAmbito = computed(() => (carId.value === TODOS ? perfil.value.ambito.descripcion : carPorId(carId.value).nombre))

const resultado = computed(() => calcularNecesidades({ anio: anio.value, carIds: carsVisibles.value.map((c) => c.id) }))
const pendientes = computed(() => resultado.value.pendientes.filter((n) => clase.value === TODOS || n.clase === clase.value))
const total = computed(() => totalizar(pendientes.value))
// El consolidado usa las mismas necesidades filtradas que el detalle para que las cifras coincidan.
const consolidado = computed(() => consolidarPorCar({ ...resultado.value, pendientes: pendientes.value }, carsVisibles.value))

const COLUMNAS_CSV = [
  { titulo: 'Rótulo', valor: (n) => n.id },
  { titulo: 'Bien', valor: (n) => n.bien.nombre },
  { titulo: 'CAR', valor: (n) => n.ubicacion.car.nombre },
  { titulo: 'Ambiente', valor: (n) => n.ubicacion.ambiente.nombre },
  { titulo: 'Clasificación principal', valor: (n) => CLASES[n.clase] },
  { titulo: 'Motivos', valor: (n) => n.motivos.map((m) => m.texto).join(' | ') },
  { titulo: 'Cantidad', valor: (n) => n.cantidad },
  { titulo: 'Precio referencial', valor: (n) => n.precioUnitario ?? 'Sin precio' },
  { titulo: 'Importe', valor: (n) => n.importe ?? 'Sin valorar' }
]

function exportar () {
  const ok = exportarCsv(`sigrec-necesidades-${anio.value}-${carId.value}-${clase.value}.csv`, COLUMNAS_CSV, pendientes.value)
  if (!ok) $q.notify({ type: 'negative', message: 'El navegador bloqueó la descarga del archivo.' })
}
</script>
