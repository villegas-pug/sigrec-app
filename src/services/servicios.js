// Reglas de servicios básicos y pagos (RF-13, RF-14, RF-15).
import { db, vigente, vigentes } from './datos'
import { MESES_CORTOS, ORDINALES_TRIMESTRE, TIPOS_SERVICIO } from 'src/config/catalogos'
import { PARAMETROS_SERVICIOS } from 'src/config/demo'
import { diasEntre, mesesEntre, restarMeses } from 'src/utils/fechas'
import { plural } from 'src/utils/formato'

const PERIODOS_POR_ANIO = { mensual: 12, trimestral: 4 }

export const serviciosDeCar = (carId, { inactivos = false } = {}) =>
  db.servicios.filter((s) => s.carId === carId && (inactivos || vigente(s)))

export function nombrePeriodo (servicio, numero) {
  return servicio.periodicidad === 'mensual' ? MESES_CORTOS[numero - 1] : `${ORDINALES_TRIMESTRE[numero - 1]} trimestre`
}

// Una periodicidad solo puede cambiarse mientras el servicio no tenga períodos informados.
export const tienePeriodosInformados = (servicio) =>
  Object.values(servicio.periodos ?? {}).some((p) => p.pagados?.length || p.pendientes?.length)

/**
 * Celdas de un servicio en un año.
 * - Sin registro y con el período ya cerrado a la fecha de corte: «sin información», no pendiente.
 * - El vencimiento solo existe si el pendiente informado trae fecha. El motivo, el detalle y el pago son opcionales.
 */
export function celdasDelServicio (servicio, anio, fechaCorte) {
  const cantidad = PERIODOS_POR_ANIO[servicio.periodicidad]
  const mesesPorPeriodo = 12 / cantidad
  const [anioCorte, mesCorte] = fechaCorte.split('-').map(Number)
  const datos = servicio.periodos?.[anio] ?? { pagados: [], pendientes: [] }

  return Array.from({ length: cantidad }, (_, i) => {
    const numero = i + 1
    const mesFin = numero * mesesPorPeriodo
    const cerrado = anio < anioCorte || (anio === anioCorte && mesFin <= mesCorte)
    const pendiente = datos.pendientes?.find((p) => p.numero === numero)
    let estado = 'por_venir'
    if (datos.pagados?.includes(numero)) estado = 'pagado'
    else if (pendiente) estado = 'pendiente'
    else if (cerrado) estado = 'sin_info'
    return {
      numero,
      etiqueta: nombrePeriodo(servicio, numero),
      span: mesesPorPeriodo,
      estado,
      vence: pendiente?.vence ?? null,
      motivo: pendiente?.motivo ?? null,
      detalle: pendiente?.detalle ?? null,
      pago: estado === 'pagado' ? datos.pagos?.[numero] ?? null : null
    }
  })
}

// Una interrupción sigue abierta si es el último hecho de suministro vigente; un pago no la cierra.
export function interrupcionAbierta (servicio) {
  const suministro = vigentes(servicio.hechos ?? [])
    .filter((h) => h.tipo === 'interrupcion' || h.tipo === 'restablecimiento')
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
  const ultimo = suministro.at(-1)
  return ultimo?.tipo === 'interrupcion' ? ultimo : null
}

export function avisosDeServicios (servicios, anio, fechaCorte) {
  const avisos = []
  for (const servicio of servicios) {
    const celdas = celdasDelServicio(servicio, anio, fechaCorte)
    const nombre = TIPOS_SERVICIO[servicio.tipo]
    for (const celda of celdas.filter((c) => c.estado === 'pendiente')) {
      avisos.push({ clase: celda.vence ? 'pendiente_vence' : 'pendiente_sin_fecha', servicio, nombre, celdas: [celda] })
    }
    const sinInfo = celdas.filter((c) => c.estado === 'sin_info')
    if (sinInfo.length) avisos.push({ clase: 'sin_info', servicio, nombre, celdas: sinInfo })
    const interrupcion = interrupcionAbierta(servicio)
    if (interrupcion) avisos.push({ clase: 'interrupcion', servicio, nombre, interrupcion, celdas: [] })
    const renovacion = estadoRenovacion(servicio, fechaCorte)
    if (renovacion?.proxima || renovacion?.vencida) {
      avisos.push({ clase: renovacion.vencida ? 'renovacion_vencida' : 'renovacion_proxima', servicio, nombre, renovacion, celdas: [] })
    }
  }
  return avisos
}

export function resumirAvisos (avisos) {
  return {
    pendientes: avisos.filter((a) => a.clase.startsWith('pendiente')).length,
    interrupciones: avisos.filter((a) => a.clase === 'interrupcion').length,
    sinInfo: avisos.filter((a) => a.clase === 'sin_info').reduce((suma, a) => suma + a.celdas.length, 0)
  }
}

// Tipos de servicio sin un servicio vigente en el centro (los anulados pueden registrarse de nuevo).
export const tiposNoRegistrados = (servicios) =>
  Object.keys(TIPOS_SERVICIO).filter((tipo) => !vigentes(servicios).some((s) => s.tipo === tipo))

/**
 * Interrupciones vigentes informadas en los últimos `meses` meses hasta la fecha de corte (inclusive).
 * Un servicio es recurrente cuando alcanza el umbral. Se deriva de los hechos: no es un dato que se capture.
 */
export function problemasRecurrentes (servicio, fechaCorte, { meses = PARAMETROS_SERVICIOS.mesesRecurrencia, umbral = PARAMETROS_SERVICIOS.umbralRecurrencia } = {}) {
  const desde = restarMeses(fechaCorte, meses)
  const interrupciones = vigentes(servicio.hechos ?? []).filter((h) => h.tipo === 'interrupcion' && h.fecha > desde && h.fecha <= fechaCorte)
  return { cantidad: interrupciones.length, meses, umbral, recurrente: interrupciones.length >= umbral }
}

// Antigüedad del servicio a la fecha de corte a partir de `inicio` ('AAAA' o 'AAAA-MM'); null si no se informó.
export function antiguedadServicio (servicio, fechaCorte) {
  if (!servicio.inicio) return null
  const meses = Math.max(0, mesesEntre(servicio.inicio, fechaCorte.slice(0, 7)))
  const anios = Math.floor(meses / 12)
  const resto = meses % 12
  if (!anios && !resto) return 'Menos de un mes'
  // Con solo el año conocido se omiten los meses: no se inventa precisión.
  if (servicio.inicio.length === 4) return plural(anios, 'año', 'años')
  return [anios ? plural(anios, 'año', 'años') : null, resto ? plural(resto, 'mes', 'meses') : null].filter(Boolean).join(' y ')
}

// Estado de la renovación a la fecha de corte: días que faltan (negativos si ya pasó) y si corresponde avisar.
export function estadoRenovacion (servicio, fechaCorte, { diasAviso = PARAMETROS_SERVICIOS.diasAvisoRenovacion } = {}) {
  const fecha = servicio.renovacion?.fecha
  if (!fecha) return null
  const dias = diasEntre(fechaCorte, fecha)
  return { fecha, dias, vencida: dias < 0, proxima: dias >= 0 && dias <= diasAviso }
}
