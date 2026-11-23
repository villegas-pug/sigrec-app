import { Notify } from 'quasar'
import { api } from './api'
import { db } from './datos'

export async function cargarInventario () {
  aplicarInventario(await api('/bienes/datos'))
}

// Conserva la identidad de los objetos que ya tienen las pantallas y actualiza sus campos.
export function aplicarInventario (inventario) {
  for (const [coleccion, datos] of Object.entries(inventario)) {
    const anteriores = new Map(db[coleccion].map((item) => [item.id, item]))
    const registros = datos.map((registro) => {
      const anterior = anteriores.get(registro.id)
      if (!anterior) return registro
      for (const campo of Object.keys(anterior)) {
        if (!Object.hasOwn(registro, campo)) delete anterior[campo]
      }
      return Object.assign(anterior, registro)
    })
    db[coleccion].splice(0, db[coleccion].length, ...registros)
  }
}

export async function escribirInventario (ruta, body, method = 'POST') {
  const registro = await api(ruta, { method, body })
  try {
    await cargarInventario()
  } catch (error) {
    if (error.status !== 401) Notify.create({ type: 'warning', message: 'Se guardó el registro. Recargue la página para actualizar la vista.' })
  }
  return registro
}
