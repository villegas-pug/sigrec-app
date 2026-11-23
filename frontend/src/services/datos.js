// SPEC 037: estado de lectura hidratado por REST. Los datos de demostración se importan en el backend.
// Jerarquía: Centro › Módulo › Ambiente › Bien › Componente (SPEC 020).
import { reactive } from 'vue'

export const db = reactive({
  cars: [],
  modulos: [],
  ambientes: [],
  elementos: [],
  bienes: [],
  eventos: [],
  inventarioPrevio: [],
  tiposBien: [],
  servicios: [],
  vehiculos: [],
  itinerarios: [],
  combustible: [],
  mantenimientos: [],
  fotos: [],
  intervenciones: []
})

export function restablecerDatos () {
  for (const lista of Object.values(db)) lista.splice(0)
}

const porId = (lista, id) => lista.find((item) => item.id === id) ?? null

export const carPorId = (id) => porId(db.cars, id)
export const moduloPorId = (id) => porId(db.modulos, id)
export const ambientePorId = (id) => porId(db.ambientes, id)
export const bienPorId = (id) => porId(db.bienes, id)
export const tipoPorId = (id) => porId(db.tiposBien, id)
export const vehiculoPorId = (id) => porId(db.vehiculos, id)
export const servicioPorId = (id) => porId(db.servicios, id)
export const itinerarioPorId = (id) => porId(db.itinerarios, id)
export const mantenimientoPorId = (id) => porId(db.mantenimientos, id)

// Baja lógica: un registro anulado lleva `anulacion` y deja de contar en los cálculos.
export const vigente = (registro) => !registro.anulacion
export const vigentes = (lista) => lista.filter(vigente)

// SPEC 034: la baja, la verificación y la revisión se derivan del historial vigente.
const esHechoVigente = (evento, tipo) =>
  evento.clase !== 'novedad' && evento.tipo === tipo && vigente(evento)

export const bajaDe = (bienId) =>
  db.eventos.find((e) => esHechoVigente(e, 'baja') && e.bienIds?.[0] === bienId) ?? null

export function situacionDe (bien) {
  if (!bien) return undefined
  if (!vigente(bien)) return 'anulado'
  return bajaDe(bien.id) ? 'baja' : 'activo'
}

export function verificacionDe (bien) {
  if (!bien) return null
  const evento = db.eventos.findLast((e) => esHechoVigente(e, 'verificacion') && e.bienIds?.includes(bien.id))
  return evento ? { fecha: evento.fecha, resultado: evento.resultado, nota: evento.detalle || null } : null
}

export const revisionPendienteDe = (bien) =>
  !!bien && db.eventos.some((e) =>
    esHechoVigente(e, 'baja') && (e.componentes ?? []).some((c) => c.bienId === bien.id && !c.resolucion)
  )

export const situacionDeRegistro = (registro) => registro?.tipoId ? situacionDe(registro) : undefined

// SPEC 032: una novedad o incidencia está atendida cuando tiene su atención registrada (SGR_ATENCION); no se guarda otra marca.
export const estaAtendida = (registro) => !!registro.atencion

// Las casas van antes que los módulos de uso común; dentro de cada grupo se conserva el orden de registro.
export const modulosDeCar = (carId, { inactivos = false } = {}) =>
  db.modulos
    .filter((m) => m.carId === carId && (inactivos || vigente(m)))
    .sort((a, b) => Number(a.tipo === 'comun') - Number(b.tipo === 'comun'))
// `carId` del ambiente se conserva igual al de su módulo: los consumidores por centro no dependen del módulo.
export const ambientesDeCar = (carId, { inactivos = false } = {}) =>
  db.ambientes.filter((a) => a.carId === carId && (inactivos || vigente(a)))
export const ambientesDeModulo = (moduloId, { inactivos = false } = {}) =>
  db.ambientes.filter((a) => a.moduloId === moduloId && (inactivos || vigente(a)))
export const bienesDeAmbiente = (ambienteId) => db.bienes.filter((b) => b.ambienteId === ambienteId)

// Universo compartido de inventario: componentes activos incluidos, aun con principal de baja.
export function bienesActivosDeCentros (carIds = null) {
  const centros = db.cars.filter((c) => vigente(c) && (!carIds || carIds.includes(c.id)))
  const ambientes = new Set(centros.flatMap((c) => ambientesDeCar(c.id).map((a) => a.id)))
  return db.bienes.filter((b) => situacionDe(b) === 'activo' && ambientes.has(b.ambienteId))
}

export function ubicacionDeAmbiente (ambienteId) {
  const ambiente = ambientePorId(ambienteId)
  const car = carPorId(ambiente?.carId)
  const modulo = moduloPorId(ambiente?.moduloId)
  return { car, modulo, ambiente }
}

export const ubicacionDeBien = (bien) => ubicacionDeAmbiente(bien.ambienteId)

// Jerarquía Centro › Módulo › Ambiente; omite los niveles que no se indican.
export function textoUbicacion ({ car, modulo, ambiente }) {
  return [car.nombre, modulo?.nombre, ambiente?.nombre].filter(Boolean).join(' › ')
}

// Etiqueta de un ambiente en los selectores de un centro: «Módulo › Ambiente».
export const etiquetaAmbiente = (ambiente) => [moduloPorId(ambiente.moduloId)?.nombre, ambiente.nombre].filter(Boolean).join(' › ')

// Posición de un módulo en el orden del árbol: casas primero y, dentro de cada grupo, orden de registro.
export function posicionModulo (moduloId) {
  const i = db.modulos.findIndex((m) => m.id === moduloId)
  if (i < 0) return Infinity
  return (db.modulos[i].tipo === 'comun' ? db.modulos.length : 0) + i
}

// Ambientes en el orden del árbol: por módulo y, dentro de cada uno, en el orden de registro.
export function ordenarPorModulo (ambientes) {
  return [...ambientes].sort((a, b) => posicionModulo(a.moduloId) - posicionModulo(b.moduloId))
}

// Opciones { value, label } de ambientes para un selector, con el módulo en la etiqueta.
export const opcionesAmbientes = (ambientes) => ordenarPorModulo(ambientes).map((a) => ({ value: a.id, label: etiquetaAmbiente(a) }))
