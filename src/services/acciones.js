// Acciones de la interfaz sobre el almacén en memoria. Registrar una necesidad o un hecho no aprueba compras ni pagos.
import { db, nuevoId, bienPorId, itinerarioPorId } from './datos'
import { nombrePeriodo } from './servicios'
import { FECHA_CORTE } from 'src/config/demo'

const AUTOR = 'Usuario de demostración'

// Los campos numéricos vacíos de un formulario llegan como '' o null: se guardan como dato no informado.
export const numeroONulo = (valor) => (Number.isFinite(valor) ? valor : null)

function registrarEvento (evento) {
  const nuevo = { id: nuevoId('EV'), fecha: FECHA_CORTE, reportaNecesidad: false, informadoPor: AUTOR, ...evento }
  db.eventos.push(nuevo)
  return nuevo
}

export function rotuloSugerido (ambienteId, tipoId) {
  const base = `${ambienteId}-${tipoId.slice(0, 2).toUpperCase()}`
  let n = 1
  while (bienPorId(`${base}${String(n).padStart(2, '0')}`)) n += 1
  return `${base}${String(n).padStart(2, '0')}`
}

export function registrarBien (datos) {
  const bien = { situacion: 'activo', asociadoA: null, verificacion: null, cantidad: 1, ...datos }
  db.bienes.push(bien)
  return bien
}

export function informarVerificacion (bien, { resultado, nota }) {
  bien.verificacion = { fecha: FECHA_CORTE, resultado, nota: nota || null }
  return registrarEvento({
    tipo: 'verificacion',
    titulo: resultado === 'coincide' ? 'Coincide con lo informado' : 'Se informan diferencias',
    detalle: nota || '',
    ambienteId: bien.ambienteId,
    bienIds: [bien.id],
    informadoPor: 'Persona que verifica'
  })
}

// Solo los bienes indicados quedan afectados; el resto del ambiente no cambia por inferencia (CA-11).
export function registrarIncidente ({ tipo, titulo, detalle, ambienteId, bienIds, reportaNecesidad, condicion }) {
  if (condicion) {
    for (const id of bienIds) bienPorId(id).condicion = condicion
  }
  return registrarEvento({ tipo, titulo, detalle, ambienteId, bienIds, reportaNecesidad })
}

// La baja no se propaga: los bienes asociados quedan marcados para revisión individual (CA-12).
export function darDeBaja (bien, { motivo, detalle }) {
  bien.situacion = 'baja'
  for (const hijo of db.bienes.filter((b) => b.asociadoA?.bienId === bien.id && b.situacion === 'activo')) {
    hijo.revisionPendiente = true
  }
  return registrarEvento({ tipo: 'baja', titulo: `Baja: ${motivo}`, detalle, ambienteId: bien.ambienteId, bienIds: [bien.id] })
}

export function cerrarRevision (bien) {
  bien.revisionPendiente = false
}

export const reposicionDe = (bienId) =>
  db.eventos.find((e) => e.tipo === 'reposicion' && e.bienAnteriorId === bienId) ?? null

export function registrarReposicion (anterior, { rotulo, nombre, codigoPatrimonial, fechaAdquisicion, costo, vidaUtilAnios }) {
  const nuevo = registrarBien({
    id: rotulo,
    ambienteId: anterior.ambienteId,
    tipoId: anterior.tipoId,
    nombre,
    categoria: anterior.categoria,
    codigoPatrimonial: codigoPatrimonial || null,
    descripcion: anterior.descripcion,
    condicion: 'bueno',
    deterioro: null,
    adquisicion: { fecha: fechaAdquisicion || null, costo: numeroONulo(costo) },
    vidaUtilAnios: numeroONulo(vidaUtilAnios),
    cantidad: anterior.cantidad ?? 1,
    asociadoA: anterior.asociadoA ? { ...anterior.asociadoA } : null
  })
  registrarEvento({
    tipo: 'reposicion',
    titulo: `Reposición de ${anterior.id}`,
    detalle: 'Alta por reposición.',
    ambienteId: anterior.ambienteId,
    bienIds: [anterior.id, nuevo.id],
    bienAnteriorId: anterior.id,
    bienNuevoId: nuevo.id
  })
  return nuevo
}

// Informar un pago registra su situación para el control del servicio; no ejecuta el pago.
export function informarPeriodo (servicio, anio, numero, { estado, vence }) {
  servicio.periodos[anio] ??= { pagados: [], pendientes: [] }
  const periodo = servicio.periodos[anio]
  periodo.pagados = periodo.pagados.filter((n) => n !== numero)
  periodo.pendientes = periodo.pendientes.filter((p) => p.numero !== numero)
  if (estado === 'pagado') {
    periodo.pagados.push(numero)
    servicio.hechos.push({ fecha: FECHA_CORTE, tipo: 'pago', detalle: `Pago informado del período ${nombrePeriodo(servicio, numero)} ${anio}.` })
  }
  if (estado === 'pendiente') periodo.pendientes.push({ numero, vence: vence || null })
}

export function informarHechoServicio (servicio, { tipo, fecha, detalle }) {
  servicio.hechos.push({ fecha: fecha || FECHA_CORTE, tipo, detalle })
}

export function registrarNovedad (ambiente, datos) {
  ambiente.novedades.push({ id: nuevoId('NOV'), fecha: FECHA_CORTE, atendida: false, informadoPor: AUTOR, ...datos })
}

export function informarPrecio (tipo, { precio, fechaPrecio, procedencia }) {
  Object.assign(tipo, { precio, fechaPrecio: fechaPrecio || null, procedencia: procedencia || null })
}

export function actualizarLocal (local, cambios) {
  Object.assign(local, cambios, { actualizado: { fecha: FECHA_CORTE, por: AUTOR } })
}

export function registrarItinerario (datos) {
  const itinerario = { id: nuevoId('IT'), consumoDeclaradoL: null, ...datos }
  db.itinerarios.push(itinerario)
  return itinerario
}

// Lo realizado se registra aparte de lo previsto para poder distinguirlos (CA-15).
export function informarEjecucion (itinerario, { salida, llegada, km }) {
  itinerario.realizado = { salida: salida || null, llegada: llegada || null, km: numeroONulo(km) }
}

// Un consumo se asocia a un solo recorrido para no contarlo dos veces.
export function registrarCombustible (datos) {
  const registro = { id: nuevoId('CB'), unidad: 'L', ...datos }
  db.combustible.push(registro)
  if (registro.tipo === 'consumo' && registro.itinerarioId) {
    itinerarioPorId(registro.itinerarioId).consumoDeclaradoL = registro.cantidad
  }
  return registro
}
