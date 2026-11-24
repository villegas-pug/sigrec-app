// Cliente REST. SPEC 039: sin cookies ni CSRF; la identidad de la intranet (claves «sgr-*» de localStorage)
// viaja en cabeceras. SPEC 041: tras una escritura exitosa se avisa a quien dependa de datos calculados.
import { LocalStorage } from 'quasar'
import { PREFIJO } from 'src/config/intranet'

let sesionVencida = () => {}
const alEscribir = new Set()

export function alVencerSesion (callback) {
  sesionVencida = callback
}

/** Registra una función que se ejecuta después de cada escritura exitosa (p. ej. invalidar el resumen de Inicio). */
export function despuesDeEscribir (callback) {
  alEscribir.add(callback)
  return () => alEscribir.delete(callback)
}

const dato = (nombre) => String(LocalStorage.getItem(`${PREFIJO}${nombre}`) ?? '').replace(/^__q_\w+\|/, '')

export async function api (path, { method = 'GET', body, notificarSesion = true } = {}) {
  const headers = { Accept: 'application/json' }
  const formulario = typeof FormData !== 'undefined' && body instanceof FormData
  if (body !== undefined && !formulario) headers['Content-Type'] = 'application/json'
  const idUsuario = dato('idUsuario')
  if (idUsuario) {
    headers['X-Usuario-Id'] = idUsuario
    headers['X-Usuario-Nombre'] = encodeURIComponent(dato('nombreCompleto'))
  }

  let respuesta
  try {
    respuesta = await fetch(`${process.env.SIGREC_API_URL ?? ''}/api/v1${path}`, {
      method,
      headers,
      body: formulario ? body : JSON.stringify(body),
      signal: AbortSignal.timeout(45000)
    })
  } catch {
    throw new Error('No se pudo conectar con SIGREC. Intente nuevamente.')
  }
  if (respuesta.status === 401 && notificarSesion) sesionVencida()
  const resultado = await respuesta.json().catch(() => null)
  if (!respuesta.ok || !resultado) {
    const error = new Error(resultado?.message ?? 'No se pudo completar la solicitud. Intente nuevamente.')
    error.status = respuesta.status
    throw error
  }
  if (method !== 'GET') alEscribir.forEach((callback) => callback())
  return resultado.data
}
