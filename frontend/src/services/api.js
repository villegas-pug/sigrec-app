// Cliente REST de la SPEC 037. Las credenciales de sesión permanecen en cookies HttpOnly.
let csrf
let sesionVencida = () => {}

export function alVencerSesion (callback) {
  sesionVencida = callback
}

export function limpiarCsrf () {
  csrf = undefined
}

export async function api (path, { method = 'GET', body, notificarSesion = true } = {}) {
  const headers = { Accept: 'application/json' }
  const formulario = typeof FormData !== 'undefined' && body instanceof FormData
  if (body !== undefined && !formulario) headers['Content-Type'] = 'application/json'
  if (method !== 'GET') {
    csrf ??= api('/auth/csrf', { notificarSesion: false }).catch((error) => {
      limpiarCsrf()
      throw error
    })
    const { header, token } = await csrf
    headers[header] = token
  }

  let respuesta
  try {
    respuesta = await fetch(`/api/v1${path}`, {
      method,
      headers,
      body: formulario ? body : JSON.stringify(body),
      credentials: 'same-origin',
      signal: AbortSignal.timeout(45000)
    })
  } catch {
    throw new Error('No se pudo conectar con SIGREC. Intente nuevamente.')
  }
  if (respuesta.status === 401 && notificarSesion) sesionVencida()
  if (respuesta.status === 403 && method !== 'GET') limpiarCsrf()
  const resultado = await respuesta.json().catch(() => null)
  if (!respuesta.ok || !resultado) {
    const error = new Error(resultado?.message ?? 'No se pudo completar la solicitud. Intente nuevamente.')
    error.status = respuesta.status
    throw error
  }
  return resultado.data
}
