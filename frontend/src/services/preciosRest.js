import { api } from './api'

export const listarPrecios = () => api('/precios')

export function camposPrecio ({ precio = null, fechaPrecio = null, procedencia = null, historial = [] } = {}) {
  return { precio, fechaPrecio, procedencia, historial }
}

export async function escribirPrecio (tipo, { precio, fechaPrecio, procedencia }) {
  const actualizado = await api('/precios/' + encodeURIComponent(tipo.id), {
    method: 'PUT', body: { precio, fechaPrecio: fechaPrecio || null, procedencia: procedencia || null }
  })
  Object.assign(tipo, camposPrecio(actualizado))
}
