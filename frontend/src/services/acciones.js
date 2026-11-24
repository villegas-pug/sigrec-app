// SPEC 037: las operaciones de dominio se ejecutan por REST.
// Registrar una necesidad o un hecho no aprueba compras ni pagos. La baja es lógica: `anular` / `reactivar`.
import {
  db, ambientePorId, ambientesDeModulo, bienPorId, bienesDeAmbiente, carPorId, moduloPorId, modulosDeCar, vehiculoPorId, vigentes,
  bajaDe, revisionPendienteDe, situacionDe
} from './datos'
import { reposicionDe } from './bienes'
import { consumoDeclaradoL } from './combustible'
import { eventosRegistrados } from './centros'
import { cambiarEstadoJerarquia, guardarJerarquia } from './jerarquiaRest'
import { escribirInventario } from './inventarioRest'
import { escribirTipoBien } from './tiposBienRest'
import { escribirPrecio } from './preciosRest'
import { aplicarRegistro, cambiarEstadoColeccion, escribirColeccion } from './coleccionRest'
import { api } from './api'
import { escribirFoto, escribirIntervencion } from './complementosRest'
import { TIPOS_EVENTO, TIPOS_SERVICIO } from 'src/config/catalogos'

// ---------- Utilidades ----------

// Los campos numéricos vacíos de un formulario llegan como '' o null: se guardan como dato no informado.
export const numeroONulo = (valor) => (Number.isFinite(valor) ? valor : null)

// Primer código libre de la forma `${base}NN`; `existe` indica si un código ya está en uso.
export function siguienteCodigo (base, existe) {
  let n = 1
  while (existe(`${base}${String(n).padStart(2, '0')}`)) n += 1
  return `${base}${String(n).padStart(2, '0')}`
}

// ---------- Baja lógica ----------

// Cualquier registro puede anularse con un motivo; deja de contar en los cálculos y se conserva como antecedente.
export function anular (registro, { motivo }) {
  const cambio = cambiarEstadoJerarquia(registro, motivo)
  if (cambio) return cambio
  if (db.eventos.includes(registro)) return escribirInventario('/incidencias/' + codificar(registro.id) + '/anular', { motivo })
  if (db.tiposBien.includes(registro)) return escribirTipoBien(registro.id, { motivo }, { operacion: 'anular' })
  const servicio = estadoServicio(registro, motivo)
  if (servicio) return servicio
  const movilidad = estadoMovilidad(registro, motivo)
  if (movilidad) return movilidad
  const complemento = estadoComplemento(registro, motivo)
  if (complemento) return complemento
  throw new Error('El registro no está disponible.')
}

export function reactivar (registro) {
  const cambio = cambiarEstadoJerarquia(registro)
  if (cambio) return cambio
  if (db.eventos.includes(registro)) return escribirInventario('/incidencias/' + codificar(registro.id) + '/reactivar')
  if (db.tiposBien.includes(registro)) return escribirTipoBien(registro.id, undefined, { operacion: 'reactivar' })
  const servicio = estadoServicio(registro)
  if (servicio) return servicio
  const movilidad = estadoMovilidad(registro)
  if (movilidad) return movilidad
  const complemento = estadoComplemento(registro)
  if (complemento) return complemento
  throw new Error('El registro no está disponible.')
}

const activos = (lista) => lista.filter((b) => situacionDe(b) === 'activo')
const rotuloBien = (b) => `${b.nombre} ${b.id}`

// Dependencias que impiden anular un registro (lista vacía = se puede anular).
export const dependenciasDeCentro = (car) => [
  ...modulosDeCar(car.id).map((m) => `${m.nombre} (${m.id})`),
  ...vigentes(db.vehiculos).filter((v) => v.carId === car.id).map((v) => `Vehículo ${v.id}`),
  ...vigentes(db.servicios).filter((s) => s.carId === car.id).map((s) => `Servicio de ${TIPOS_SERVICIO[s.tipo]}`)
]

// Ambientes activos que impiden anular un módulo: se anulan o se mueven antes a otro módulo.
export const dependenciasDeModulo = (modulo) => ambientesDeModulo(modulo.id).map((a) => `Ambiente ${a.nombre}`)

export function anularModulo (modulo, datos) {
  const dependencias = dependenciasDeModulo(modulo)
  if (dependencias.length) throw new Error(`El módulo tiene ambientes activos: ${dependencias.join(', ')}`)
  return anular(modulo, datos)
}

// Bienes que impiden anular un ambiente: los activos (componentes asociados incluidos) y los que aún esperan revisión.
// Se resuelven reubicándolos o dando de baja cada uno; nunca se dan de baja solos.
export const pendientesDeAmbiente = (ambiente) =>
  bienesDeAmbiente(ambiente.id).filter((b) => {
    const situacion = situacionDe(b)
    return situacion === 'activo' || (revisionPendienteDe(b) && situacion !== 'anulado')
  })

export const dependenciasDeAmbiente = (ambiente) => pendientesDeAmbiente(ambiente).map(rotuloBien)

// La regla se valida también aquí: un ambiente con bienes por resolver no se anula aunque la pantalla lo permitiera.
export function anularAmbiente (ambiente, datos) {
  const pendientes = pendientesDeAmbiente(ambiente)
  if (pendientes.length) throw new Error(`El ambiente tiene bienes por resolver: ${pendientes.map(rotuloBien).join(', ')}`)
  return anular(ambiente, datos)
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
      if (centroAnulado(registro.carId)) return AVISO_CENTRO
      return moduloPorId(registro.moduloId)?.anulacion ? 'El módulo está anulado: reactívelo primero.' : null
    case 'modulo':
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
      return registro.tipo === 'consumo' && registro.itinerarioId && consumoDeclaradoL(registro.itinerarioId) != null
        ? 'El recorrido ya tiene otro consumo declarado.'
        : null
    default:
      return null
  }
}

// ---------- Centros y su ficha ----------

// SPEC 037: los datos de centros y sus elementos se guardan juntos en el servidor.
export function registrarCentro ({ id, nombre, unidadOrganicaId }, inmueble) {
  return guardarJerarquia('centro', { id, nombre, inmueble, unidadOrganicaId })
}

export function actualizarCentro (car, datos) {
  return guardarJerarquia('centro', datos, car.id)
}

export function registrarFoto (car, { archivo, ...datos }) {
  return escribirFoto('/fotos', { carId: car.id, datos }, archivo)
}

export function registrarFotoDeBien (bien, { archivo, ...datos }) {
  return escribirFoto('/fotos', { bienId: bien.id, datos }, archivo)
}

export function actualizarFoto (foto, { archivo, ...datos }) {
  return escribirFoto('/fotos/' + codificar(foto.id), { datos }, archivo, 'PUT')
}

// ---------- Módulos (SPEC 020) ----------

// El código del módulo es su identificador (`AMA-M01`) y no cambia; tampoco su centro.
export function registrarModulo (car, datos) {
  return guardarJerarquia('modulo', { ...datos, carId: car.id })
}

export function actualizarModulo (modulo, datos) {
  return guardarJerarquia('modulo', datos, modulo.id)
}

// Cambiar el módulo conserva el centro y el identificador del ambiente.
export function registrarAmbiente (car, datos) {
  const modulo = moduloPorId(datos.moduloId)
  if (!modulo || modulo.carId !== car.id) throw new Error('Elija un módulo activo del centro')
  return guardarJerarquia('ambiente', datos)
}

export function actualizarAmbiente (ambiente, datos) {
  return guardarJerarquia('ambiente', datos, ambiente.id)
}

// SPEC 037. Novedades y atenciones se escriben en Oracle.
const codificar = encodeURIComponent

export function registrarNovedad (ambiente, datos) {
  return escribirInventario('/incidencias', { datos: { ...datos, origen: { tipo: 'ambiente', id: ambiente.id } }, novedad: true })
}

export function actualizarNovedad (novedad, cambios) {
  return escribirInventario('/incidencias/' + codificar(novedad.id), { datos: { ...cambios, origen: novedad.origen } }, 'PUT')
}

export function atenderNovedad (novedad, { detalle, fecha }) {
  return escribirInventario('/incidencias/' + codificar(novedad.id) + '/atender', { detalle, fecha: fecha || null })
}

export function registrarIntervencion (ambiente, datos) {
  return escribirIntervencion('/intervenciones', { ambienteId: ambiente.id, datos: { ...datos, fecha: datos.fecha || null } })
}

export function actualizarIntervencion (intervencion, datos) {
  return escribirIntervencion('/intervenciones/' + codificar(intervencion.id),
    { datos: { ...datos, fecha: datos.fecha || null } }, 'PUT')
}

// ---------- Bienes y componentes ----------

export const rotuloSugerido = (ambienteId, tipoId) =>
  siguienteCodigo(`${ambienteId}-${tipoId.slice(0, 2).toUpperCase()}`, bienPorId)

export function registrarBien (bien, { inventarioPrevioId, verificacion } = {}) {
  return escribirInventario('/bienes', { bien, inventarioPrevioId, verificacion })
}

export function informarVerificacion (bien, { resultado, nota, fecha }) {
  return escribirInventario('/bienes/' + codificar(bien.id) + '/verificacion', { resultado, nota, fecha: fecha || null })
}

export function informarVerificaciones (ambiente, registros) {
  return escribirInventario('/bienes/verificaciones', { ambienteId: ambiente.id, registros })
}

export function registrarIncidente (datos) {
  return escribirInventario('/incidencias', { datos, novedad: false })
}

export function actualizarIncidente (evento, datos) {
  return escribirInventario('/incidencias/' + codificar(evento.id), { datos }, 'PUT')
}

const componentesDe = (bienId) => db.bienes.filter((b) => b.asociadoA?.bienId === bienId && situacionDe(b) !== 'anulado')

export function darDeBaja (bien, { motivo, detalle, fecha }) {
  return escribirInventario('/incidencias/bajas/' + codificar(bien.id), { motivo, detalle, fecha: fecha || null })
}

export function actualizarBien (bien, cambios) {
  return escribirInventario('/bienes/' + codificar(bien.id), { bien: { ...bien, ...cambios } }, 'PUT')
}

export const puedeAsociar = (bien, padre) =>
  padre.id !== bien.id && situacionDe(padre) === 'activo' && padre.ambienteId === bien.ambienteId &&
  !padre.asociadoA && !componentesDe(bien.id).length

export function asociarBien (bien, padreId, posicion) {
  return escribirInventario('/bienes/' + codificar(bien.id) + '/asociacion', { padreId, posicion })
}

export function desasociarBien (bien) {
  return asociarBien(bien, null, null)
}

export function cerrarRevision (bien) {
  return escribirInventario('/bienes/' + codificar(bien.id) + '/cerrar-revision')
}

export function trasladarBien (bien, ambienteId, { fecha } = {}) {
  return escribirInventario('/bienes/' + codificar(bien.id) + '/traslado', { ambienteId, fecha: fecha || null })
}

export function anularBien (bien, { motivo }) {
  return escribirInventario('/bienes/' + codificar(bien.id) + '/anular', { motivo })
}

export function reactivarBien (bien) {
  return escribirInventario('/bienes/' + codificar(bien.id) + '/reactivar')
}

export { bajaDe, reposicionDe }

export function registrarReposicion (anterior, datos) {
  return escribirInventario('/incidencias/reposiciones/' + codificar(anterior.id), {
    ...datos, fecha: datos.fecha || null, fechaAdquisicion: datos.fechaAdquisicion || null,
    costo: numeroONulo(datos.costo), vidaUtilAnios: numeroONulo(datos.vidaUtilAnios)
  })
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
    ...(situacionDe(bien) !== 'baja' ? ['El bien ya no figura dado de baja'] : [])
  ]
}

// El bien vuelve a estar activo y sus componentes dejan de estar pendientes de revisión por esta baja.
export function anularBaja (evento, { motivo }) {
  return escribirInventario('/incidencias/bajas/' + codificar(evento.id) + '/anular', { motivo })
}

// Impide anular una reposición si el bien nuevo ya tiene componentes propios, hechos posteriores o dejó de estar activo.
export function dependenciasDeReposicion (evento) {
  const nuevo = bienPorId(evento.bienNuevoId)
  const trasladados = evento.trasladados ?? []
  return [
    ...(situacionDe(nuevo) !== 'activo' ? ['El bien nuevo ya no está activo'] : []),
    ...activos(componentesDe(nuevo.id)).filter((c) => !trasladados.includes(c.id)).map((c) => `Componente ${rotuloBien(c)}`),
    ...vigentes(eventosRegistrados())
      .filter((e) => e.id !== evento.id && e.bienIds?.includes(nuevo.id))
      .map((e) => `${TIPOS_EVENTO[e.tipo].label}: ${e.titulo}`)
  ]
}

// El bien nuevo se anula y los componentes trasladados regresan al bien anterior, que sigue dado de baja.
export function anularReposicion (evento, { motivo }) {
  return escribirInventario('/incidencias/reposiciones/' + codificar(evento.id) + '/anular', { motivo })
}

// ---------- Tipos de bien y precios referenciales ----------

export function registrarTipoBien (datos) {
  return escribirTipoBien(null, datos)
}

export function actualizarTipoBien (tipo, datos) {
  return escribirTipoBien(tipo.id, datos, { method: 'PUT' })
}

export function informarPrecio (tipo, datos) {
  return escribirPrecio(tipo, datos)
}

// ---------- Servicios básicos ----------

const rutaServicio = (servicio) => '/servicios/' + codificar(servicio.id)

export function registrarServicio (car, { tipo, periodicidad, ...datos }) {
  return escribirColeccion('servicios', '/servicios', { carId: car.id, tipo, periodicidad, datos })
}

export function actualizarServicio (servicio, { periodicidad, ...datos }) {
  return escribirColeccion('servicios', rutaServicio(servicio), { periodicidad, datos }, 'PUT')
}

export function informarPeriodo (servicio, anio, numero, datos) {
  const body = { ...datos, vence: datos.vence || null, pago: datos.estado === 'pagado' ? datos.pago : null }
  return escribirColeccion('servicios', rutaServicio(servicio) + '/periodos/' + anio + '/' + numero, body, 'PUT')
}

export function informarHechoServicio (servicio, datos) {
  return escribirColeccion('servicios', rutaServicio(servicio) + '/hechos', datos)
}

export function actualizarHechoServicio (servicio, hecho, datos) {
  return escribirColeccion('servicios', rutaServicio(servicio) + '/hechos/' + codificar(hecho.id), datos, 'PUT')
}

function estadoServicio (registro, motivo) {
  if (db.servicios.includes(registro)) return cambiarEstadoColeccion('servicios', rutaServicio(registro), motivo)
  const servicio = db.servicios.find((item) => item.hechos.includes(registro))
  if (servicio) return cambiarEstadoColeccion('servicios', rutaServicio(servicio) + '/hechos/' + codificar(registro.id), motivo)
  return null
}

// ---------- Movilidad ----------

const rutaMovilidad = (coleccion, registro) => '/' + coleccion + '/' + codificar(registro.id)

export function registrarVehiculo ({ carId, ...datos }) {
  return escribirColeccion('vehiculos', '/vehiculos', { carId, datos })
}

export function actualizarVehiculo (vehiculo, cambios) {
  return escribirColeccion('vehiculos', rutaMovilidad('vehiculos', vehiculo),
    { datos: { ...vehiculo, ...cambios } }, 'PUT')
}

export function registrarItinerario ({ vehiculoId, ...datos }) {
  return escribirColeccion('itinerarios', '/itinerarios', { vehiculoId, datos })
}

export function actualizarItinerario (itinerario, datos) {
  return escribirColeccion('itinerarios', rutaMovilidad('itinerarios', itinerario), { datos }, 'PUT')
}

export function informarEjecucion (itinerario, { salida, llegada, km }) {
  return escribirColeccion('itinerarios', rutaMovilidad('itinerarios', itinerario) + '/ejecucion',
    { salida: salida || null, llegada: llegada || null, km: numeroONulo(km) })
}

export function registrarCombustible ({ vehiculoId, ...datos }) {
  return escribirColeccion('combustible', '/combustible', { vehiculoId, datos })
}

export function actualizarCombustible (registro, datos) {
  return escribirColeccion('combustible', rutaMovilidad('combustible', registro), { datos }, 'PUT')
}

function estadoMovilidad (registro, motivo) {
  const coleccion = ['vehiculos', 'itinerarios', 'combustible'].find((clave) => db[clave].includes(registro))
  return coleccion ? cambiarEstadoColeccion(coleccion, rutaMovilidad(coleccion, registro), motivo) : null
}

export function anularCombustible (registro, datos) {
  return anular(registro, datos)
}

export function reactivarCombustible (registro) {
  return reactivar(registro)
}

// ---------- Mantenimientos y controles preventivos ----------

export async function registrarMantenimiento ({ carId, tipo, objetivos, quedaOperativo, datos }) {
  const alta = await api('/mantenimientos', { method: 'POST', body: { carId, tipo, objetivos, quedaOperativo, datos } })
  if (alta.vehiculo) aplicarRegistro('vehiculos', alta.vehiculo)
  return alta.registros.map((registro) => aplicarRegistro('mantenimientos', registro))
}

export function actualizarMantenimiento (mantenimiento, datos) {
  return escribirColeccion('mantenimientos', '/mantenimientos/' + codificar(mantenimiento.id), { datos }, 'PUT')
}

function estadoComplemento (registro, motivo) {
  const coleccion = ['fotos', 'intervenciones', 'mantenimientos'].find((clave) => db[clave].includes(registro))
  if (!coleccion) return null
  const ruta = '/' + coleccion + '/' + codificar(registro.id)
  if (coleccion !== 'intervenciones') return cambiarEstadoColeccion(coleccion, ruta, motivo)
  return escribirIntervencion(ruta + (motivo == null ? '/reactivar' : '/anular'), motivo == null ? undefined : { motivo })
}
