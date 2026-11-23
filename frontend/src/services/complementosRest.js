import { api } from './api'
import { ambientePorId } from './datos'
import { aplicarRegistro } from './coleccionRest'

export async function escribirFoto (ruta, datos, archivo, method = 'POST') {
  const body = new FormData()
  body.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }))
  if (archivo) body.append('archivo', archivo)
  return aplicarRegistro('fotos', await api(ruta, { method, body }))
}

export async function escribirIntervencion (ruta, body, method = 'POST') {
  const { registro, ultimoPintado } = await api(ruta, { method, body })
  const ambiente = ambientePorId(registro.ambienteId)
  if (ambiente) ambiente.ultimoPintado = ultimoPintado
  return aplicarRegistro('intervenciones', registro, { primero: true })
}
