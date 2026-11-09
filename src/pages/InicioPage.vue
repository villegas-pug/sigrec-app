<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <!-- Al llegar a Inicio desde otra pantalla (campana o buscador) se ofrece volver a ella (SPEC 011, Ola 4). -->
      <volver-origen class="self-start" />
      <h1 class="sg-hero">
        Sistema Integrado de Gestión de Recursos de Centros <span class="sg-hero__accent">SIGREC</span>
      </h1>
      <div class="sg-hero__bar" aria-hidden="true" />
      <p class="sg-hero__scope">Ámbito: {{ perfil.ambito.descripcion }} · Año de revisión {{ ANIO_REVISION }}</p>

      <div class="sg-kpi-panel">
        <kpi-card
          v-for="kpi in kpis"
          :key="kpi.etiqueta"
          :icono="kpi.icono"
          :tono="kpi.tono"
          :valor="kpi.valor"
          :etiqueta="kpi.etiqueta"
          :nota="kpi.nota"
          :to="kpi.to"
        />
      </div>

      <note-banner v-if="total.sinValorar || total.infraestructura" tono="wa" icono="warning">
        El importe conocido de {{ soles(total.importeConocido) }} no es el presupuesto completo:
        {{ plural(total.sinValorar, 'necesidad no tiene', 'necesidades no tienen') }} precio referencial y
        {{ plural(total.infraestructura, 'necesidad', 'necesidades') }} de infraestructura requieren evaluación.
        <router-link v-if="puedeAcceder('necesidades')" :to="{ name: 'necesidades' }" class="text-weight-bold">Revisar necesidades</router-link>
      </note-banner>

      <atencion-requerida :avisos="avisos" />

      <section-card titulo="Situación por centro" subtitulo="Necesidades, infraestructura, bienes, controles preventivos, vehículos y servicios. Cada cifra abre el detalle que la sustenta." sin-relleno>
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
                  <div class="sg-muted">{{ textoInmueble(f.car) }}</div>
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
            <span class="sg-muted">{{ textoInmueble(f.car) }}</span>
            <div v-for="c in COLUMNAS" :key="c.clave" class="column">
              <span class="sg-kv__label">{{ c.titulo }}</span>
              <celda-tablero :celda="celdas(f)[c.clave]" :titulo="c.titulo" />
            </div>
          </div>
          <p v-if="!filas.length" class="sg-muted q-mb-none">Sin centros en el ámbito del perfil.</p>
        </div>
      </section-card>
    </div>
  </q-page>
</template>

<script setup>
// Inicio (SPEC 011): panel único. Reúne los indicadores, la atención requerida y la situación por centro que antes se
// repartían entre Inicio y el «Tablero de control». Ninguna cifra ni aviso se calcula aquí: vienen de services/situacion.js
// y services/atencion.js.
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import KpiCard from 'components/common/KpiCard.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import SectionCard from 'components/common/SectionCard.vue'
import CeldaTablero from 'components/common/CeldaTablero.vue'
import AtencionRequerida from 'components/inicio/AtencionRequerida.vue'
import VolverOrigen from 'components/layout/VolverOrigen.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { ANIO_SERVICIOS, useAtencion } from 'src/composables/useAtencion'
import { db, vigente } from 'src/services/datos'
import { resumenPorCentro, totalizarSituacion } from 'src/services/situacion'
import { evaluarItinerario, itinerariosDeVehiculo } from 'src/services/combustible'
import { condicion, condicionInmueble } from 'src/config/catalogos'
import { ANIO_REVISION, FECHA_CORTE } from 'src/config/demo'
import { numero, plural, porcentaje, soles } from 'src/utils/formato'

const COLUMNAS = [
  { clave: 'necesidades', titulo: 'Necesidades' },
  { clave: 'infraestructura', titulo: 'Infraestructura' },
  { clave: 'novedades', titulo: 'Novedades abiertas' },
  { clave: 'bienes', titulo: 'Bienes' },
  { clave: 'controles', titulo: 'Controles preventivos' },
  { clave: 'vehiculos', titulo: 'Vehículos' },
  { clave: 'servicios', titulo: 'Servicios' }
]

const $q = useQuasar()
const { perfil, carsEnAmbito, vehiculosEnAmbito, puedeAcceder } = usePerfil()
const { avisos } = useAtencion()

const compacto = computed(() => $q.screen.lt.lg)

const filas = computed(() => resumenPorCentro(carsEnAmbito.value, { fechaCorte: FECHA_CORTE, anioServicios: ANIO_SERVICIOS, anio: ANIO_REVISION }))
const total = computed(() => {
  const t = totalizarSituacion(filas.value)
  const sumar = (clave) => filas.value.reduce((suma, f) => suma + f.necesidades[clave], 0)
  return { ...t, infraestructura: sumar('infraestructura'), atendidas: sumar('atendidas') }
})

const recorridos = computed(() => vehiculosEnAmbito.value.flatMap((v) => itinerariosDeVehiculo(v.id).map((it) => evaluarItinerario(it, v))))
const noComparables = computed(() => recorridos.value.filter((ev) => ev.estado === 'no_comparable').length)

const textoInmueble = (car) => (car.inmueble ? `Inmueble ${condicionInmueble(car.inmueble.condicion).label.toLowerCase()}` : 'Sin datos del inmueble')

// Un indicador sin destino accesible se muestra igual, sin enlace. `#atencion` baja a la lista de avisos de esta misma pantalla.
const ATENCION = { name: 'inicio', query: { aviso: 'control_vencido' }, hash: '#atencion' }
const kpis = computed(() => {
  const t = total.value
  const ambientes = db.ambientes.filter((a) => vigente(a) && carsEnAmbito.value.some((c) => c.id === a.carId)).length
  const lista = [
    { ruta: 'centros', icono: 'home_work', tono: 'azul', valor: t.centros, etiqueta: t.centros === 1 ? 'Centro de Acogida Residencial' : 'Centros de Acogida Residencial', nota: plural(ambientes, 'ambiente registrado', 'ambientes registrados') },
    { ruta: 'necesidades', icono: 'assignment_late', tono: 'rojo', valor: t.necesidades, etiqueta: `Necesidades pendientes ${ANIO_REVISION}`, nota: `${plural(t.infraestructura, 'de infraestructura', 'de infraestructura')} en evaluación · ${plural(t.atendidas, 'atendida', 'atendidas')}` },
    { ruta: 'necesidades', icono: 'payments', tono: 'verde', valor: soles(t.importeConocido), etiqueta: 'Importe estimado conocido', nota: t.sinValorar ? `Incompleto: ${plural(t.sinValorar, 'necesidad sin valorar', 'necesidades sin valorar')}` : 'Todas las necesidades tienen precio' },
    { destino: ATENCION, icono: 'error', tono: 'rojo', valor: t.controlesVencidos, etiqueta: 'Controles vencidos', nota: `${t.controlesPorVencer} por vencer · ${plural(t.extintoresFaltantes, 'extintor faltante', 'extintores faltantes')}` },
    { ruta: 'inventario', query: { vista: 'mal_estado' }, icono: 'build_circle', tono: 'ambar', valor: `${numero(t.bienesMalos)} / ${numero(t.bienesActivos)}`, etiqueta: 'Bienes en mal estado', nota: 'Unidades en condición mala o inservible' },
    { ruta: 'inventario', query: { vista: 'detalle', verificacion: 'registrada' }, icono: 'fact_check', tono: 'verde', valor: `${t.verificados} / ${t.registrosActivos}`, etiqueta: 'Bienes verificados físicamente', nota: `${porcentaje(t.verificados, t.registrosActivos)} % de los registros activos` },
    { ruta: 'vehiculos', query: { estado: 'con_atencion' }, icono: 'directions_car', tono: 'morado', valor: t.vehiculosConAtencion, etiqueta: 'Vehículos con atención', nota: `${soles(t.presupuestoVehiculos)} estimados${t.vehiculosSinEstimar ? ` · ${t.vehiculosSinEstimar} sin estimar` : ''}` },
    { ruta: 'itinerarios', query: { vista: 'ambito' }, icono: 'local_gas_station', tono: 'ambar', valor: recorridos.value.length, etiqueta: 'Recorridos registrados', nota: `${plural(noComparables.value, 'recorrido sin datos suficientes', 'recorridos sin datos suficientes')} para comparar combustible` }
  ]
  return lista.map((k) => ({ ...k, to: k.destino ?? (puedeAcceder(k.ruta) ? { name: k.ruta, ...(k.query ? { query: k.query } : {}) } : null) }))
})

// Cada celda lista sus alertas como chips y enlaza al módulo que las sustenta (solo si el perfil puede acceder).
function celdas (f) {
  const car = f.car.id
  const enlace = (ruta, query = { car }) => (puedeAcceder(ruta) ? { name: ruta, query, ...(ruta === 'inicio' ? { hash: '#atencion' } : {}) } : null)
  const chips = (...items) => {
    const lista = items.filter(Boolean)
    return lista.length ? lista : [{ tono: 'ok', label: 'Sin alertas' }]
  }
  const { necesidades: n, controles: c, vehiculos: v, servicios: s } = f
  return {
    necesidades: {
      to: enlace('necesidades'),
      items: [
        { tono: n.cantidad ? 'da' : 'ok', label: n.cantidad ? `${plural(n.cantidad, 'pendiente', 'pendientes')} · ${soles(n.importeConocido)}` : 'Ninguna pendiente' },
        n.sinValorar ? { tono: 'wa', label: `${n.sinValorar} sin valorar`, to: enlace('necesidades', { car, vista: 'sin_valorar' }) } : null
      ].filter(Boolean)
    },
    infraestructura: {
      // Los ambientes y sus elementos críticos se ven en la pestaña Ambientes del centro; el estado general, en la ficha.
      to: enlace('centros', { car, tab: f.ambientesCriticos || f.elementosCriticos ? 'ambientes' : 'ficha' }),
      items: [
        { ...condicion(f.estadoGeneral), label: `Estado general: ${condicion(f.estadoGeneral).label}`, to: enlace('centros', { car, tab: 'ficha' }) },
        f.ambientesCriticos ? { tono: 'da', label: plural(f.ambientesCriticos, 'ambiente en mal estado', 'ambientes en mal estado'), to: enlace('centros', { car, consulta: 'ambientes_criticos' }) } : null,
        f.elementosCriticos ? { tono: 'wa', label: plural(f.elementosCriticos, 'elemento crítico', 'elementos críticos'), to: enlace('centros', { car, consulta: 'elementos_criticos' }) } : null
      ].filter(Boolean)
    },
    novedades: {
      to: enlace('centros', { car, tab: 'ambientes' }),
      items: [f.novedadesAbiertas ? { tono: 'da', label: plural(f.novedadesAbiertas, 'abierta', 'abiertas'), to: enlace('centros', { car, consulta: 'novedades' }) } : { tono: 'ok', label: 'Ninguna abierta' }]
    },
    bienes: {
      to: enlace('inventario'),
      items: chips(
        { tono: 'ne', label: `${numero(f.bienesActivos)} activos`, to: enlace('inventario', { car, vista: 'detalle' }) },
        f.bienesMalos ? { tono: 'wa', label: `${numero(f.bienesMalos)} en mal estado`, to: enlace('inventario', { car, vista: 'mal_estado' }) } : null,
        { tono: f.verificados === f.registrosActivos ? 'ok' : 'si', label: `${f.verificados} de ${f.registrosActivos} verificados`, to: f.verificados ? enlace('inventario', { car, vista: 'detalle', verificacion: 'registrada' }) : null }
      )
    },
    controles: {
      to: enlace('centros', { car, tab: 'seguridad' }),
      items: chips(
        c.vencidos ? { tono: 'da', label: plural(c.vencidos, 'vencido', 'vencidos'), to: enlace('inicio', { car, aviso: 'control_vencido' }) } : null,
        c.porVencer ? { tono: 'wa', label: `${c.porVencer} por vencer`, to: enlace('inicio', { car, aviso: 'control_por_vencer' }) } : null,
        c.extintoresFaltantes ? { tono: 'wa', label: plural(c.extintoresFaltantes, 'extintor faltante', 'extintores faltantes'), to: enlace('inicio', { car, aviso: 'extintores_faltantes' }) } : null,
        f.fumigacion === 'sin_programar' ? { tono: 'si', label: 'Fumigación sin programar', to: enlace('centros', { car, tab: 'seguridad' }) } : null
      )
    },
    vehiculos: {
      to: enlace('vehiculos'),
      items: v.total
        ? chips(
          v.requierenAtencion ? { tono: 'wa', label: plural(v.requierenAtencion, 'requiere atención', 'requieren atención'), to: enlace('vehiculos', { car, estado: 'con_atencion' }) } : null,
          v.detenidos ? { tono: 'da', label: plural(v.detenidos, 'detenido', 'detenidos'), to: enlace('vehiculos', { car, estado: 'detenido' }) } : null,
          v.requierenAtencion ? { tono: 'ne', label: v.sinEstimar === v.requierenAtencion ? 'Presupuesto sin estimar' : `${soles(v.presupuestoEstimado)} estimados` } : null,
          v.sinInformar ? { tono: 'si', label: `${v.sinInformar} sin estado`, to: enlace('vehiculos', { car, estado: 'sin_informar' }) } : null,
          !v.requierenAtencion && !v.sinInformar ? { tono: 'ok', label: plural(v.operativos, 'operativo', 'operativos'), to: enlace('vehiculos', { car, estado: 'operativo' }) } : null
        )
        : [{ tono: 'si', label: 'Sin vehículos' }]
    },
    servicios: {
      to: enlace('servicios'),
      items: chips(
        s.pendientes ? { tono: 'da', label: plural(s.pendientes, 'pendiente', 'pendientes'), to: enlace('servicios', { car, anio: ANIO_SERVICIOS, alerta: 'pendiente' }) } : null,
        s.interrupciones ? { tono: 'wa', label: plural(s.interrupciones, 'interrupción abierta', 'interrupciones abiertas'), to: enlace('servicios', { car, anio: ANIO_SERVICIOS, alerta: 'interrupcion' }) } : null,
        s.renovaciones ? { tono: 'wa', label: plural(s.renovaciones, 'renovación', 'renovaciones'), to: enlace('servicios', { car, anio: ANIO_SERVICIOS, alerta: 'renovacion' }) } : null,
        s.recurrentes ? { tono: 'wa', label: plural(s.recurrentes, 'recurrente', 'recurrentes'), to: enlace('servicios', { car, anio: ANIO_SERVICIOS, alerta: 'recurrente' }) } : null,
        s.sinInfo ? { tono: 'si', label: `${s.sinInfo} sin información`, to: enlace('servicios', { car, anio: ANIO_SERVICIOS, alerta: 'sin_info' }) } : null
      )
    }
  }
}
</script>
