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
        <q-select v-model="anio" :options="ANIOS_REVISION" outlined dense label="Año a revisar" />
        <q-select v-model="carId" :options="opcionesCar" emit-value map-options outlined dense label="Centro" />
        <q-select v-model="clase" :options="OPCIONES_CLASE" emit-value map-options outlined dense label="Tipo de necesidad" />
        <div class="row items-center sg-chips">
          <status-chip tono="pv" label="Regla de vida útil · Por validar" />
          <status-chip tono="pv" label="Priorización · ampliación posterior" />
        </div>
      </div>

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
                <td><button type="button" class="sg-row-btn" @click="carId = fila.car.id">{{ fila.car.nombre }}</button></td>
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
              </tr>
            </thead>
            <tbody>
              <tr v-for="n in pendientes" :key="n.id">
                <td>
                  <router-link v-if="puedeAcceder('bienes')" :to="{ name: 'bienes', query: { bien: n.id } }" class="text-weight-bold">{{ n.bien.nombre }} · {{ n.id }}</router-link>
                  <span v-else class="text-weight-bold">{{ n.bien.nombre }} · {{ n.id }}</span>
                  <div class="sg-muted">{{ textoUbicacion(n.ubicacion) }}</div>
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
                  <status-chip v-else tono="wa" label="Sin precio" />
                </td>
                <td class="sg-num">
                  <template v-if="n.importe != null">{{ soles(n.importe) }}</template>
                  <status-chip v-else tono="wa" label="Sin valorar" />
                </td>
              </tr>
              <tr v-if="pendientes.length" class="sg-row--total">
                <td colspan="5">Importe conocido</td>
                <td class="sg-num">{{ soles(total.importeConocido) }}<div v-if="total.sinValorar" class="sg-muted">+ {{ plural(total.sinValorar, 'necesidad sin valorar', 'necesidades sin valorar') }}</div></td>
              </tr>
              <tr v-else><td colspan="6" class="sg-muted">Sin necesidades pendientes para los filtros seleccionados.</td></tr>
            </tbody>
          </table>
        </div>
      </section-card>

      <div class="sg-grid-2">
        <section-card titulo="Infraestructura en evaluación" subtitulo="Se distingue de la reposición de bienes; no se le asigna un costo no sustentado">
          <div class="column q-gutter-y-sm">
            <div v-for="i in resultado.infraestructura" :key="i.id" class="sg-box">
              <div class="sg-chips"><status-chip tono="in" label="Requiere evaluación" /><status-chip tono="si" label="Costo no estimado" /></div>
              <span class="text-weight-bold">{{ i.novedad.titulo }}</span>
              <span class="sg-muted">{{ textoUbicacion(i.ubicacion) }} · informada el {{ fecha(i.novedad.fecha) }}</span>
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
            </div>
            <div v-for="i in resultado.insuficientes" :key="i.bien.id" class="sg-box sg-box--dashed">
              <div class="sg-chips"><status-chip tono="si" label="Antecedentes insuficientes" /></div>
              <span class="text-weight-bold">{{ i.bien.nombre }} · {{ i.bien.id }}</span>
              <span class="sg-muted">Falta {{ i.faltantes.join(' y ') }}: no se calcula renovación por vida útil.</span>
            </div>
            <p v-if="!resultado.atendidas.length && !resultado.insuficientes.length" class="sg-muted q-mb-none">Sin registros.</p>
          </div>
        </section-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { exportFile, useQuasar } from 'quasar'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import KpiCard from 'components/common/KpiCard.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useCentroSeleccionado } from 'src/composables/useCentroSeleccionado'
import { carPorId, textoUbicacion } from 'src/services/datos'
import { calcularNecesidades, consolidarPorCar, totalizar } from 'src/services/necesidades'
import { TODOS, condicion } from 'src/config/catalogos'
import { ANIO_REVISION, ANIOS_REVISION } from 'src/config/demo'
import { fecha, plural, soles } from 'src/utils/formato'

const OPCIONES_CLASE = [
  { label: 'Todas', value: TODOS },
  { label: 'Renovación por vida útil', value: 'renovacion' },
  { label: 'Reposición por incidente', value: 'reposicion' }
]

const $q = useQuasar()
const route = useRoute()
const { perfil, puedeAcceder } = usePerfil()
const { carId, opcionesCar, carIdsVisibles } = useCentroSeleccionado(route.query.car, { todos: true })

const anio = ref(ANIO_REVISION)
const clase = ref(TODOS)

const carsVisibles = computed(() => carIdsVisibles.value.map(carPorId))
const tituloAmbito = computed(() => (carId.value === TODOS ? perfil.value.ambito.descripcion : carPorId(carId.value).nombre))

const resultado = computed(() => calcularNecesidades({ anio: anio.value, carIds: carsVisibles.value.map((c) => c.id) }))
const pendientes = computed(() => resultado.value.pendientes.filter((n) => clase.value === TODOS || n.clase === clase.value))
const total = computed(() => totalizar(pendientes.value))
// El consolidado usa las mismas necesidades filtradas que el detalle para que las cifras coincidan.
const consolidado = computed(() => consolidarPorCar({ ...resultado.value, pendientes: pendientes.value }, carsVisibles.value))

function exportar () {
  const escapar = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const filas = [
    ['Rótulo', 'Bien', 'CAR', 'Ambiente', 'Motivos', 'Cantidad', 'Precio referencial', 'Importe'],
    ...pendientes.value.map((n) => [
      n.id,
      n.bien.nombre,
      n.ubicacion.car.nombre,
      n.ubicacion.ambiente.nombre,
      n.motivos.map((m) => m.texto).join(' | '),
      n.cantidad,
      n.precioUnitario ?? 'Sin precio',
      n.importe ?? 'Sin valorar'
    ])
  ]
  const csv = '﻿' + filas.map((f) => f.map(escapar).join(';')).join('\r\n')
  const ok = exportFile(`sigrec-necesidades-${anio.value}.csv`, csv, 'text/csv;charset=utf-8')
  if (ok !== true) $q.notify({ type: 'negative', message: 'El navegador bloqueó la descarga del archivo.' })
}
</script>
