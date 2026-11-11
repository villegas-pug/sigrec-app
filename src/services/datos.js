// Almacén en memoria con los datos ficticios de la demostración.
// Los cambios realizados desde la interfaz se pierden al recargar: el prototipo no tiene persistencia.
// Jerarquía: Centro › Módulo › Ambiente › Bien › Componente (SPEC 020). El inmueble del centro es parte de su ficha (`car.inmueble`).
import { reactive } from 'vue'
import cars from 'src/data/cars.json'
import modulos from 'src/data/modulos.json'
import ambientes from 'src/data/ambientes.json'
import bienes from 'src/data/bienes.json'
import tiposBien from 'src/data/tipos-bien.json'
import eventos from 'src/data/eventos.json'
import servicios from 'src/data/servicios.json'
import vehiculos from 'src/data/vehiculos.json'
import itinerarios from 'src/data/itinerarios.json'
import combustible from 'src/data/combustible.json'
import inventarioPrevio from 'src/data/inventario-previo.json'
import mantenimientos from 'src/data/mantenimientos.json'

export const db = reactive({
  cars,
  modulos,
  ambientes,
  bienes,
  tiposBien,
  eventos,
  servicios,
  vehiculos,
  itinerarios,
  combustible,
  inventarioPrevio,
  mantenimientos
})

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
  return db.bienes.filter((b) => b.situacion === 'activo' && ambientes.has(b.ambienteId))
}

export function ubicacionDeAmbiente (ambienteId) {
  const ambiente = ambientePorId(ambienteId)
  const car = carPorId(ambiente.carId)
  const modulo = moduloPorId(ambiente.moduloId)
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

let contador = 0

// Identificador para registros creados en la sesión; no colisiona con los ids de los JSON.
export function nuevoId (prefijo) {
  contador += 1
  return `${prefijo}-N${String(contador).padStart(3, '0')}`
}
