// Almacén en memoria con los datos ficticios de la demostración.
// Los cambios realizados desde la interfaz se pierden al recargar: el prototipo no tiene persistencia.
import { reactive } from 'vue'
import cars from 'src/data/cars.json'
import locales from 'src/data/locales.json'
import ambientes from 'src/data/ambientes.json'
import bienes from 'src/data/bienes.json'
import tiposBien from 'src/data/tipos-bien.json'
import eventos from 'src/data/eventos.json'
import servicios from 'src/data/servicios.json'
import vehiculos from 'src/data/vehiculos.json'
import itinerarios from 'src/data/itinerarios.json'
import combustible from 'src/data/combustible.json'
import inventarioPrevio from 'src/data/inventario-previo.json'

export const db = reactive({
  cars,
  locales,
  ambientes,
  bienes,
  tiposBien,
  eventos,
  servicios,
  vehiculos,
  itinerarios,
  combustible,
  inventarioPrevio
})

const porId = (lista, id) => lista.find((item) => item.id === id) ?? null

export const carPorId = (id) => porId(db.cars, id)
export const localPorId = (id) => porId(db.locales, id)
export const ambientePorId = (id) => porId(db.ambientes, id)
export const bienPorId = (id) => porId(db.bienes, id)
export const tipoPorId = (id) => porId(db.tiposBien, id)
export const vehiculoPorId = (id) => porId(db.vehiculos, id)
export const servicioPorId = (id) => porId(db.servicios, id)
export const itinerarioPorId = (id) => porId(db.itinerarios, id)

export const localesDeCar = (carId) => db.locales.filter((l) => l.carId === carId)
export const ambientesDeLocal = (localId) => db.ambientes.filter((a) => a.localId === localId)
export const ambientesDeCar = (carId) => db.ambientes.filter((a) => localPorId(a.localId)?.carId === carId)
export const bienesDeAmbiente = (ambienteId) => db.bienes.filter((b) => b.ambienteId === ambienteId)

export function ubicacionDeAmbiente (ambienteId) {
  const ambiente = ambientePorId(ambienteId)
  const local = localPorId(ambiente.localId)
  const car = carPorId(local.carId)
  return { car, local, ambiente }
}

export const ubicacionDeBien = (bien) => ubicacionDeAmbiente(bien.ambienteId)

export function textoUbicacion ({ car, local, ambiente }) {
  return `${car.nombre} › ${local.id} › ${ambiente.nombre}`
}

let contador = 0

// Identificador para registros creados en la sesión; no colisiona con los ids de los JSON.
export function nuevoId (prefijo) {
  contador += 1
  return `${prefijo}-N${String(contador).padStart(3, '0')}`
}
