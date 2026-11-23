import { api } from './api'
import { db } from './datos'

export function aplicarRegistro (coleccion, registro, { primero = false } = {}) {
  const lista = db[coleccion]
  const actual = lista.find((item) => item.id === registro.id)
  if (actual) return Object.assign(actual, registro)
  if (primero) lista.unshift(registro)
  else lista.push(registro)
  return registro
}

export async function cargarColeccion (coleccion, ruta = coleccion) {
  const filas = await api('/' + ruta)
  db[coleccion].splice(0, db[coleccion].length, ...filas)
}

export async function escribirColeccion (coleccion, ruta, body, method = 'POST') {
  return aplicarRegistro(coleccion, await api(ruta, { method, body }))
}

export function cambiarEstadoColeccion (coleccion, ruta, motivo) {
  return escribirColeccion(coleccion, ruta + (motivo == null ? '/reactivar' : '/anular'),
    motivo == null ? undefined : { motivo })
}
