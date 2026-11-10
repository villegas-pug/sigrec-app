import { esIncidencia, requiereReposicion } from './incidencias'
// Atención requerida (SPEC 011): fuente única de los avisos de Inicio y del contador de la cabecera.
// Reúne reglas que ya existen en cada módulo (servicios, controles preventivos, vehículos, necesidades y combustible);
// no crea reglas nuevas. Cada aviso trae su destino (enlace profundo) y, si corresponde, la acción que lo resuelve.
import { db, carPorId, ubicacionDeBien, vigente } from './datos'
import { calcularNecesidades } from './necesidades'
import { avisosDeServicios, problemasRecurrentes } from './servicios'
import { controlesPendientes, proximosControles } from './mantenimientos'
import { requiereAtencion } from './vehiculos'
import { evaluarItinerario, itinerariosDeVehiculo } from './combustible'
import { TIPOS_EVENTO, TIPOS_MANTENIMIENTO, estadoVehiculo } from 'src/config/catalogos'
import { PARAMETROS_ATENCION } from 'src/config/demo'
import { diasEntre } from 'src/utils/fechas'
import { fecha, plural, soles } from 'src/utils/formato'

export const CATEGORIAS_AVISO = {
  servicios: 'Servicios',
  seguridad: 'Seguridad y mantenimiento',
  bienes: 'Bienes e infraestructura',
  movilidad: 'Movilidad'
}

const PESO_TONO = { da: 0, wa: 1, in: 2, si: 3 }

const ACCION_MANTENIMIENTO = {
  fumigacion: { label: 'Registrar fumigación', icono: 'pest_control' },
  recarga_extintor: { label: 'Registrar recarga', icono: 'fire_extinguisher' },
  mantenimiento_equipo: { label: 'Registrar mantenimiento', icono: 'handyman' },
  mantenimiento_vehiculo: { label: 'Registrar mantenimiento', icono: 'car_repair' }
}

// Acción que abre el MantenimientoDialog con el tipo y el objetivo precargados.
const accionMantenimiento = (tipo, carId, { bienId = null, vehiculoId = null } = {}) => ({
  tipo: 'mantenimiento',
  permiso: 'mantenimiento.registrar',
  ...ACCION_MANTENIMIENTO[tipo],
  datos: { carId, tipo, bienId, vehiculoId }
})

// Destinos del registro de un mantenimiento: la pestaña de seguridad del centro; un vehículo, además, en Vehículos.
const destinosMantenimiento = (m) => [
  { name: 'centros', query: { mantenimiento: m.id } },
  ...(m.vehiculoId ? [{ name: 'vehiculos', query: { vehiculo: m.vehiculoId } }] : [])
]

const plazo = (dias) => (dias >= 0 ? `en ${plural(dias, 'día', 'días')}` : `hace ${plural(-dias, 'día', 'días')}`)

function avisosServicios (cars, { fechaCorte, anioServicios }) {
  const servicios = cars.flatMap((c) => db.servicios.filter((s) => s.carId === c.id && vigente(s)))
  const lista = []
  for (const a of avisosDeServicios(servicios, anioServicios, fechaCorte)) {
    const celda = a.celdas[0]
    const base = {
      id: `${a.servicio.id}-${a.clase}-${celda?.numero ?? 0}`,
      categoria: 'servicios',
      carId: a.servicio.carId,
      contexto: `${carPorId(a.servicio.carId).nombre} · ${a.nombre}`,
      horizonte: 'ahora',
      // El enlace lleva al servicio y, si el aviso se refiere a un período, a ese período.
      destinos: [{ name: 'servicios', query: { car: a.servicio.carId, servicio: a.servicio.id, ...(celda && !a.clase.startsWith('renovacion') && a.clase !== 'interrupcion' ? { anio: anioServicios, periodo: celda.numero } : {}) } }],
      enlace: 'Revisar servicio'
    }
    const informarPeriodo = { tipo: 'periodo', permiso: 'servicio.periodo', label: 'Informar período', icono: 'payments', datos: { servicioId: a.servicio.id, anio: anioServicios, numero: celda?.numero } }
    const actualizarRenovacion = { tipo: 'servicio', permiso: 'servicio.actualizar', label: 'Actualizar renovación', icono: 'event_repeat', datos: { servicioId: a.servicio.id } }
    if (a.clase === 'pendiente_vence') {
      // Vencido: va a «Ahora». Con vencimiento dentro del horizonte: calendario de «Próximos». Más lejano: sigue en «Ahora».
      const dias = diasEntre(fechaCorte, celda.vence)
      if (dias < 0) lista.push({ ...base, tono: 'da', etiqueta: 'Pendiente vencido', texto: `${celda.etiqueta} ${anioServicios} pendiente de pago. Venció el ${fecha(celda.vence)} (${plazo(dias)}).`, accion: informarPeriodo })
      else if (dias <= PARAMETROS_ATENCION.diasProximos) lista.push({ ...base, horizonte: 'proximo', dias, tono: 'wa', etiqueta: 'Pago por vencer', texto: `${celda.etiqueta} ${anioServicios} pendiente de pago. Vence el ${fecha(celda.vence)} (${plazo(dias)}).`, accion: informarPeriodo })
      else lista.push({ ...base, tono: 'da', etiqueta: 'Pendiente con vencimiento', texto: `${celda.etiqueta} ${anioServicios} pendiente de pago. Vence el ${fecha(celda.vence)}.`, accion: informarPeriodo })
    }
    if (a.clase === 'pendiente_sin_fecha') lista.push({ ...base, tono: 'wa', etiqueta: 'Pendiente sin fecha', texto: `${celda.etiqueta} pendiente. Sin fecha aplicable no se señala vencimiento.`, accion: informarPeriodo })
    if (a.clase === 'sin_info') lista.push({ ...base, tono: 'si', etiqueta: 'Sin información', texto: `${a.celdas.map((c) => c.etiqueta).join(', ')} sin información de pago. No equivale a un pendiente confirmado.`, accion: informarPeriodo })
    if (a.clase === 'interrupcion') lista.push({ ...base, tono: 'wa', etiqueta: 'Interrupción abierta', texto: `Interrupción informada el ${fecha(a.interrupcion.fecha)}. Restablecimiento no informado.`, accion: { tipo: 'hecho', permiso: 'hecho.registrar', label: 'Informar restablecimiento', icono: 'check_circle', datos: { servicioId: a.servicio.id, tipo: 'restablecimiento' } } })
    if (a.clase === 'renovacion_vencida') lista.push({ ...base, tono: 'da', etiqueta: 'Renovación vencida', texto: `La fecha de renovación o vencimiento (${fecha(a.renovacion.fecha)}) ya pasó. Confirme la renovación o actualice la ficha.`, accion: actualizarRenovacion })
    if (a.clase === 'renovacion_proxima') lista.push({ ...base, horizonte: 'proximo', dias: a.renovacion.dias, tono: 'wa', etiqueta: 'Renovación próxima', texto: `Renovación o vencimiento el ${fecha(a.renovacion.fecha)} (${plazo(a.renovacion.dias)}).`, accion: actualizarRenovacion })
  }
  // Problemas recurrentes: se derivan de las interrupciones; no requieren una acción propia.
  for (const s of servicios) {
    const r = problemasRecurrentes(s, fechaCorte)
    if (!r.recurrente) continue
    const nombre = avisosDeServicios([s], anioServicios, fechaCorte)[0]?.nombre ?? s.tipo
    lista.push({
      id: `${s.id}-recurrente`,
      categoria: 'servicios',
      carId: s.carId,
      horizonte: 'ahora',
      tono: 'wa',
      etiqueta: 'Problema recurrente',
      contexto: `${carPorId(s.carId).nombre} · ${nombre}`,
      texto: `${plural(r.cantidad, 'interrupción', 'interrupciones')} en los últimos ${r.meses} meses (umbral provisional: ${r.umbral}).`,
      destinos: [{ name: 'servicios', query: { car: s.carId, servicio: s.id } }],
      enlace: 'Ver hechos del servicio'
    })
  }
  return lista
}

function avisosControles (carIds, { fechaCorte }) {
  const lista = []
  for (const c of controlesPendientes(carIds, fechaCorte)) {
    const car = carPorId(c.carId)
    const base = { id: `control-${c.clave}`, categoria: c.mantenimiento?.vehiculoId ? 'movilidad' : 'seguridad', carId: c.carId, horizonte: 'ahora', contexto: `${car.nombre} · ${c.clase === 'faltante' ? 'Extintores' : TIPOS_MANTENIMIENTO[c.tipo].label}` }
    if (c.clase === 'faltante') {
      lista.push({ ...base, tono: 'wa', tipoAviso: 'extintores_faltantes', etiqueta: 'Extintores faltantes', texto: `Faltan ${plural(c.faltantes, 'extintor', 'extintores')} para completar la dotación requerida.`, destinos: [{ name: 'centros', query: { car: car.id, tab: 'seguridad' } }], enlace: 'Ver control de seguridad' })
    } else if (c.clase === 'vencido') {
      const m = c.mantenimiento
      lista.push({ ...base, tono: 'da', tipoAviso: 'control_vencido', etiqueta: 'Control vencido', texto: `${c.objetivo}: venció el ${fecha(c.proxima)} (${plazo(c.dias)}).`, destinos: destinosMantenimiento(m), enlace: 'Ver registro', accion: accionMantenimiento(m.tipo, m.carId, m) })
    }
    // «Por vencer» va al calendario de próximos vencimientos.
  }
  for (const c of proximosControles(carIds, fechaCorte, PARAMETROS_ATENCION.diasProximos)) {
    const m = c.mantenimiento
    lista.push({
      id: `proximo-${c.clave}`,
      categoria: m.vehiculoId ? 'movilidad' : 'seguridad',
      carId: c.carId,
      horizonte: 'proximo',
      dias: c.dias,
      tono: c.estado === 'por_vencer' ? 'wa' : 'in',
      tipoAviso: c.estado === 'por_vencer' ? 'control_por_vencer' : 'control_programado',
      etiqueta: c.estado === 'por_vencer' ? 'Control por vencer' : 'Control programado',
      contexto: `${carPorId(c.carId).nombre} · ${TIPOS_MANTENIMIENTO[c.tipo].label}`,
      texto: `${c.objetivo}: vence el ${fecha(c.proxima)} (${plazo(c.dias)}).`,
      destinos: destinosMantenimiento(m),
      enlace: 'Ver registro',
      accion: accionMantenimiento(m.tipo, m.carId, m)
    })
  }
  return lista
}

function avisosVehiculos (vehiculos) {
  return vehiculos.filter(requiereAtencion).map((v) => {
    const estado = estadoVehiculo(v.estadoOperativo)
    const presupuesto = v.mantenimiento?.presupuestoEstimado != null ? `${soles(v.mantenimiento.presupuestoEstimado)} estimados` : 'presupuesto sin estimar'
    return {
      id: `vehiculo-${v.id}`,
      categoria: 'movilidad',
      carId: v.carId,
      horizonte: 'ahora',
      tono: v.estadoOperativo === 'detenido' ? 'da' : 'wa',
      etiqueta: estado.label,
      contexto: `${carPorId(v.carId).nombre} · ${v.tipo} ${v.id}`,
      texto: `${v.mantenimiento?.motivo ? `${v.mantenimiento.motivo}. ` : ''}${presupuesto[0].toUpperCase()}${presupuesto.slice(1)}.`,
      destinos: [{ name: 'vehiculos', query: { car: v.carId, vehiculo: v.id } }],
      enlace: 'Ver vehículo',
      accion: accionMantenimiento('mantenimiento_vehiculo', v.carId, { vehiculoId: v.id })
    }
  })
}

function avisosBienes (carIds, { anio }) {
  const necesidades = calcularNecesidades({ anio, carIds })
  const lista = []
  for (const evento of db.eventos.filter((e) => vigente(e) && esIncidencia(e) && (e.bienIds ?? []).some((id) => requiereReposicion(e, id)))) {
    const abiertas = necesidades.pendientes.filter((n) => evento.bienIds.includes(n.id) && requiereReposicion(evento, n.id))
    if (!abiertas.length) continue
    const { car, ambiente } = ubicacionDeBien(abiertas[0].bien)
    lista.push({
      id: evento.id,
      categoria: 'bienes',
      carId: car.id,
      horizonte: 'ahora',
      tono: 'da',
      etiqueta: TIPOS_EVENTO[evento.tipo].label,
      contexto: `${car.nombre} · ${ambiente.nombre}`,
      texto: `${evento.titulo} (${fecha(evento.fecha)}): ${plural(abiertas.length, 'necesidad abierta', 'necesidades abiertas')}.`,
      destinos: [{ name: 'incidencias', query: { car: car.id, hecho: evento.id } }],
      enlace: 'Ver antecedentes'
    })
  }
  for (const item of necesidades.infraestructura) {
    lista.push({
      id: item.id,
      categoria: 'bienes',
      carId: item.ubicacion.car.id,
      horizonte: 'ahora',
      tono: 'in',
      etiqueta: 'Infraestructura en evaluación',
      contexto: `${item.ubicacion.car.nombre} · ${item.ubicacion.ambiente?.nombre ?? 'Centro'}`,
      texto: `${item.novedad.titulo}. Sin costo estimado hasta su evaluación.`,
      destinos: [{ name: 'centros', query: item.esIncidencia ? { hecho: item.id } : { car: item.ubicacion.car.id, ambiente: item.ubicacion.ambiente.id, novedad: item.novedad.id } }],
      enlace: 'Ver ambiente'
    })
  }
  return lista
}

function avisosRecorridos (vehiculos) {
  const lista = []
  for (const v of vehiculos) {
    for (const it of itinerariosDeVehiculo(v.id)) {
      const ev = evaluarItinerario(it, v)
      if (ev.estado !== 'no_comparable') continue
      lista.push({
        id: it.id,
        categoria: 'movilidad',
        carId: v.carId,
        horizonte: 'ahora',
        tono: 'in',
        etiqueta: 'Datos insuficientes',
        contexto: `Movilidad ${v.id}`,
        texto: `Recorrido ${it.id}: falta ${ev.faltantes.join(' y ')}. No se puede comparar su combustible.`,
        destinos: [{ name: 'itinerarios', query: { vehiculo: v.id, itinerario: it.id } }],
        enlace: 'Ver recorrido'
      })
    }
  }
  return lista
}

/**
 * Avisos de los centros y vehículos del ámbito.
 * - `horizonte: 'ahora'`: vencido, pendiente o abierto; ordenados por gravedad.
 * - `horizonte: 'proximo'`: vence en los próximos `PARAMETROS_ATENCION.diasProximos` días; ordenados por fecha.
 * Cada aviso: { id, horizonte, categoria, carId, tono, etiqueta, contexto, texto, destinos, enlace, accion?, dias? }.
 * `destinos` es una lista de alternativas: se usa la primera a la que el perfil tenga acceso.
 */
export function avisosDeAtencion ({ cars, vehiculos, fechaCorte, anio, anioServicios }) {
  const carIds = cars.map((c) => c.id)
  const todos = [
    ...avisosServicios(cars, { fechaCorte, anioServicios }),
    ...avisosControles(carIds, { fechaCorte }),
    ...avisosVehiculos(vehiculos.filter((v) => carIds.includes(v.carId))),
    ...avisosBienes(carIds, { anio }),
    ...avisosRecorridos(vehiculos)
  ]
  return {
    ahora: todos.filter((a) => a.horizonte === 'ahora').sort((a, b) => PESO_TONO[a.tono] - PESO_TONO[b.tono]),
    proximos: todos.filter((a) => a.horizonte === 'proximo').sort((a, b) => a.dias - b.dias)
  }
}
