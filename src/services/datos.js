// Almacén en memoria con los datos ficticios de la demostración.
// Los cambios realizados desde la interfaz se pierden al recargar: el prototipo no tiene persistencia.
// Jerarquía: Centro › Ambiente › Bien › Componente. El inmueble del centro es parte de su ficha (`car.inmueble`).
import { reactive } from 'vue'
import cars from 'src/data/cars.json'
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

export const ambientesDeCar = (carId, { inactivos = false } = {}) =>
  db.ambientes.filter((a) => a.carId === carId && (inactivos || vigente(a)))
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
  return { car, ambiente }
}

export const ubicacionDeBien = (bien) => ubicacionDeAmbiente(bien.ambienteId)

// Jerarquía Centro › Ambiente.
export function textoUbicacion ({ car, ambiente }) {
  return ambiente ? `${car.nombre} › ${ambiente.nombre}` : car.nombre
}

let contador = 0

// Identificador para registros creados en la sesión; no colisiona con los ids de los JSON.
export function nuevoId (prefijo) {
  contador += 1
  return `${prefijo}-N${String(contador).padStart(3, '0')}`
}
