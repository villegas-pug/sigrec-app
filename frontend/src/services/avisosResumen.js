// SPEC 044. Redacta los avisos de «Atención requerida» que el backend selecciona (`GET /inicio/resumen`).
// El backend decide qué avisos existen, su horizonte, tono y orden; aquí se les da el texto, los destinos y la acción, con las
// mismas frases y enlaces que `services/atencion.js` (que sigue siendo la referencia de la prueba de equivalencia).
import { TIPOS_EVENTO, TIPOS_MANTENIMIENTO, TIPOS_SERVICIO, estadoVehiculo } from 'src/config/catalogos'
import { PARAMETROS_SERVICIOS } from 'src/config/reglas'
import { accionMantenimiento, destinosMantenimiento, plazo } from './atencion'
import { nombrePeriodo } from './servicios'
import { fecha, plural, soles } from 'src/utils/formato'

const nombreServicio = (tipo) => TIPOS_SERVICIO[tipo] ?? tipo
const etiquetaPeriodo = (d, numero) => nombrePeriodo({ periodicidad: d.periodicidad }, numero)
const etiquetaTipoMantenimiento = (tipo) => TIPOS_MANTENIMIENTO[tipo]?.label ?? tipo

// Acciones de servicios: abren el diálogo de período o de la ficha del servicio.
const informarPeriodo = (d, numero) => ({ tipo: 'periodo', permiso: 'servicio.periodo', label: 'Informar período', icono: 'payments', datos: { servicioId: d.servicioId, anio: d.anio, numero } })
const actualizarRenovacion = (d) => ({ tipo: 'servicio', permiso: 'servicio.actualizar', label: 'Actualizar renovación', icono: 'event_repeat', datos: { servicioId: d.servicioId } })

// El enlace lleva al servicio y, si el aviso se refiere a un período, a ese período.
const servicio = (raw, d, nombreCar, numero = null) => ({
  contexto: `${nombreCar(raw.carId)} · ${nombreServicio(d.tipoServicio)}`,
  destinos: [{ name: 'servicios', query: { car: raw.carId, servicio: d.servicioId, ...(numero != null ? { anio: d.anio, periodo: numero } : {}) } }],
  enlace: 'Revisar servicio'
})

// Controles preventivos: el texto es el mismo para vencidos, por vencer y programados.
const control = (raw, d, nombreCar, etiqueta, verbo) => ({
  etiqueta,
  contexto: `${nombreCar(raw.carId)} · ${etiquetaTipoMantenimiento(d.tipoMantenimiento)}`,
  texto: `${d.objetivo}: ${verbo} el ${fecha(d.proxima)} (${plazo(d.dias)}).`,
  destinos: destinosMantenimiento({ id: d.mantenimientoId, vehiculoId: d.vehiculoId ?? null }),
  enlace: 'Ver registro',
  accion: accionMantenimiento(d.tipoMantenimiento, raw.carId, { bienId: d.bienId ?? null, vehiculoId: d.vehiculoId ?? null })
})

const REDACTORES = {
  pendiente_vencido: (raw, d, nombreCar) => ({
    ...servicio(raw, d, nombreCar, d.numero),
    etiqueta: 'Pendiente vencido',
    texto: `${etiquetaPeriodo(d, d.numero)} ${d.anio} pendiente de pago. Venció el ${fecha(d.vence)} (${plazo(d.dias)}).`,
    accion: informarPeriodo(d, d.numero)
  }),
  pendiente_por_vencer: (raw, d, nombreCar) => ({
    ...servicio(raw, d, nombreCar, d.numero),
    etiqueta: 'Pago por vencer',
    texto: `${etiquetaPeriodo(d, d.numero)} ${d.anio} pendiente de pago. Vence el ${fecha(d.vence)} (${plazo(d.dias)}).`,
    accion: informarPeriodo(d, d.numero)
  }),
  pendiente_con_vencimiento: (raw, d, nombreCar) => ({
    ...servicio(raw, d, nombreCar, d.numero),
    etiqueta: 'Pendiente con vencimiento',
    texto: `${etiquetaPeriodo(d, d.numero)} ${d.anio} pendiente de pago. Vence el ${fecha(d.vence)}.`,
    accion: informarPeriodo(d, d.numero)
  }),
  pendiente_sin_fecha: (raw, d, nombreCar) => ({
    ...servicio(raw, d, nombreCar, d.numero),
    etiqueta: 'Pendiente sin fecha',
    texto: `${etiquetaPeriodo(d, d.numero)} pendiente. Sin fecha aplicable no se señala vencimiento.`,
    accion: informarPeriodo(d, d.numero)
  }),
  sin_info: (raw, d, nombreCar) => ({
    ...servicio(raw, d, nombreCar, d.numeros[0]),
    etiqueta: 'Sin información',
    texto: `${d.numeros.map((n) => etiquetaPeriodo(d, n)).join(', ')} sin información de pago. No equivale a un pendiente confirmado.`,
    accion: informarPeriodo(d, d.numeros[0])
  }),
  interrupcion_abierta: (raw, d, nombreCar) => ({
    ...servicio(raw, d, nombreCar),
    etiqueta: 'Interrupción abierta',
    texto: `Interrupción informada el ${fecha(d.fecha)}. Restablecimiento no informado.`,
    accion: { tipo: 'hecho', permiso: 'hecho.registrar', label: 'Informar restablecimiento', icono: 'check_circle', datos: { servicioId: d.servicioId, tipo: 'restablecimiento' } }
  }),
  renovacion_vencida: (raw, d, nombreCar) => ({
    ...servicio(raw, d, nombreCar),
    etiqueta: 'Renovación vencida',
    texto: `La fecha de renovación o vencimiento (${fecha(d.fecha)}) ya pasó. Confirme la renovación o actualice la ficha.`,
    accion: actualizarRenovacion(d)
  }),
  renovacion_proxima: (raw, d, nombreCar) => ({
    ...servicio(raw, d, nombreCar),
    etiqueta: 'Renovación próxima',
    texto: `Renovación o vencimiento el ${fecha(d.fecha)} (${plazo(d.dias)}).`,
    accion: actualizarRenovacion(d)
  }),
  problema_recurrente: (raw, d, nombreCar) => ({
    etiqueta: 'Problema recurrente',
    contexto: `${nombreCar(raw.carId)} · ${nombreServicio(d.tipoServicio)}`,
    texto: `${plural(d.cantidad, 'interrupción', 'interrupciones')} en los últimos ${PARAMETROS_SERVICIOS.mesesRecurrencia} meses (umbral provisional: ${PARAMETROS_SERVICIOS.umbralRecurrencia}).`,
    destinos: [{ name: 'servicios', query: { car: raw.carId, servicio: d.servicioId } }],
    enlace: 'Ver hechos del servicio'
  }),
  extintores_faltantes: (raw, d, nombreCar) => ({
    etiqueta: 'Extintores faltantes',
    contexto: `${nombreCar(raw.carId)} · Extintores`,
    texto: `Faltan ${plural(d.faltantes, 'extintor', 'extintores')} para completar la dotación requerida.`,
    destinos: [{ name: 'centros', query: { car: raw.carId, tab: 'seguridad' } }],
    enlace: 'Ver control de seguridad'
  }),
  control_vencido: (raw, d, nombreCar) => control(raw, d, nombreCar, 'Control vencido', 'venció'),
  control_por_vencer: (raw, d, nombreCar) => control(raw, d, nombreCar, 'Control por vencer', 'vence'),
  control_programado: (raw, d, nombreCar) => control(raw, d, nombreCar, 'Control programado', 'vence'),
  vehiculo_atencion: (raw, d, nombreCar) => {
    const presupuesto = d.presupuesto != null ? `${soles(d.presupuesto)} estimados` : 'presupuesto sin estimar'
    return {
      etiqueta: estadoVehiculo(d.estadoOperativo).label,
      contexto: `${nombreCar(raw.carId)} · ${d.tipoVehiculo} ${d.vehiculoId}`,
      texto: `${d.motivo ? `${d.motivo}. ` : ''}${presupuesto[0].toUpperCase()}${presupuesto.slice(1)}.`,
      destinos: [{ name: 'vehiculos', query: { car: raw.carId, vehiculo: d.vehiculoId } }],
      enlace: 'Ver vehículo',
      accion: accionMantenimiento('mantenimiento_vehiculo', raw.carId, { vehiculoId: d.vehiculoId })
    }
  },
  incidente_reposicion: (raw, d) => ({
    etiqueta: TIPOS_EVENTO[d.tipoEvento]?.label ?? d.tipoEvento,
    contexto: d.ubicacion,
    texto: `${d.titulo} (${fecha(d.fecha)}): ${plural(d.cantidad, 'necesidad abierta', 'necesidades abiertas')}.`,
    destinos: [{ name: 'incidencias', query: { car: raw.carId, hecho: d.eventoId } }],
    enlace: 'Ver antecedentes'
  }),
  infraestructura_evaluacion: (raw, d) => ({
    etiqueta: 'Infraestructura en evaluación',
    contexto: d.ubicacion,
    texto: `${d.titulo}. Sin costo estimado hasta su evaluación.`,
    destinos: [{ name: 'centros', query: d.esIncidencia ? { hecho: raw.id } : { car: raw.carId, ambiente: d.ambienteId, novedad: raw.id } }],
    enlace: 'Ver ambiente'
  }),
  recorrido_insuficiente: (raw, d) => ({
    etiqueta: 'Datos insuficientes',
    contexto: `Movilidad ${d.vehiculoId}`,
    texto: `Recorrido ${d.itinerarioId}: falta ${d.faltantes.join(' y ')}. No se puede comparar su combustible.`,
    destinos: [{ name: 'itinerarios', query: { vehiculo: d.vehiculoId, itinerario: d.itinerarioId } }],
    enlace: 'Ver recorrido'
  })
}

/**
 * Convierte un aviso del backend en el aviso que muestra la interfaz:
 * { id, categoria, carId, horizonte, tono, etiqueta, contexto, texto, destinos, enlace, accion?, dias?, tipoAviso? }.
 * `nombreCar(carId)` resuelve el nombre del centro. Devuelve null si la clase es desconocida (backend más nuevo que la SPA).
 */
export function avisoDesdeCrudo (raw, nombreCar) {
  const redactar = REDACTORES[raw.clase]
  if (!redactar) return null
  return {
    id: raw.id,
    categoria: raw.categoria,
    carId: raw.carId,
    horizonte: raw.horizonte,
    tono: raw.tono,
    ...(raw.dias != null ? { dias: raw.dias } : {}),
    ...(raw.tipoAviso ? { tipoAviso: raw.tipoAviso } : {}),
    ...redactar(raw, raw.datos ?? {}, nombreCar)
  }
}

/** Redacta la lista de avisos del backend y descarta las clases que la SPA no conoce. */
export function avisosDesdeResumen (avisos, nombreCar) {
  const redactar = (lista) => lista.map((a) => avisoDesdeCrudo(a, nombreCar)).filter(Boolean)
  return { ahora: redactar(avisos.ahora), proximos: redactar(avisos.proximos) }
}
