<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header />

      <note-banner tono="in">
        Vista de control para la unidad central. Reúne por centro lo que ya se registra en los demás módulos; cada cifra abre el detalle que la sustenta.
        Los indicadores y umbrales son provisionales, por validar con las direcciones de los centros.
      </note-banner>

      <div class="sg-kpi-panel">
        <kpi-card icono="home_work" tono="azul" :valor="total.centros" etiqueta="Centros en el ámbito" :nota="perfil.ambito.descripcion" />
        <kpi-card icono="error" tono="rojo" :valor="total.controlesVencidos" etiqueta="Controles vencidos" :nota="`${total.controlesPorVencer} por vencer · ${plural(total.extintoresFaltantes, 'extintor faltante', 'extintores faltantes')}`" />
        <kpi-card icono="build_circle" tono="ambar" :valor="`${numero(total.bienesMalos)} / ${numero(total.bienesActivos)}`" etiqueta="Bienes en mal estado" nota="Condición mala o inservible, sobre bienes activos" :to="puedeAcceder('inventario') ? { name: 'inventario' } : null" />
        <kpi-card icono="directions_car" tono="morado" :valor="total.vehiculosConAtencion" etiqueta="Vehículos con atención" :nota="`${soles(total.presupuestoVehiculos)} estimados${total.vehiculosSinEstimar ? ` · ${total.vehiculosSinEstimar} sin estimar` : ''}`" :to="puedeAcceder('vehiculos') ? { name: 'vehiculos' } : null" />
      </div>

      <section-card titulo="Estado por centro" subtitulo="Infraestructura, bienes, controles preventivos, vehículos y servicios" sin-relleno>
        <div v-if="!compacto" class="sg-table-wrap">
          <table class="sg-table">
            <thead>
              <tr>
                <th scope="col">Centro</th>
                <th v-for="c in COLUMNAS" :key="c.clave" scope="col">{{ c.titulo }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="f in filas" :key="f.car.id">
                <td>
                  <router-link v-if="puedeAcceder('centros')" :to="{ name: 'centros', query: { car: f.car.id } }" class="text-weight-bold">{{ f.car.nombre }}</router-link>
                  <span v-else class="text-weight-bold">{{ f.car.nombre }}</span>
                  <div class="sg-muted">{{ condicionInmueble(f.car.inmueble.condicion).label }}</div>
                </td>
                <td v-for="c in COLUMNAS" :key="c.clave">
                  <celda-tablero :celda="celdas(f)[c.clave]" :titulo="c.titulo" />
                </td>
              </tr>
              <tr v-if="!filas.length"><td :colspan="COLUMNAS.length + 1" class="sg-muted">Sin centros en el ámbito del perfil.</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Pantallas estrechas: una tarjeta por centro. -->
        <div v-else class="column q-gutter-y-md q-px-md q-pb-md">
          <div v-for="f in filas" :key="f.car.id" class="sg-box">
            <router-link v-if="puedeAcceder('centros')" :to="{ name: 'centros', query: { car: f.car.id } }" class="text-weight-bold">{{ f.car.nombre }}</router-link>
            <span v-else class="text-weight-bold">{{ f.car.nombre }}</span>
            <div v-for="c in COLUMNAS" :key="c.clave" class="column">
              <span class="sg-kv__label">{{ c.titulo }}</span>
              <celda-tablero :celda="celdas(f)[c.clave]" :titulo="c.titulo" />
            </div>
          </div>
          <p v-if="!filas.length" class="sg-muted q-mb-none">Sin centros en el ámbito del perfil.</p>
        </div>
      </section-card>

      <section-card titulo="Consulta por equipo" subtitulo="¿Qué centros tienen este equipo, en qué condición, cuándo recibió mantenimiento y dónde requiere atención?" sin-relleno>
        <template #acciones>
          <q-select v-model="tipoId" :options="opcionesTipo" emit-value map-options outlined dense label="Tipo de bien" style="min-width: min(280px, 100%)">
            <template #append><boton-dictado v-model="tipoId" tipo="opcion" :opciones="opcionesTipo" emit-value /></template>
          </q-select>
        </template>

        <div class="q-px-md q-pt-md sg-chips">
          <status-chip tono="in" :label="`${centrosConEquipo} de ${plural(equipo.length, 'centro', 'centros')} tienen este equipo`" />
          <status-chip v-if="centrosConAtencion" tono="da" :label="`${plural(centrosConAtencion, 'centro requiere', 'centros requieren')} atención`" />
          <status-chip tono="ne" :label="`${numero(unidadesEquipo)} unidades activas`" />
        </div>

        <div v-if="!compactoEquipo" class="sg-table-wrap">
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
                  <router-link v-if="puedeAcceder('centros')" :to="{ name: 'centros', query: { car: e.car.id } }" class="text-weight-bold">{{ e.car.nombre }}</router-link>
                  <span v-else class="text-weight-bold">{{ e.car.nombre }}</span>
                </td>
                <td class="sg-num">{{ e.cantidad }}</td>
                <td><condicion-equipo :fila="e" /></td>
                <td><template v-if="e.ultimoFecha">{{ fecha(e.ultimoFecha) }}</template><span v-else class="sg-muted">{{ e.cantidad ? 'Sin registro' : '—' }}</span></td>
                <td><status-chip v-if="e.estadoControl" v-bind="ESTADOS_CONTROL[e.estadoControl]" /><span v-else class="sg-muted">—</span></td>
                <td><atencion-equipo :fila="e" /></td>
              </tr>
              <tr v-if="!equipo.length"><td colspan="6" class="sg-muted">Sin centros en el ámbito del perfil.</td></tr>
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
            </div>
          </div>
        </div>
      </section-card>
    </div>
  </q-page>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import KpiCard from 'components/common/KpiCard.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import CeldaTablero from 'components/common/CeldaTablero.vue'
import CondicionEquipo from 'components/common/CondicionEquipo.vue'
import AtencionEquipo from 'components/common/AtencionEquipo.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useEstadoNavegacion } from 'src/composables/useEstadoNavegacion'
import { db, vigentes } from 'src/services/datos'
import { consultaPorTipo, requiereAtencionEquipo, resumenPorCentro, totalizarTablero } from 'src/services/tablero'
import { ESTADOS_CONTROL, TIPO_EXTINTOR, condicion, condicionInmueble } from 'src/config/catalogos'
import { ANIO_REVISION, FECHA_CORTE } from 'src/config/demo'
import { fecha, numero, plural, soles } from 'src/utils/formato'

const COLUMNAS = [
  { clave: 'infraestructura', titulo: 'Infraestructura' },
  { clave: 'novedades', titulo: 'Novedades abiertas' },
  { clave: 'bienes', titulo: 'Bienes' },
  { clave: 'controles', titulo: 'Controles preventivos' },
  { clave: 'vehiculos', titulo: 'Vehículos' },
  { clave: 'servicios', titulo: 'Servicios' }
]

const $q = useQuasar()
const { perfil, carsEnAmbito, puedeAcceder } = usePerfil()

const compacto = computed(() => $q.screen.lt.lg)
const compactoEquipo = computed(() => $q.screen.lt.md)

const parametros = { fechaCorte: FECHA_CORTE, anioServicios: Number(FECHA_CORTE.slice(0, 4)) }
const filas = computed(() => resumenPorCentro(carsEnAmbito.value, parametros))
const total = computed(() => totalizarTablero(filas.value))

// Cada celda lista sus alertas como chips y enlaza al módulo que las sustenta (solo si el perfil puede acceder).
function celdas (f) {
  const q = { car: f.car.id }
  const enlace = (ruta, query = q) => (puedeAcceder(ruta) ? { name: ruta, query } : null)
  const chips = (...items) => {
    const lista = items.filter(Boolean)
    return lista.length ? lista : [{ tono: 'ok', label: 'Sin alertas' }]
  }
  const c = f.controles
  const v = f.vehiculos
  const s = f.servicios
  return {
    infraestructura: {
      to: enlace('centros'),
      items: [
        { ...condicion(f.estadoGeneral), label: `Estado general: ${condicion(f.estadoGeneral).label}` },
        f.ambientesCriticos ? { tono: 'da', label: plural(f.ambientesCriticos, 'ambiente en mal estado', 'ambientes en mal estado') } : null,
        f.elementosCriticos ? { tono: 'wa', label: plural(f.elementosCriticos, 'elemento crítico', 'elementos críticos') } : null
      ].filter(Boolean)
    },
    novedades: {
      to: enlace('centros'),
      items: [f.novedadesAbiertas ? { tono: 'da', label: plural(f.novedadesAbiertas, 'abierta', 'abiertas') } : { tono: 'ok', label: 'Ninguna abierta' }]
    },
    bienes: {
      to: enlace('inventario'),
      items: chips(
        { tono: 'ne', label: `${numero(f.bienesActivos)} activos` },
        f.bienesMalos ? { tono: 'wa', label: `${numero(f.bienesMalos)} en mal estado` } : null
      )
    },
    controles: {
      to: enlace('centros', { ...q, seguridad: '1' }),
      items: chips(
        c.vencidos ? { tono: 'da', label: plural(c.vencidos, 'vencido', 'vencidos') } : null,
        c.porVencer ? { tono: 'wa', label: `${c.porVencer} por vencer` } : null,
        c.extintoresFaltantes ? { tono: 'wa', label: plural(c.extintoresFaltantes, 'extintor faltante', 'extintores faltantes') } : null,
        f.fumigacion === 'sin_programar' ? { tono: 'si', label: 'Fumigación sin programar' } : null
      )
    },
    vehiculos: {
      to: enlace('vehiculos', {}),
      items: v.total
        ? chips(
          v.requierenAtencion ? { tono: 'wa', label: `${plural(v.requierenAtencion, 'requiere atención', 'requieren atención')} · ${v.detenidos} detenidos` } : null,
          v.requierenAtencion ? { tono: 'ne', label: v.sinEstimar === v.requierenAtencion ? 'Presupuesto sin estimar' : `${soles(v.presupuestoEstimado)} estimados` } : null,
          v.sinInformar ? { tono: 'si', label: `${v.sinInformar} sin estado` } : null,
          !v.requierenAtencion && !v.sinInformar ? { tono: 'ok', label: `${plural(v.operativos, 'operativo', 'operativos')}` } : null
        )
        : [{ tono: 'si', label: 'Sin vehículos' }]
    },
    servicios: {
      to: enlace('servicios'),
      items: chips(
        s.pendientes ? { tono: 'da', label: plural(s.pendientes, 'pendiente', 'pendientes') } : null,
        s.interrupciones ? { tono: 'wa', label: plural(s.interrupciones, 'interrupción abierta', 'interrupciones abiertas') } : null,
        s.renovaciones ? { tono: 'wa', label: plural(s.renovaciones, 'renovación', 'renovaciones') } : null,
        s.recurrentes ? { tono: 'wa', label: plural(s.recurrentes, 'recurrente', 'recurrentes') } : null,
        s.sinInfo ? { tono: 'si', label: `${s.sinInfo} sin información` } : null
      )
    }
  }
}

// ---------- Consulta por equipo ----------
const opcionesTipo = computed(() =>
  vigentes(db.tiposBien).map((t) => ({ value: t.id, label: t.nombre })).sort((a, b) => a.label.localeCompare(b.label, 'es'))
)
const tipoId = ref(opcionesTipo.value.some((o) => o.value === TIPO_EXTINTOR) ? TIPO_EXTINTOR : opcionesTipo.value[0]?.value ?? null)

// Al volver con «Atrás» se conserva el equipo consultado.
useEstadoNavegacion('tablero', { tipoId })

const equipo = computed(() => (tipoId.value ? consultaPorTipo(tipoId.value, carsEnAmbito.value, { anio: ANIO_REVISION, fechaCorte: FECHA_CORTE }) : []))
const centrosConEquipo = computed(() => equipo.value.filter((e) => e.cantidad > 0).length)
const centrosConAtencion = computed(() => equipo.value.filter(requiereAtencionEquipo).length)
const unidadesEquipo = computed(() => equipo.value.reduce((suma, e) => suma + e.cantidad, 0))
</script>
