// Acciones de la interfaz sobre el almacén en memoria. Registrar una necesidad o un hecho no aprueba compras ni pagos.
// El autor de cada registro es el perfil activo (services/autor.js). La baja es lógica: `anular` / `reactivar`.
import {
  db, nuevoId, ambientePorId, ambientesDeCar, bienPorId, bienesDeAmbiente, carPorId, itinerarioPorId, servicioPorId, vehiculoPorId, vigentes
} from './datos'
import { nombrePeriodo } from './servicios'
import { bajaDe, reposicionDe } from './bienes'
import { autorActual } from './autor'
import { FECHA_CORTE } from 'src/config/demo'
import { ESTADOS_PERIODO, TIPOS_EVENTO, TIPOS_SERVICIO, condicion } from 'src/config/catalogos'
import { soles } from 'src/utils/formato'

// ---------- Utilidades ----------

// Los campos numéricos vacíos de un formulario llegan como '' o null: se guardan como dato no informado.
export const numeroONulo = (valor) => (Number.isFinite(valor) ? valor : null)

const sello = () => ({ fecha: FECHA_CORTE, por: autorActual() })

function registrarEvento (evento) {
  const nuevo = {
    id: nuevoId('EV'),
    reportaNecesidad: false,
    informadoPor: autorActual(),
    ...evento,
    fecha: evento.fecha || FECHA_CORTE,
    registradoEl: FECHA_CORTE
  }
  db.eventos.push(nuevo)
  return nuevo
}

// Primer código libre de la forma `${base}NN`; `existe` indica si un código ya está en uso.
export function siguienteCodigo (base, existe) {
  let n = 1
  while (existe(`${base}${String(n).padStart(2, '0')}`)) n += 1
  return `${base}${String(n).padStart(2, '0')}`
}

// `base` si está libre; si no, `base-2`, `base-3`…
function idUnico (base, existe) {
  if (!existe(base)) return base
  let n = 2
  while (existe(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

const identificador = (texto) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// ---------- Baja lógica ----------

// Cualquier registro puede anularse con un motivo; deja de contar en los cálculos y se conserva como antecedente.
export function anular (registro, { motivo }) {
  registro.anulacion = { ...sello(), motivo }
}

export function reactivar (registro) {
  registro.anulacion = null
}

const activos = (lista) => lista.filter((b) => b.situacion === 'activo')
const rotuloBien = (b) => `${b.nombre} ${b.id}`

// Dependencias que impiden anular un registro (lista vacía = se puede anular).
export const dependenciasDeCentro = (car) => [
  ...ambientesDeCar(car.id).map((a) => `Ambiente ${a.nombre}`),
  ...vigentes(db.vehiculos).filter((v) => v.carId === car.id).map((v) => `Vehículo ${v.id}`),
  ...vigentes(db.servicios).filter((s) => s.carId === car.id).map((s) => `Servicio de ${TIPOS_SERVICIO[s.tipo]}`)
]

// Bienes que impiden anular un ambiente: los activos (componentes asociados incluidos) y los que aún esperan revisión.
// Se resuelven reubicándolos o dando de baja cada uno; nunca se dan de baja solos.
export const pendientesDeAmbiente = (ambiente) =>
  bienesDeAmbiente(ambiente.id).filter((b) => b.situacion === 'activo' || (b.revisionPendiente && b.situacion !== 'anulado'))

export const dependenciasDeAmbiente = (ambiente) => pendientesDeAmbiente(ambiente).map(rotuloBien)

// La regla se valida también aquí: un ambiente con bienes por resolver no se anula aunque la pantalla lo permitiera.
export function anularAmbiente (ambiente, datos) {
  const pendientes = pendientesDeAmbiente(ambiente)
  if (pendientes.length) throw new Error(`El ambiente tiene bienes por resolver: ${pendientes.map(rotuloBien).join(', ')}`)
  anular(ambiente, datos)
}

export const dependenciasDeTipoBien = (tipo) => activos(db.bienes).filter((b) => b.tipoId === tipo.id).map(rotuloBien)

export const dependenciasDeBien = (bien) => activos(db.bienes).filter((b) => b.asociadoA?.bienId === bien.id).map((b) => `Componente ${rotuloBien(b)}`)

export const dependenciasDeItinerario = (itinerario) =>
  vigentes(db.combustible).filter((r) => r.itinerarioId === itinerario.id).map((r) => `Consumo declarado ${r.id} (${r.cantidad} L)`)

// Motivo por el que un registro anulado no puede reactivarse todavía (null = se puede reactivar).
export function bloqueoDeReactivacion (entidad, registro) {
  const centroAnulado = (carId) => !!carPorId(carId)?.anulacion
  const AVISO_CENTRO = 'El centro está anulado: reactívelo primero.'
  switch (entidad) {
    case 'ambiente':
    case 'vehiculo':
      return centroAnulado(registro.carId) ? AVISO_CENTRO : null
    case 'servicio':
      if (centroAnulado(registro.carId)) return AVISO_CENTRO
      return vigentes(db.servicios).some((s) => s.carId === registro.carId && s.tipo === registro.tipo)
        ? 'Ya existe un servicio vigente de este tipo en el centro.'
        : null
    case 'bien':
      return ambientePorId(registro.ambienteId)?.anulacion ? 'El ambiente está anulado: reactívelo primero.' : null
    case 'itinerario':
      return vehiculoPorId(registro.vehiculoId)?.anulacion ? 'El vehículo está anulado: reactívelo primero.' : null
    case 'combustible':
      return registro.tipo === 'consumo' && registro.itinerarioId && itinerarioPorId(registro.itinerarioId)?.consumoDeclaradoL != null
        ? 'El recorrido ya tiene otro consumo declarado.'
        : null
    default:
      return null
  }
}

// ---------- Centros y su ficha ----------

const INMUEBLE_VACIO = () => ({
  direccion: null,
  fundacion: { referencia: null, nota: null },
  condicion: 'propio',
  arrendador: null,
  contratoHasta: null,
  litigios: null,
  construccion: { material: null, antiguedad: null, antiguedadNota: null, pisos: null, areaM2: null, estado: null, caracteristicas: null },
  fotos: []
})

// El inmueble donde funciona el centro es parte de su ficha: se registra junto con el centro.
export function registrarCentro ({ id, nombre }, inmueble) {
  const car = { id, nombre, inmueble: { ...INMUEBLE_VACIO(), ...inmueble, actualizado: sello() } }
  db.cars.push(car)
  return car
}

// El código del centro es su identificador y no cambia; el nombre y la ficha sí.
export function actualizarCentro (car, { nombre, inmueble }) {
  if (nombre) car.nombre = nombre
  if (inmueble) car.inmueble = { ...car.inmueble, ...inmueble, actualizado: sello() }
}

// `ambienteId` es opcional: una fotografía sin ambiente es del centro (también las históricas).
export function registrarFoto (car, { titulo, nota, url, ambienteId = null }) {
  car.inmueble.fotos.push({ titulo, fecha: FECHA_CORTE, nota: nota || null, url, ambienteId, registradoPor: autorActual() })
}

const liberarUrl = (url) => {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
}

// Sin imagen nueva se conserva la anterior; con ella se libera la URL en memoria de la anterior.
export function actualizarFoto (foto, { titulo, nota, url, ambienteId = null }) {
  if (url) {
    liberarUrl(foto.url)
    foto.url = url
  }
  Object.assign(foto, { titulo, nota: nota || null, ambienteId })
}

// ---------- Ambientes, novedades e intervenciones ----------

export function registrarAmbiente (car, datos) {
  const ambiente = {
    id: siguienteCodigo(`${car.id}-A`, ambientePorId),
    carId: car.id,
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

export function registrarNovedad (ambiente, datos) {
  ambiente.novedades.push({ id: nuevoId('NOV'), fecha: FECHA_CORTE, atendida: false, informadoPor: autorActual(), ...datos })
}

export function actualizarNovedad (novedad, cambios) {
  Object.assign(novedad, cambios)
}

// Una novedad atendida deja de generar necesidad de infraestructura.
export function atenderNovedad (novedad, { detalle, fecha }) {
  Object.assign(novedad, { atendida: true, atencion: { fecha: fecha || FECHA_CORTE, detalle: detalle || null, por: autorActual() } })
}

// Un pintado actualiza el último pintado solo si es más reciente que el registrado.
function actualizarUltimoPintado (ambiente, { esPintado, fecha }) {
  if (esPintado && fecha && (!ambiente.ultimoPintado || fecha > ambiente.ultimoPintado)) ambiente.ultimoPintado = fecha
}

export function registrarIntervencion (ambiente, { descripcion, fecha, esPintado }) {
  ambiente.intervenciones.unshift({ descripcion, fecha: fecha || null, esPintado: !!esPintado, informadoPor: autorActual() })
  actualizarUltimoPintado(ambiente, { esPintado, fecha })
}

export function actualizarIntervencion (ambiente, intervencion, { descripcion, fecha, esPintado }) {
  Object.assign(intervencion, { descripcion, fecha: fecha || null, esPintado: !!esPintado })
  actualizarUltimoPintado(ambiente, { esPintado, fecha })
}

// ---------- Bienes y componentes ----------

export const rotuloSugerido = (ambienteId, tipoId) =>
  siguienteCodigo(`${ambienteId}-${tipoId.slice(0, 2).toUpperCase()}`, bienPorId)

export function registrarBien (datos) {
  if (datos.asociadoA && bienPorId(datos.asociadoA.bienId)?.asociadoA) throw new Error('Un componente no admite componentes')
  const bien = { situacion: 'activo', asociadoA: null, verificacion: null, cantidad: 1, ...datos }
  db.bienes.push(bien)
  return bien
}

export function informarVerificacion (bien, { resultado, nota, fecha }) {
  bien.verificacion = { fecha: fecha || FECHA_CORTE, resultado, nota: nota || null }
  return registrarEvento({
    tipo: 'verificacion',
    titulo: resultado === 'coincide' ? 'Coincide con lo informado' : 'Se informan diferencias',
    detalle: nota || '',
    fecha,
    ambienteId: bien.ambienteId,
    bienIds: [bien.id]
  })
}

// Cambiar la condición siempre deja un antecedente «Condición actualizada» (SPEC 002 §4).
export function cambiarCondicion (bien, nueva, { fecha, detalle = '' } = {}) {
  const anterior = bien.condicion
  if (!nueva || nueva === anterior) return null
  bien.condicion = nueva
  return registrarEvento({
    tipo: 'condicion',
    titulo: `Condición: ${condicion(anterior).label} → ${condicion(nueva).label}`,
    detalle,
    fecha,
    ambienteId: bien.ambienteId,
    bienIds: [bien.id]
  })
}

// Solo los bienes indicados quedan afectados; el resto del ambiente no cambia por inferencia (CA-11).
// `unidades` solo aplica a un único bien de un lote: las unidades afectadas (regla por validar).
// `condiciones` (mapa bienId → condición) tiene prioridad sobre la `condicion` común a todos los bienes.
export function registrarIncidente ({ tipo, titulo, detalle, fecha, ambienteId, bienIds, reportaNecesidad, condicion: nueva, condiciones = {}, unidades }) {
  for (const id of bienIds) {
    const cond = condiciones[id] ?? nueva
    if (cond) cambiarCondicion(bienPorId(id), cond, { fecha, detalle: titulo })
  }
  return registrarEvento({
    tipo,
    titulo,
    detalle,
    fecha,
    ambienteId,
    bienIds,
    reportaNecesidad,
    unidades: bienIds.length === 1 ? numeroONulo(unidades) : null
  })
}

export function actualizarIncidente (evento, { tipo, titulo, detalle, fecha, bienIds, reportaNecesidad, unidades }) {
  Object.assign(evento, {
    tipo,
    titulo,
    detalle,
    fecha: fecha || evento.fecha,
    bienIds,
    reportaNecesidad,
    unidades: bienIds.length === 1 ? numeroONulo(unidades) : null,
    modificado: sello()
  })
}

const componentesDe = (bienId) => db.bienes.filter((b) => b.asociadoA?.bienId === bienId && b.situacion !== 'anulado')

// La baja no se propaga: los bienes asociados quedan marcados para revisión individual (CA-12).
// Se guardan los componentes de ese momento porque la relación puede cambiar después.
export function darDeBaja (bien, { motivo, detalle, fecha }) {
  const hijos = activos(componentesDe(bien.id))
  bien.situacion = 'baja'
  for (const hijo of hijos) hijo.revisionPendiente = true
  return registrarEvento({
    tipo: 'baja',
    titulo: `Baja: ${motivo}`,
    detalle,
    fecha,
    ambienteId: bien.ambienteId,
    bienIds: [bien.id],
    componentes: hijos.map((h) => ({ bienId: h.id, posicion: h.asociadoA.posicion }))
  })
}

export function actualizarBien (bien, cambios) {
  const { condicion: nueva, ...resto } = cambios
  Object.assign(bien, resto)
  cambiarCondicion(bien, nueva, { detalle: resto.deterioro || '' })
}

// Los componentes tienen un solo nivel: un componente no admite componentes. Por eso el padre no puede ser a su vez
// componente, y un bien que ya tiene componentes no puede pasar a serlo. Además, el padre es un bien activo del mismo ambiente.
export const puedeAsociar = (bien, padre) =>
  padre.id !== bien.id && padre.situacion === 'activo' && padre.ambienteId === bien.ambienteId &&
  !padre.asociadoA && !componentesDe(bien.id).length

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

// El traslado lleva consigo a los componentes. Un componente trasladado por separado deja de serlo
// porque un componente solo se asocia a un bien del mismo ambiente.
export function trasladarBien (bien, ambienteDestinoId, { fecha } = {}) {
  const origen = ambientePorId(bien.ambienteId)
  const destino = ambientePorId(ambienteDestinoId)
  if (!destino || destino.anulacion || destino.carId !== origen.carId || destino.id === origen.id) throw new Error('Traslado no permitido')

  const padreAnterior = bien.asociadoA?.bienId
  if (padreAnterior) {
    bien.asociadoA = null
    bien.revisionPendiente = false
  }
  const movidos = [bien, ...componentesDe(bien.id)]
  for (const b of movidos) b.ambienteId = destino.id

  const detalle = padreAnterior
    ? `Deja de ser componente de ${padreAnterior}.`
    : movidos.length > 1 ? `Se ${movidos.length - 1 === 1 ? 'traslada también 1 componente' : `trasladan también ${movidos.length - 1} componentes`}.` : ''
  return registrarEvento({
    tipo: 'traslado',
    titulo: `Traslado: ${origen.nombre} → ${destino.nombre}`,
    detalle,
    fecha,
    ambienteId: destino.id,
    bienIds: movidos.map((b) => b.id)
  })
}

// Anular un bien corrige un registro erróneo; no es la baja patrimonial (`darDeBaja`).
export function anularBien (bien, { motivo }) {
  const situacionPrevia = bien.situacion
  anular(bien, { motivo })
  bien.anulacion.situacionPrevia = situacionPrevia
  bien.situacion = 'anulado'
}

export function reactivarBien (bien) {
  bien.situacion = bien.anulacion?.situacionPrevia ?? 'activo'
  reactivar(bien)
}

// Se reexportan para que las pantallas sigan importándolos junto con las demás acciones.
export { bajaDe, reposicionDe }

export function registrarReposicion (anterior, { rotulo, nombre, codigoPatrimonial, fechaAdquisicion, costo, vidaUtilAnios, fecha, componentesIds = [] }) {
  // Las reglas se validan antes de modificar nada, para que un fallo no deje una reposición a medias.
  if (anterior.situacion !== 'baja') throw new Error('Solo se repone un bien dado de baja')
  if (reposicionDe(anterior.id)) throw new Error('El bien ya tiene una reposición vigente')
  if (bienPorId(rotulo)) throw new Error('Ya existe un bien con ese rótulo')

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
  const trasladados = activos(componentesDe(anterior.id)).filter((h) => componentesIds.includes(h.id))
  for (const hijo of trasladados) {
    hijo.asociadoA = { ...hijo.asociadoA, bienId: nuevo.id }
    hijo.revisionPendiente = false
  }
  // Se guardan los componentes trasladados para poder devolverlos si la reposición se anula.
  registrarEvento({
    tipo: 'reposicion',
    titulo: `Reposición de ${anterior.id}`,
    detalle: trasladados.length ? `Alta por reposición. ${trasladados.length === 1 ? 'Se traslada 1 componente' : `Se trasladan ${trasladados.length} componentes`} al bien nuevo.` : 'Alta por reposición.',
    fecha,
    ambienteId: anterior.ambienteId,
    bienIds: [anterior.id, nuevo.id],
    bienAnteriorId: anterior.id,
    bienNuevoId: nuevo.id,
    trasladados: trasladados.map((h) => h.id)
  })
  return nuevo
}

// ---------- Reversión de bajas y reposiciones registradas por error ----------
// Distinta de la baja patrimonial: corrige el registro y devuelve el bien a su estado anterior.
// Se revierte en orden inverso al de registro: primero la reposición y después la baja.

// Impide anular una baja con una reposición vigente o cuyo bien ya no figura dado de baja.
export function dependenciasDeBaja (evento) {
  const bien = bienPorId(evento.bienIds[0])
  const reposicion = bien ? reposicionDe(bien.id) : null
  return [
    ...(reposicion ? [`Reposición ${reposicion.bienNuevoId}: anúlela primero`] : []),
    ...(bien?.situacion !== 'baja' ? ['El bien ya no figura dado de baja'] : [])
  ]
}

// El bien vuelve a estar activo y sus componentes dejan de estar pendientes de revisión por esta baja.
export function anularBaja (evento, { motivo }) {
  const bien = bienPorId(evento.bienIds[0])
  bien.situacion = 'activo'
  for (const { bienId } of evento.componentes ?? []) {
    const hijo = bienPorId(bienId)
    if (hijo) hijo.revisionPendiente = false
  }
  anular(evento, { motivo })
}

// Impide anular una reposición si el bien nuevo ya tiene componentes propios, hechos posteriores o dejó de estar activo.
export function dependenciasDeReposicion (evento) {
  const nuevo = bienPorId(evento.bienNuevoId)
  const trasladados = evento.trasladados ?? []
  return [
    ...(nuevo.situacion !== 'activo' ? ['El bien nuevo ya no está activo'] : []),
    ...activos(componentesDe(nuevo.id)).filter((c) => !trasladados.includes(c.id)).map((c) => `Componente ${rotuloBien(c)}`),
    ...vigentes(db.eventos)
      .filter((e) => e.id !== evento.id && e.bienIds?.includes(nuevo.id))
      .map((e) => `${TIPOS_EVENTO[e.tipo].label}: ${e.titulo}`)
  ]
}

// El bien nuevo se anula y los componentes trasladados regresan al bien anterior, que sigue dado de baja.
export function anularReposicion (evento, { motivo }) {
  const nuevo = bienPorId(evento.bienNuevoId)
  for (const id of evento.trasladados ?? []) {
    const hijo = bienPorId(id)
    if (!hijo) continue
    hijo.asociadoA = { ...hijo.asociadoA, bienId: evento.bienAnteriorId }
    hijo.revisionPendiente = true
  }
  anularBien(nuevo, { motivo })
  anular(evento, { motivo })
}

// ---------- Tipos de bien y precios referenciales ----------

export function registrarTipoBien ({ nombre, categoria, vidaUtilSugerida }) {
  const tipo = {
    id: idUnico(identificador(nombre), (id) => db.tiposBien.some((t) => t.id === id)),
    nombre,
    categoria,
    precio: null,
    fechaPrecio: null,
    procedencia: null,
    vidaUtilSugerida: numeroONulo(vidaUtilSugerida),
    historial: []
  }
  db.tiposBien.push(tipo)
  return tipo
}

export function actualizarTipoBien (tipo, { nombre, categoria, vidaUtilSugerida }) {
  Object.assign(tipo, { nombre, categoria, vidaUtilSugerida: numeroONulo(vidaUtilSugerida) })
}

// El precio reemplazado se conserva en el historial del tipo.
export function informarPrecio (tipo, { precio, fechaPrecio, procedencia }) {
  const nuevo = { precio, fechaPrecio: fechaPrecio || null, procedencia: procedencia || null }
  const cambia = nuevo.precio !== tipo.precio || nuevo.fechaPrecio !== tipo.fechaPrecio || nuevo.procedencia !== tipo.procedencia
  if (cambia && tipo.precio != null) {
    tipo.historial ??= []
    tipo.historial.unshift({ precio: tipo.precio, fechaPrecio: tipo.fechaPrecio, procedencia: tipo.procedencia, reemplazadoEl: FECHA_CORTE, por: autorActual() })
  }
  Object.assign(tipo, nuevo)
}

// ---------- Servicios básicos ----------

export function registrarServicio (car, datos) {
  const id = idUnico(`SRV-${car.id}-${datos.tipo.toUpperCase()}`, servicioPorId)
  const servicio = { id, carId: car.id, periodos: {}, hechos: [], ...datos }
  db.servicios.push(servicio)
  return servicio
}

export function actualizarServicio (servicio, cambios) {
  Object.assign(servicio, cambios)
}

// Informar un pago registra su situación para el control del servicio; no ejecuta el pago.
// Retroceder un período (de pagado a otro estado, o de pendiente a sin información) deja una corrección.
// `motivo` y `detalle` explican un pendiente; `pago` ({ fecha, importe, sustento }) documenta un pago. Todos son opcionales.
export function informarPeriodo (servicio, anio, numero, { estado, vence, motivo, detalle, pago }) {
  if (estado === 'pagado') {
    const fechaPago = pago?.fecha
    const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(fechaPago || '') && !Number.isNaN(Date.parse(fechaPago)) && new Date(fechaPago).toISOString().slice(0, 10) === fechaPago && fechaPago <= FECHA_CORTE
    if (!fechaValida || !(Number(pago?.importe) > 0) || !pago?.sustento?.trim()) throw new Error('Complete fecha válida, importe positivo y sustento del pago.')
  }
  servicio.periodos[anio] ??= { pagados: [], pendientes: [] }
  const periodo = servicio.periodos[anio]
  let anterior = 'sin_info'
  if (periodo.pagados.includes(numero)) anterior = 'pagado'
  else if (periodo.pendientes.some((p) => p.numero === numero)) anterior = 'pendiente'

  periodo.pagados = periodo.pagados.filter((n) => n !== numero)
  periodo.pendientes = periodo.pendientes.filter((p) => p.numero !== numero)
  if (estado === 'pagado') periodo.pagados.push(numero)
  if (estado === 'pendiente') periodo.pendientes.push({ numero, vence: vence || null, motivo: motivo || null, detalle: detalle || null })

  // El detalle del pago solo existe mientras el período está pagado.
  const datosPago = { fecha: pago?.fecha || null, importe: numeroONulo(pago?.importe), sustento: pago?.sustento?.trim() || null }
  if (estado === 'pagado' && Object.values(datosPago).some((v) => v != null)) {
    periodo.pagos ??= {}
    periodo.pagos[numero] = datosPago
  } else if (periodo.pagos) {
    delete periodo.pagos[numero]
  }

  const etiqueta = `${nombrePeriodo(servicio, numero)} ${anio}`
  if (estado === 'pagado' && anterior !== 'pagado') {
    const importe = datosPago.importe != null ? ` · ${soles(datosPago.importe)}` : ''
    informarHechoServicio(servicio, { tipo: 'pago', fecha: datosPago.fecha, detalle: `Pago informado del período ${etiqueta}${importe}.` })
  }
  const retrocede = (anterior === 'pagado' && estado !== 'pagado') || (anterior === 'pendiente' && estado === 'sin_info')
  if (retrocede) {
    informarHechoServicio(servicio, {
      tipo: 'correccion',
      detalle: `Corrección del período ${etiqueta}: de ${ESTADOS_PERIODO[anterior].label} a ${ESTADOS_PERIODO[estado].label}.`
    })
  }
}

export function informarHechoServicio (servicio, { tipo, fecha, detalle }) {
  const hecho = { id: nuevoId('HS'), fecha: fecha || FECHA_CORTE, tipo, detalle, informadoPor: autorActual() }
  servicio.hechos.push(hecho)
  return hecho
}

export function actualizarHechoServicio (hecho, { tipo, fecha, detalle }) {
  Object.assign(hecho, { tipo, fecha: fecha || hecho.fecha, detalle })
}

// ---------- Movilidad ----------

export const vehiculoSugerido = (carId) => siguienteCodigo(`${carId}-V`, vehiculoPorId)

export function registrarVehiculo (datos) {
  const vehiculo = { unidad: 'L', ...datos }
  db.vehiculos.push(vehiculo)
  return vehiculo
}

export function actualizarVehiculo (vehiculo, cambios) {
  Object.assign(vehiculo, cambios)
}

export function registrarItinerario (datos) {
  const itinerario = { id: nuevoId('IT'), consumoDeclaradoL: null, ...datos }
  db.itinerarios.push(itinerario)
  return itinerario
}

export function actualizarItinerario (itinerario, { fecha, proposito, destinos, previsto, realizado, ruta }) {
  Object.assign(itinerario, { fecha, proposito, destinos, previsto, realizado, ruta })
}

// Lo realizado se registra aparte de lo previsto para poder distinguirlos (CA-15).
export function informarEjecucion (itinerario, { salida, llegada, km }) {
  itinerario.realizado = { salida: salida || null, llegada: llegada || null, km: numeroONulo(km) }
}

// Un consumo se asocia a un solo recorrido para no contarlo dos veces.
const vincularConsumo = (registro) => {
  if (registro.tipo === 'consumo' && registro.itinerarioId) itinerarioPorId(registro.itinerarioId).consumoDeclaradoL = registro.cantidad
}

const desvincularConsumo = (registro) => {
  if (registro.tipo === 'consumo' && registro.itinerarioId) itinerarioPorId(registro.itinerarioId).consumoDeclaradoL = null
}

export function registrarCombustible (datos) {
  const registro = { id: nuevoId('CB'), unidad: 'L', ...datos }
  db.combustible.push(registro)
  vincularConsumo(registro)
  return registro
}

export function actualizarCombustible (registro, cambios) {
  desvincularConsumo(registro)
  Object.assign(registro, cambios)
  vincularConsumo(registro)
}

// Anular un consumo libera el recorrido para declarar otro.
export function anularCombustible (registro, datos) {
  desvincularConsumo(registro)
  anular(registro, datos)
}

export function reactivarCombustible (registro) {
  reactivar(registro)
  vincularConsumo(registro)
}
