<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
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

      <note-banner v-if="total.sinValorar || necesidades.infraestructura.length" tono="wa" icono="warning">
        El importe conocido de {{ soles(total.importeConocido) }} no es el presupuesto completo:
        {{ plural(total.sinValorar, 'necesidad no tiene', 'necesidades no tienen') }} precio referencial y
        {{ plural(necesidades.infraestructura.length, 'necesidad', 'necesidades') }} de infraestructura requieren evaluación.
        <router-link :to="{ name: 'necesidades' }" class="text-weight-bold">Revisar necesidades</router-link>
      </note-banner>

      <div class="sg-grid-2">
        <section-card titulo="Atención requerida" subtitulo="Avisos consultados dentro de SIGREC; destinatarios y otros canales por definir">
          <ul class="sg-timeline">
            <li v-for="aviso in avisos" :key="aviso.id" class="sg-timeline__item">
              <div class="column q-gutter-y-xs" style="min-width: 0">
                <div class="sg-chips items-center">
                  <status-chip :tono="aviso.tono" :label="aviso.etiqueta" />
                  <span class="sg-muted">{{ aviso.contexto }}</span>
                </div>
                <span>{{ aviso.texto }}</span>
                <router-link v-if="aviso.to" :to="aviso.to" class="text-weight-bold">{{ aviso.enlace }}</router-link>
              </div>
            </li>
            <li v-if="!avisos.length" class="sg-timeline__item sg-muted">Sin avisos para el ámbito seleccionado.</li>
          </ul>
        </section-card>

        <section-card titulo="Situación por CAR" subtitulo="Cada cifra abre el detalle que la sustenta" sin-relleno>
          <div class="sg-table-wrap">
            <table class="sg-table">
              <thead>
                <tr>
                  <th scope="col">Centro</th>
                  <th scope="col" class="sg-num">Necesidades</th>
                  <th scope="col" class="sg-num">Importe conocido</th>
                  <th scope="col">Sin valorar</th>
                  <th scope="col">Servicios</th>
                  <th scope="col" class="sg-num">Verificados</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="fila in filasCar" :key="fila.car.id">
                  <td>
                    <router-link :to="{ name: 'centros', query: { car: fila.car.id } }" class="text-weight-bold">{{ fila.car.nombre }}</router-link>
                    <div class="sg-muted">{{ fila.inmueble }}</div>
                  </td>
                  <td class="sg-num">
                    <router-link :to="{ name: 'necesidades', query: { car: fila.car.id } }">{{ fila.cantidad }}</router-link>
                  </td>
                  <td class="sg-num">{{ soles(fila.importeConocido) }}</td>
                  <td>
                    <status-chip :tono="fila.sinValorar ? 'wa' : 'ne'" :label="String(fila.sinValorar)" />
                  </td>
                  <td>
                    <div class="sg-chips">
                      <status-chip v-if="fila.servicios.pendientes" tono="da" :label="plural(fila.servicios.pendientes, 'pendiente', 'pendientes')" />
                      <status-chip v-if="fila.servicios.interrupciones" tono="wa" :label="plural(fila.servicios.interrupciones, 'interrupción', 'interrupciones')" />
                      <status-chip v-if="fila.servicios.sinInfo" tono="si" :label="`${fila.servicios.sinInfo} sin inf.`" />
                      <status-chip v-if="!fila.servicios.pendientes && !fila.servicios.interrupciones && !fila.servicios.sinInfo" tono="ok" label="Al día" />
                    </div>
                  </td>
                  <td class="sg-num">{{ fila.verificados }} de {{ fila.activos }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import KpiCard from 'components/common/KpiCard.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { db, carPorId, ubicacionDeBien, vigente } from 'src/services/datos'
import { calcularNecesidades, consolidarPorCar, totalizar } from 'src/services/necesidades'
import { avisosDeServicios, resumirAvisos, serviciosDeCar } from 'src/services/servicios'
import { evaluarItinerario, itinerariosDeVehiculo } from 'src/services/combustible'
import { ANIO_REVISION, FECHA_CORTE } from 'src/config/demo'
import { INCIDENTES, TIPOS_EVENTO, condicionInmueble } from 'src/config/catalogos'
import { fecha, plural, porcentaje, soles } from 'src/utils/formato'

const { perfil, carsEnAmbito, carIdsEnAmbito, vehiculosEnAmbito, enAmbitoCar, puedeAcceder } = usePerfil()
const anioServicios = Number(FECHA_CORTE.slice(0, 4))

const necesidades = computed(() => calcularNecesidades({ anio: ANIO_REVISION, carIds: carIdsEnAmbito.value }))
const total = computed(() => totalizar(necesidades.value.pendientes))
const consolidado = computed(() => consolidarPorCar(necesidades.value, carsEnAmbito.value))

const servicios = computed(() => carsEnAmbito.value.flatMap((c) => serviciosDeCar(c.id)))
const avisosServicios = computed(() => avisosDeServicios(servicios.value, anioServicios, FECHA_CORTE))
const resumenServicios = computed(() => resumirAvisos(avisosServicios.value))

const bienesActivos = computed(() =>
  db.bienes.filter((b) => b.situacion === 'activo' && enAmbitoCar(ubicacionDeBien(b).car.id))
)
const verificados = computed(() => bienesActivos.value.filter((b) => b.verificacion).length)

const evaluaciones = computed(() =>
  vehiculosEnAmbito.value.flatMap((v) => itinerariosDeVehiculo(v.id).map((it) => ({ it, v, ev: evaluarItinerario(it, v) })))
)
const noComparables = computed(() => evaluaciones.value.filter((e) => e.ev.estado === 'no_comparable'))

const kpis = computed(() => {
  const lista = [
    {
      ruta: 'centros',
      icono: 'home_work',
      tono: 'azul',
      valor: carsEnAmbito.value.length,
      etiqueta: carsEnAmbito.value.length === 1 ? 'Centro de Acogida Residencial' : 'Centros de Acogida Residencial',
      nota: plural(db.ambientes.filter((a) => vigente(a) && enAmbitoCar(a.carId)).length, 'ambiente registrado', 'ambientes registrados')
    },
    {
      ruta: 'necesidades',
      icono: 'assignment_late',
      tono: 'rojo',
      valor: total.value.cantidad,
      etiqueta: `Necesidades pendientes ${ANIO_REVISION}`,
      nota: `${plural(necesidades.value.infraestructura.length, 'de infraestructura', 'de infraestructura')} en evaluación · ${plural(necesidades.value.atendidas.length, 'atendida', 'atendidas')}`
    },
    {
      ruta: 'necesidades',
      icono: 'payments',
      tono: 'verde',
      valor: soles(total.value.importeConocido),
      etiqueta: 'Importe estimado conocido',
      nota: total.value.sinValorar ? `Incompleto: ${plural(total.value.sinValorar, 'necesidad sin valorar', 'necesidades sin valorar')}` : 'Todas las necesidades tienen precio'
    },
    {
      ruta: 'servicios',
      icono: 'receipt_long',
      tono: 'morado',
      valor: resumenServicios.value.pendientes,
      etiqueta: 'Pagos pendientes informados',
      nota: `${plural(resumenServicios.value.interrupciones, 'interrupción abierta', 'interrupciones abiertas')} · ${resumenServicios.value.sinInfo} períodos sin información`
    },
    {
      ruta: 'bienes',
      icono: 'fact_check',
      tono: 'verde',
      valor: `${verificados.value} / ${bienesActivos.value.length}`,
      etiqueta: 'Bienes verificados físicamente',
      nota: `${porcentaje(verificados.value, bienesActivos.value.length)} % de los bienes activos`
    },
    {
      ruta: 'itinerarios',
      icono: 'local_gas_station',
      tono: 'ambar',
      valor: evaluaciones.value.length,
      etiqueta: 'Recorridos registrados',
      nota: `${plural(noComparables.value.length, 'recorrido sin datos suficientes', 'recorridos sin datos suficientes')} para comparar combustible`
    }
  ]
  return lista.filter((k) => puedeAcceder(k.ruta)).map((k) => ({ ...k, to: { name: k.ruta } }))
})

const contextoServicio = (servicio, nombre) => `${carPorId(servicio.carId).nombre} · ${nombre}`

// El enlace lleva al servicio y, si el aviso se refiere a un período, a ese período.
const queryServicio = (a) => ({
  car: a.servicio.carId,
  servicio: a.servicio.id,
  ...(a.clase !== 'interrupcion' && a.celdas[0] ? { anio: anioServicios, periodo: a.celdas[0].numero } : {})
})

const avisos = computed(() => {
  const lista = []
  for (const a of avisosServicios.value) {
    const base = { id: `${a.servicio.id}-${a.clase}-${a.celdas[0]?.numero ?? 0}`, contexto: contextoServicio(a.servicio, a.nombre), to: puedeAcceder('servicios') ? { name: 'servicios', query: queryServicio(a) } : null, enlace: 'Revisar servicio' }
    if (a.clase === 'pendiente_vence') lista.push({ ...base, tono: 'da', etiqueta: 'Pendiente con vencimiento', texto: `${a.celdas[0].etiqueta} ${anioServicios} pendiente de pago. Vence el ${fecha(a.celdas[0].vence)}.` })
    if (a.clase === 'pendiente_sin_fecha') lista.push({ ...base, tono: 'wa', etiqueta: 'Pendiente sin fecha', texto: `${a.celdas[0].etiqueta} pendiente. Sin fecha aplicable no se señala vencimiento.` })
    if (a.clase === 'interrupcion') lista.push({ ...base, tono: 'wa', etiqueta: 'Interrupción abierta', texto: `Interrupción informada el ${fecha(a.interrupcion.fecha)}. Restablecimiento no informado.` })
    if (a.clase === 'sin_info') lista.push({ ...base, tono: 'si', etiqueta: 'Sin información', texto: `${a.celdas.map((c) => c.etiqueta).join(', ')} sin información de pago. No equivale a un pendiente confirmado.` })
  }

  const incidentes = db.eventos.filter((e) => vigente(e) && INCIDENTES.includes(e.tipo) && e.reportaNecesidad)
  for (const evento of incidentes) {
    const abiertas = necesidades.value.pendientes.filter((n) => evento.bienIds.includes(n.id))
    if (!abiertas.length) continue
    const ubicacion = ubicacionDeBien(abiertas[0].bien)
    lista.push({
      id: evento.id,
      tono: 'da',
      etiqueta: TIPOS_EVENTO[evento.tipo].label,
      contexto: `${ubicacion.car.nombre} · ${ubicacion.ambiente.nombre}`,
      texto: `${evento.titulo} (${fecha(evento.fecha)}): ${plural(abiertas.length, 'necesidad abierta', 'necesidades abiertas')}.`,
      to: puedeAcceder('incidencias') ? { name: 'incidencias', query: { car: ubicacion.car.id, hecho: evento.id } } : null,
      enlace: 'Ver antecedentes'
    })
  }

  for (const item of necesidades.value.infraestructura) {
    lista.push({
      id: item.id,
      tono: 'in',
      etiqueta: 'Infraestructura en evaluación',
      contexto: `${item.ubicacion.car.nombre} · ${item.ubicacion.ambiente.nombre}`,
      texto: `${item.novedad.titulo}. Sin costo estimado hasta su evaluación.`,
      to: puedeAcceder('ambientes') ? { name: 'ambientes', query: { car: item.ubicacion.car.id, ambiente: item.ubicacion.ambiente.id, novedad: item.novedad.id } } : null,
      enlace: 'Ver ambiente'
    })
  }

  for (const { it, v, ev } of noComparables.value) {
    lista.push({
      id: it.id,
      tono: 'in',
      etiqueta: 'Datos insuficientes',
      contexto: `Movilidad ${v.id}`,
      texto: `Recorrido ${it.id}: falta ${ev.faltantes.join(' y ')}. No se puede comparar su combustible.`,
      to: puedeAcceder('itinerarios') ? { name: 'itinerarios', query: { vehiculo: v.id, itinerario: it.id } } : null,
      enlace: 'Ver recorrido'
    })
  }
  return lista
})

const filasCar = computed(() =>
  consolidado.value.map((fila) => {
    const activos = bienesActivos.value.filter((b) => ubicacionDeBien(b).car.id === fila.car.id)
    return {
      ...fila,
      inmueble: fila.car.inmueble ? `Inmueble ${condicionInmueble(fila.car.inmueble.condicion).label.toLowerCase()}` : 'Sin datos del inmueble',
      servicios: resumirAvisos(avisosDeServicios(serviciosDeCar(fila.car.id), anioServicios, FECHA_CORTE)),
      activos: activos.length,
      verificados: activos.filter((b) => b.verificacion).length
    }
  })
)
</script>
