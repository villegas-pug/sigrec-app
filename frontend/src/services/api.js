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

// SPEC 053: la API vive bajo el mismo origen que la SPA, en `/sigrec/api/v1`. El proxy de la intranet (y el de
// desarrollo) quita `/sigrec` y entrega `/api/v1` al backend. `SIGREC_API_URL` solo se usa para otro origen.
const RAIZ = `${process.env.SIGREC_API_URL ?? ''}/sigrec`
const BASE_API = `${RAIZ}/api/v1`

/** URL absoluta de una ruta que el backend devuelve ya con `/api/v1` (p. ej. el contenido de una foto). */
export const urlApi = (ruta) => (ruta ? `${RAIZ}${ruta}` : ruta)

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
    respuesta = await fetch(`${BASE_API}${path}`, {
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
    error.campos = respuesta.status === 400 && resultado?.data && !Array.isArray(resultado.data) && typeof resultado.data === 'object' ? resultado.data : null
    throw error
  }
  if (method !== 'GET') alEscribir.forEach((callback) => callback())
  return resultado.data
}
