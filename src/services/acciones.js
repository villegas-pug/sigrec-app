// Acciones de la interfaz sobre el almacén en memoria. Registrar una necesidad o un hecho no aprueba compras ni pagos.
import { db, nuevoId, ambientePorId, bienPorId, itinerarioPorId, vehiculoPorId } from './datos'
import { nombrePeriodo } from './servicios'
import { FECHA_CORTE } from 'src/config/demo'
import { condicion } from 'src/config/catalogos'

const AUTOR = 'Usuario de demostración'

// Los campos numéricos vacíos de un formulario llegan como '' o null: se guardan como dato no informado.
export const numeroONulo = (valor) => (Number.isFinite(valor) ? valor : null)

function registrarEvento (evento) {
  const nuevo = { id: nuevoId('EV'), fecha: FECHA_CORTE, reportaNecesidad: false, informadoPor: AUTOR, ...evento }
  db.eventos.push(nuevo)
  return nuevo
}

// Primer código libre de la forma `${base}NN`; `existe` indica si un código ya está en uso.
export function siguienteCodigo (base, existe) {
  let n = 1
  while (existe(`${base}${String(n).padStart(2, '0')}`)) n += 1
  return `${base}${String(n).padStart(2, '0')}`
}

export const rotuloSugerido = (ambienteId, tipoId) =>
  siguienteCodigo(`${ambienteId}-${tipoId.slice(0, 2).toUpperCase()}`, bienPorId)

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

// Cambiar la condición deja un antecedente; el resto de datos se corrige sin generar un hecho.
export function actualizarBien (bien, cambios) {
  const condicionAnterior = bien.condicion
  Object.assign(bien, cambios)
  if (cambios.condicion && cambios.condicion !== condicionAnterior) {
    registrarEvento({
      tipo: 'condicion',
      titulo: `Condición: ${condicion(condicionAnterior).label} → ${condicion(cambios.condicion).label}`,
      detalle: cambios.deterioro || '',
      ambienteId: bien.ambienteId,
      bienIds: [bien.id]
    })
  }
}

const componentesDe = (bienId) => db.bienes.filter((b) => b.asociadoA?.bienId === bienId)

function esDescendiente (candidatoId, bienId) {
  return componentesDe(bienId).some((c) => c.id === candidatoId || esDescendiente(candidatoId, c.id))
}

// Un componente solo se asocia a un bien activo del mismo ambiente, sin crear ciclos.
export const puedeAsociar = (bien, padre) =>
  padre.id !== bien.id && padre.situacion === 'activo' && padre.ambienteId === bien.ambienteId && !esDescendiente(padre.id, bien.id)

export function asociarBien (bien, padreId, posicion) {
  const padre = bienPorId(padreId)
  if (!padre || !puedeAsociar(bien, padre)) throw new Error('Asociación no permitida')
  bien.asociadoA = { bienId: padreId, posicion: posicion || 'No informada' }
  bien.revisionPendiente = false
  return registrarEvento({
    tipo: 'asociacion',
    titulo: `Componente de ${padre.nombre} ${padre.id}`,
    detalle: `Posición: ${bien.asociadoA.posicion}.`,
    ambienteId: bien.ambienteId,
    bienIds: [bien.id, padreId]
  })
}

export function desasociarBien (bien) {
  const anterior = bien.asociadoA?.bienId
  bien.asociadoA = null
  bien.revisionPendiente = false
  return registrarEvento({
    tipo: 'asociacion',
    titulo: `Deja de ser componente de ${anterior}`,
    detalle: 'La relación anterior se conserva como antecedente.',
    ambienteId: bien.ambienteId,
    bienIds: [bien.id]
  })
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

export function registrarServicio (local, datos) {
  const servicio = { id: `SRV-${local.carId}-${datos.tipo.toUpperCase()}`, localId: local.id, periodos: {}, hechos: [], ...datos }
  db.servicios.push(servicio)
  return servicio
}

export function actualizarServicio (servicio, cambios) {
  Object.assign(servicio, cambios)
}

export function registrarNovedad (ambiente, datos) {
  ambiente.novedades.push({ id: nuevoId('NOV'), fecha: FECHA_CORTE, atendida: false, informadoPor: AUTOR, ...datos })
}

// Una novedad atendida deja de generar necesidad de infraestructura.
export function atenderNovedad (novedad, { detalle }) {
  Object.assign(novedad, { atendida: true, atencion: { fecha: FECHA_CORTE, detalle: detalle || null, por: AUTOR } })
}

// Un pintado actualiza el último pintado solo si es más reciente que el registrado.
export function registrarIntervencion (ambiente, { descripcion, fecha, esPintado }) {
  ambiente.intervenciones.unshift({ descripcion, fecha: fecha || null })
  if (esPintado && fecha && (!ambiente.ultimoPintado || fecha > ambiente.ultimoPintado)) ambiente.ultimoPintado = fecha
}

export function registrarAmbiente (local, datos) {
  const ambiente = {
    id: siguienteCodigo(`${local.carId}-A`, ambientePorId),
    localId: local.id,
    intervenciones: [],
    novedades: [],
    ...datos
  }
  db.ambientes.push(ambiente)
  return ambiente
}

export function actualizarAmbiente (ambiente, cambios) {
  Object.assign(ambiente, cambios)
}

// El centro y su inmueble se registran juntos: la demostración asume un local por CAR.
export function registrarCentro ({ id, nombre }, local) {
  const car = { id, nombre }
  db.cars.push(car)
  db.locales.push({
    id: `LOC-${id}-01`,
    carId: id,
    nombre: 'Local principal',
    fundacion: { referencia: null, nota: null },
    arrendador: null,
    contratoHasta: null,
    litigios: null,
    construccion: { material: null, antiguedad: null, antiguedadNota: null, pisos: null, areaM2: null, estado: null, caracteristicas: null },
    fotos: [],
    ...local,
    actualizado: { fecha: FECHA_CORTE, por: AUTOR }
  })
  return car
}

export function registrarFoto (local, { titulo, nota, url }) {
  local.fotos.push({ titulo, fecha: FECHA_CORTE, nota: nota || null, url })
}

export const vehiculoSugerido = (carId) => siguienteCodigo(`${carId}-V`, vehiculoPorId)

export function registrarVehiculo (datos) {
  const vehiculo = { unidad: 'L', ...datos }
  db.vehiculos.push(vehiculo)
  return vehiculo
}

export function actualizarVehiculo (vehiculo, cambios) {
  Object.assign(vehiculo, cambios)
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
