<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #ayuda>
          Informar un pago registra su situación para el control del servicio; no ejecuta el pago ni restablece el suministro.
          Un período sin información no equivale a un pendiente confirmado. Un servicio con 3 o más interrupciones en 12 meses se señala
          como recurrente, y la renovación se avisa con 60 días de anticipación (umbrales provisionales).
          Seleccione una celda del calendario para informar la situación del período (si su perfil puede hacerlo) o consultar su detalle.
        </template>
        <template #acciones>
          <q-btn v-if="puedeHacer('servicio.registrar')" unelevated color="primary" icon="add" label="Registrar servicio" :disable="!car || !noRegistrados.length" @click="abrirServicio(null)" />
        </template>
      </page-header>

      <registro-no-disponible v-if="servicioNoDisponible" entidad="El servicio" :id="servicioPedido" :volver="{ name: 'servicios' }" etiqueta-volver="Ver los servicios del centro" />

      <div class="sg-filters">
        <q-select v-model="carId" :options="opcionesCar" emit-value map-options outlined dense label="Centro">
          <template #append><boton-dictado v-model="carId" tipo="opcion" :opciones="opcionesCar" emit-value /></template>
        </q-select>
        <q-select v-model="anio" :options="ANIOS_SERVICIOS" outlined dense label="Año">
          <template #append><boton-dictado v-model="anio" tipo="opcion" :opciones="ANIOS_SERVICIOS" /></template>
        </q-select>
        <div class="row items-center"><filtro-inactivos v-model="mostrarInactivos" /></div>
      </div>


      <section-card :titulo="`Períodos de pago · ${anio}`" sin-relleno>
        <template #acciones>
          <div class="sg-chips" aria-label="Leyenda">
            <status-chip v-for="(e, clave) in ESTADOS_PERIODO" :key="clave" :tono="e.tono" :label="e.label" />
          </div>
        </template>

        <!-- Pantallas amplias: calendario anual. -->
        <div v-if="!$q.screen.lt.sm" class="sg-table-wrap q-px-sm">
          <table class="sg-periodos">
            <thead>
              <tr>
                <th scope="col" class="sg-periodos__servicio">Servicio</th>
                <th v-for="m in MESES_CORTOS" :key="m" scope="col">{{ m }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="fila in filas" :key="fila.servicio.id">
                <th scope="row" class="sg-periodos__servicio">
                  <button type="button" class="sg-row-btn" @click="seleccionarServicio(fila.servicio.id)"><q-icon name="visibility" size="16px" aria-hidden="true" class="q-mr-xs" />{{ TIPOS_SERVICIO[fila.servicio.tipo] }}</button>
                  <div class="sg-muted">
                    {{ PERIODICIDADES[fila.servicio.periodicidad] }}
                    <span v-if="fila.interrupcion" class="text-weight-bold sg-aviso-texto"> · interrupción abierta</span>
                    <status-chip v-if="fila.servicio.anulacion" v-bind="CHIP_ANULADO" />
                  </div>
                </th>
                <td v-for="celda in fila.celdas" :key="celda.numero" :colspan="celda.span">
                  <celda-periodo
                    :nombre="TIPOS_SERVICIO[fila.servicio.tipo]"
                    :celda="celda"
                    @abrir="abrirPeriodo(fila.servicio, celda)"
                  />
                </td>
              </tr>
              <tr v-for="tipo in noRegistrados" :key="tipo">
                <th scope="row" class="sg-periodos__servicio">{{ TIPOS_SERVICIO[tipo] }}</th>
                <td colspan="12">
                  <button v-if="puedeHacer('servicio.registrar')" type="button" class="sg-celda sg-celda--sin_info" @click="abrirServicio(null, tipo)">
                    <q-icon name="add" size="16px" aria-hidden="true" class="q-mr-xs" />Sin servicio registrado para este centro · Registrar
                  </button>
                  <span v-else class="sg-celda sg-celda--sin_info sg-celda--inerte">Sin servicio registrado para este centro</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Móvil: una tarjeta por servicio con sus períodos. -->
        <div v-else class="column q-gutter-y-md q-px-md q-pb-md">
          <div v-for="fila in filas" :key="fila.servicio.id" class="sg-box">
            <div class="row items-center justify-between no-wrap">
              <button type="button" class="sg-row-btn" @click="seleccionarServicio(fila.servicio.id)"><q-icon name="visibility" size="16px" aria-hidden="true" class="q-mr-xs" />{{ TIPOS_SERVICIO[fila.servicio.tipo] }}</button>
              <span class="sg-muted">{{ PERIODICIDADES[fila.servicio.periodicidad] }}</span>
            </div>
            <div v-if="fila.interrupcion || fila.servicio.anulacion" class="sg-chips">
              <status-chip v-if="fila.interrupcion" tono="wa" label="Interrupción abierta" />
              <status-chip v-if="fila.servicio.anulacion" v-bind="CHIP_ANULADO" />
            </div>
            <div class="sg-periodos-lista">
              <celda-periodo
                v-for="celda in fila.celdas"
                :key="celda.numero"
                :nombre="TIPOS_SERVICIO[fila.servicio.tipo]"
                :celda="celda"
                con-etiqueta
                @abrir="abrirPeriodo(fila.servicio, celda)"
              />
            </div>
          </div>
          <div v-for="tipo in noRegistrados" :key="tipo" class="sg-box sg-box--dashed">
            <span class="text-weight-bold">{{ TIPOS_SERVICIO[tipo] }}</span>
            <span class="sg-muted">Sin servicio registrado para este centro</span>
            <q-btn v-if="puedeHacer('servicio.registrar')" flat dense color="secondary" icon="add" label="Registrar" class="self-start" @click="abrirServicio(null, tipo)" />
          </div>
        </div>

        <div v-for="aviso in avisosContinuidad" :key="aviso.servicio.id" class="q-px-md q-pb-md">
          <note-banner tono="wa" icono="warning">
            {{ aviso.nombre }}: el último período pagado no demuestra continuidad. {{ aviso.celdas.map((c) => c.etiqueta).join(', ') }} siguen sin información.
          </note-banner>
        </div>
      </section-card>

      <div class="sg-grid-2">
        <section-card titulo="Atención pendiente">
          <ul class="sg-timeline">
            <li v-for="(a, i) in avisos" :key="i" class="sg-timeline__item">
              <div class="column q-gutter-y-xs">
                <status-chip v-bind="ETIQUETAS_AVISO[a.clase]" />
                <span><strong>{{ a.nombre }}</strong> · {{ describir(a) }}</span>
                <button v-if="!a.celdas.length && a.servicio.id !== servicioId" type="button" class="sg-row-btn self-start" @click="seleccionarServicio(a.servicio.id)"><q-icon name="visibility" size="16px" aria-hidden="true" class="q-mr-xs" />Ver ficha del servicio</button>
                <button v-if="a.celdas.length" type="button" class="sg-row-btn self-start" @click="abrirPeriodo(a.servicio, a.celdas[0])"><q-icon name="visibility" size="16px" aria-hidden="true" class="q-mr-xs" />Ver detalle del período</button>
              </div>
            </li>
            <li v-if="!avisos.length" class="sg-timeline__item sg-muted">Sin pendientes ni problemas informados.</li>
          </ul>
        </section-card>

        <section-card v-if="servicio" ref="fichaRef" :titulo="`Ficha del servicio · ${TIPOS_SERVICIO[servicio.tipo]}`" :subtitulo="car.nombre">
          <template #acciones>
            <q-btn v-if="puedeHacer('servicio.actualizar')" outline color="secondary" icon="edit" label="Actualizar ficha" :disable="!!servicio.anulacion" @click="abrirServicio(servicio)" />
            <template v-if="puedeHacer('hecho.registrar')">
              <q-btn outline color="secondary" icon="check_circle" label="Informar restablecimiento" :disable="!!servicio.anulacion" @click="abrirHecho(null, 'restablecimiento')" />
              <q-btn outline color="secondary" icon="report_problem" label="Informar interrupción" :disable="!!servicio.anulacion" @click="abrirHecho(null, 'interrupcion')" />
            </template>
            <menu-acciones :items="accionesServicio" :etiqueta="`Acciones del servicio de ${TIPOS_SERVICIO[servicio.tipo]}`" />
          </template>
          <note-banner v-if="servicio.anulacion" tono="ne" icono="block" class="q-mb-md">
            Servicio anulado el {{ fecha(servicio.anulacion.fecha) }} por {{ servicio.anulacion.por }}. Motivo: {{ servicio.anulacion.motivo }}
          </note-banner>
          <div class="sg-kv-grid">
            <key-value etiqueta="Proveedor">{{ servicio.proveedor }}</key-value>
            <key-value etiqueta="Contacto del proveedor">
              <template v-if="servicio.contacto?.telefono || servicio.contacto?.nombre">
                {{ [servicio.contacto.telefono, servicio.contacto.nombre].filter(Boolean).join(' · ') }}
              </template>
              <status-chip v-else tono="si" label="No informado" />
            </key-value>
            <key-value etiqueta="N.º de suministro">{{ servicio.suministro }}</key-value>
            <key-value etiqueta="Contratación">{{ servicio.contratacion }}</key-value>
            <key-value etiqueta="Periodicidad">{{ PERIODICIDADES[servicio.periodicidad] }}</key-value>
            <key-value etiqueta="Situación del suministro">
              <status-chip v-if="interrupcionAbierta(servicio)" tono="wa" label="Interrumpido · restablecimiento no informado" />
              <status-chip v-else tono="ok" label="Sin interrupción abierta" />
            </key-value>
            <key-value etiqueta="Antigüedad del servicio" :nota="servicio.inicio ? `Desde ${fecha(servicio.inicio)}` : ''">
              <template v-if="antiguedad">{{ antiguedad }}</template>
              <status-chip v-else tono="si" label="Antigüedad no informada" />
            </key-value>
            <key-value etiqueta="Renovación o vencimiento" :nota="servicio.renovacion?.detalle || ''">
              <template v-if="renovacion">
                {{ fecha(renovacion.fecha) }}
                <status-chip v-if="renovacion.vencida" tono="da" label="Fecha vencida" />
                <status-chip v-else-if="renovacion.proxima" tono="wa" :label="`En ${plural(renovacion.dias, 'día', 'días')}`" />
              </template>
              <status-chip v-else tono="si" label="No informada" />
            </key-value>
            <key-value etiqueta="Problemas recurrentes" :nota="`Umbral provisional: ${recurrencia.umbral} o más interrupciones en ${recurrencia.meses} meses`">
              <status-chip v-if="recurrencia.recurrente" tono="wa" :label="`Recurrente: ${plural(recurrencia.cantidad, 'interrupción', 'interrupciones')} en ${recurrencia.meses} meses`" />
              <template v-else>{{ plural(recurrencia.cantidad, 'interrupción', 'interrupciones') }} en {{ recurrencia.meses }} meses</template>
            </key-value>
            <key-value etiqueta="Observaciones de instalación">{{ servicio.observaciones || 'Sin observaciones' }}</key-value>
          </div>
          <h3 class="sg-kv__label q-mt-lg q-mb-sm">Hechos informados</h3>
          <ul class="sg-timeline">
            <li v-for="h in hechosOrdenados" :key="h.id ?? `${h.fecha}-${h.detalle}`" class="sg-timeline__item">
              <span class="sg-timeline__date">{{ fecha(h.fecha) }}</span>
              <div class="column col">
                <span>
                  <status-chip v-bind="HECHOS_SERVICIO[h.tipo]" />
                  <status-chip v-if="h.anulacion" v-bind="CHIP_ANULADO" class="q-ml-xs" />
                  {{ h.detalle }}
                </span>
                <span v-if="h.tipo === 'pago'" class="sg-muted">El pago no registra restablecimiento del servicio.</span>
                <span v-if="h.anulacion" class="sg-muted">Anulado el {{ fecha(h.anulacion.fecha) }}: {{ h.anulacion.motivo }}</span>
              </div>
              <menu-acciones :items="accionesHecho(h)" :etiqueta="`Acciones del hecho del ${fecha(h.fecha)}`" />
            </li>
            <li v-if="!hechosOrdenados.length" class="sg-timeline__item sg-muted">Sin hechos informados.</li>
          </ul>
        </section-card>
      </div>
    </div>

    <servicio-dialog
      v-if="car"
      v-model="dialogoServicio.abierto"
      :centro="car"
      :servicio="dialogoServicio.servicio"
      :tipos-disponibles="noRegistrados"
      :tipo-inicial="dialogoServicio.tipo"
      @hecho="seleccionarServicio"
    />
    <periodo-dialog v-if="periodo.servicio" v-model="periodo.abierto" :servicio="periodo.servicio" :celda="periodo.celda" :anio="anio" :solo-lectura="!puedeHacer('servicio.periodo') || !!periodo.servicio.anulacion" />
    <hecho-servicio-dialog v-if="servicio" v-model="dialogoHecho.abierto" :servicio="servicio" :hecho="dialogoHecho.hecho" :tipo-inicial="dialogoHecho.tipo" />
    <anular-dialog v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
  </q-page>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import KeyValue from 'components/common/KeyValue.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import RegistroNoDisponible from 'components/common/RegistroNoDisponible.vue'
import MenuAcciones from 'components/common/MenuAcciones.vue'
import FiltroInactivos from 'components/common/FiltroInactivos.vue'
import AnularDialog from 'components/common/AnularDialog.vue'
import ServicioDialog from 'components/servicios/ServicioDialog.vue'
import PeriodoDialog from 'components/servicios/PeriodoDialog.vue'
import HechoServicioDialog from 'components/servicios/HechoServicioDialog.vue'
import CeldaPeriodo from 'components/servicios/CeldaPeriodo.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useCentroSeleccionado } from 'src/composables/useCentroSeleccionado'
import { useAnulacion } from 'src/composables/useAnulacion'
import { servicioPorId, vigente } from 'src/services/datos'
import { antiguedadServicio, avisosDeServicios, celdasDelServicio, estadoRenovacion, interrupcionAbierta, problemasRecurrentes, serviciosDeCar, tiposNoRegistrados } from 'src/services/servicios'
import { anular } from 'src/services/acciones'
import { CHIP_ANULADO, ESTADOS_PERIODO, HECHOS_SERVICIO, MESES_CORTOS, PERIODICIDADES, TIPOS_SERVICIO } from 'src/config/catalogos'
import { ANIOS_SERVICIOS, FECHA_CORTE } from 'src/config/demo'
import { fecha, plural } from 'src/utils/formato'
import { parametro } from 'src/utils/navegacion'

const ETIQUETAS_AVISO = {
  pendiente_vence: { tono: 'da', label: 'Pendiente con vencimiento' },
  pendiente_sin_fecha: { tono: 'wa', label: 'Pendiente sin fecha' },
  interrupcion: { tono: 'wa', label: 'Interrupción abierta' },
  sin_info: { tono: 'si', label: 'Sin información' },
  renovacion_proxima: { tono: 'wa', label: 'Renovación próxima' },
  renovacion_vencida: { tono: 'da', label: 'Renovación vencida' }
}

const route = useRoute()
const { puedeHacer } = usePerfil()
const { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion } = useAnulacion()

// Enlaces profundos (?servicio=&anio=&periodo=): el centro se deduce del servicio si no se indicó.
const servicioPedido = parametro(route.query.servicio)
const servicioSolicitado = servicioPedido ? servicioPorId(servicioPedido) : null
const { carId, car, opcionesCar } = useCentroSeleccionado(parametro(route.query.car) ?? servicioSolicitado?.carId)

const anio = ref(ANIOS_SERVICIOS.find((a) => String(a) === parametro(route.query.anio)) ?? ANIOS_SERVICIOS.at(-1))
const mostrarInactivos = ref(!!servicioSolicitado?.anulacion)
const fichaRef = ref(null)

// Los servicios anulados solo se listan con «Mostrar inactivos»; los avisos y cálculos usan los vigentes.
const servicios = computed(() => (carId.value ? serviciosDeCar(carId.value, { inactivos: mostrarInactivos.value }) : []))
const serviciosVigentes = computed(() => servicios.value.filter(vigente))
const noRegistrados = computed(() => tiposNoRegistrados(servicios.value))

const filas = computed(() =>
  servicios.value.map((servicio) => ({
    servicio,
    celdas: celdasDelServicio(servicio, anio.value, FECHA_CORTE),
    interrupcion: interrupcionAbierta(servicio)
  }))
)

const avisos = computed(() => avisosDeServicios(serviciosVigentes.value, anio.value, FECHA_CORTE))

// Un período pagado posterior a huecos sin información no prueba continuidad (regla provisional 12).
const avisosContinuidad = computed(() =>
  avisos.value.filter((a) => {
    if (a.clase !== 'sin_info') return false
    const ultimoPagado = Math.max(0, ...(a.servicio.periodos[anio.value]?.pagados ?? []))
    return a.celdas.some((c) => c.numero < ultimoPagado)
  })
)

function describir (aviso) {
  const celda = aviso.celdas[0]
  const motivo = celda?.motivo ? ` Motivo: ${celda.motivo}.` : ''
  if (aviso.clase === 'pendiente_vence') return `${celda.etiqueta} pendiente. Vence el ${fecha(celda.vence)}.${motivo}`
  if (aviso.clase === 'pendiente_sin_fecha') return `${celda.etiqueta} pendiente. Sin fecha aplicable no se señala vencimiento.${motivo}`
  if (aviso.clase === 'interrupcion') return `Interrupción desde el ${fecha(aviso.interrupcion.fecha)}, sin restablecimiento informado.`
  if (aviso.clase === 'renovacion_proxima') return `Renovación o vencimiento el ${fecha(aviso.renovacion.fecha)} (en ${plural(aviso.renovacion.dias, 'día', 'días')}).`
  if (aviso.clase === 'renovacion_vencida') return `La fecha de renovación o vencimiento (${fecha(aviso.renovacion.fecha)}) ya pasó: confirme la renovación o actualice la ficha.`
  return `${plural(aviso.celdas.length, 'período sin información', 'períodos sin información')}: ${aviso.celdas.map((c) => c.etiqueta).join(', ')}.`
}

// Si el servicio pedido no existe o no se puede ver, se avisa y no se elige otro hasta que el usuario cambie de selección.
const servicioNoDisponible = ref(!!servicioPedido && !servicios.value.some((s) => s.id === servicioPedido))
const servicioId = ref(servicioNoDisponible.value ? null : servicioPedido)
watch([carId, anio], () => { servicioNoDisponible.value = false }, { flush: 'sync' })
watch(servicios, (lista) => {
  if (servicioNoDisponible.value) return
  if (!lista.some((s) => s.id === servicioId.value)) {
    servicioId.value = (lista.find((s) => interrupcionAbierta(s)) ?? lista[0])?.id ?? null
  }
}, { immediate: true })
const servicio = computed(() => (servicioId.value ? servicioPorId(servicioId.value) : null))
const antiguedad = computed(() => (servicio.value ? antiguedadServicio(servicio.value, FECHA_CORTE) : null))
const renovacion = computed(() => (servicio.value ? estadoRenovacion(servicio.value, FECHA_CORTE) : null))
const recurrencia = computed(() => problemasRecurrentes(servicio.value, FECHA_CORTE))
const hechosOrdenados = computed(() =>
  [...(servicio.value?.hechos ?? [])].filter((h) => mostrarInactivos.value || vigente(h)).sort((a, b) => b.fecha.localeCompare(a.fecha))
)

const dialogoServicio = reactive({ abierto: false, servicio: null, tipo: null })
const periodo = reactive({ abierto: false, servicio: null, celda: null })
const dialogoHecho = reactive({ abierto: false, hecho: null, tipo: 'interrupcion' })

const seleccionarServicio = (id) => {
  servicioNoDisponible.value = false
  servicioId.value = id
}
const abrirServicio = (srv, tipo = null) => Object.assign(dialogoServicio, { abierto: true, servicio: srv, tipo })
const abrirPeriodo = (srv, celda) => Object.assign(periodo, { abierto: true, servicio: srv, celda })
const abrirHecho = (hecho, tipo = 'interrupcion') => Object.assign(dialogoHecho, { abierto: true, hecho, tipo })

// Con ?periodo= se abre el detalle de ese período al entrar.
const periodoPedido = Number(parametro(route.query.periodo))
if (servicio.value && periodoPedido) {
  const celda = celdasDelServicio(servicio.value, anio.value, FECHA_CORTE).find((c) => c.numero === periodoPedido)
  if (celda) abrirPeriodo(servicio.value, celda)
}

const accionesServicio = computed(() => {
  const s = servicio.value
  if (!s) return []
  return [
    {
      label: 'Anular servicio',
      icono: 'block',
      peligro: true,
      visible: puedeHacer('servicio.anular') && vigente(s),
      accion: () => pedirAnulacion({
        titulo: 'Anular servicio',
        subtitulo: `${TIPOS_SERVICIO[s.tipo]} · ${car.value.nombre}`,
        aviso: 'Sus períodos y hechos se conservan como antecedente. Podrá registrarse de nuevo un servicio del mismo tipo.',
        mensaje: 'Servicio anulado.',
        ejecutar: (datos) => anular(s, datos),
      registro: s
      })
    },
    {
      label: 'Reactivar servicio',
      icono: 'restore',
      visible: puedeHacer('servicio.anular') && !vigente(s),
      accion: () => pedirReactivacion({ entidad: 'servicio', registro: s, nombre: 'Servicio' })
    }
  ]
})

const accionesHecho = (h) => [
  {
    label: 'Actualizar hecho',
    icono: 'edit',
    visible: puedeHacer('hecho.actualizar') && vigente(h) && !servicio.value.anulacion,
    accion: () => abrirHecho(h)
  },
  {
    label: 'Anular hecho',
    icono: 'block',
    peligro: true,
    visible: puedeHacer('hecho.anular') && vigente(h),
    accion: () => pedirAnulacion({
      titulo: 'Anular hecho del servicio',
      subtitulo: `${HECHOS_SERVICIO[h.tipo]?.label ?? h.tipo} · ${fecha(h.fecha)}`,
      aviso: h.tipo === 'interrupcion' || h.tipo === 'restablecimiento'
        ? 'La situación del suministro se recalcula con los hechos vigentes.'
        : 'El hecho se conserva como antecedente. La situación del período no cambia: corríjala desde la celda.',
      mensaje: 'Hecho anulado.',
      ejecutar: (datos) => anular(h, datos),
      registro: h
    })
  },
  {
    label: 'Reactivar hecho',
    icono: 'restore',
    visible: puedeHacer('hecho.anular') && !vigente(h),
    accion: () => pedirReactivacion({ entidad: 'hecho', registro: h, nombre: 'Hecho' })
  }
]
</script>
