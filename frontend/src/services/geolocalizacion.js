// Búsqueda de lugares para el prototipo; Photon puede sustituirse mediante configuración.
const proveedor = (import.meta.env.VITE_PHOTON_URL || 'https://photon.komoot.io').replace(/\/$/, '')
const cache = new Map()
let siguientePeticion = 0

export async function buscarLugares (consulta, centro, signal) {
  const clave = JSON.stringify([consulta.toLowerCase(), centro?.lat?.toFixed(3), centro?.lng?.toFixed(3)])
  if (cache.has(clave)) return cache.get(clave)
  // Las búsquedas canceladas no reservan turnos futuros.
  while (Date.now() < siguientePeticion) {
    await new Promise((resolve, reject) => {
      if (signal.aborted) { reject(new DOMException('Cancelado', 'AbortError')); return }
      const cancelar = () => { clearTimeout(espera); reject(new DOMException('Cancelado', 'AbortError')) }
      const espera = setTimeout(() => { signal.removeEventListener('abort', cancelar); resolve() }, siguientePeticion - Date.now())
      signal.addEventListener('abort', cancelar, { once: true })
    })
  }
  if (signal.aborted) throw new DOMException('Cancelado', 'AbortError')
  siguientePeticion = Date.now() + 1000
  // Photon conserva los nombres locales cuando no se fuerza un idioma no disponible.
  const params = new URLSearchParams({ q: consulta, limit: '5', countrycode: 'PE' })
  if (centro) { params.set('lat', centro.lat); params.set('lon', centro.lng) }
  const control = new AbortController()
  const cancelar = () => control.abort()
  signal.addEventListener('abort', cancelar, { once: true })
  const limite = setTimeout(cancelar, 10000)
  try {
    const respuesta = await fetch(`${proveedor}/api?${params}`, { signal: control.signal })
    if (!respuesta.ok) throw new Error(`Photon respondió HTTP ${respuesta.status}`)
    const json = await respuesta.json()
    if (!Array.isArray(json.features)) throw new Error('Respuesta de Photon no válida')
    const resultados = json.features.filter(f => f.geometry?.type === 'Point' && f.geometry.coordinates?.length >= 2).map(f => {
      const p = f.properties ?? {}
      const nombre = [p.name, [p.street, p.housenumber].filter(Boolean).join(' '), p.district, p.city, p.state, p.country].filter((v, i, a) => v && a.indexOf(v) === i).join(', ')
      return { label: nombre || 'Lugar sin nombre', lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] }
    })
    cache.set(clave, resultados)
    return resultados
  } finally { clearTimeout(limite); signal.removeEventListener('abort', cancelar) }
}

export function ubicacionActual () {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Ubicación no disponible')); return }
    navigator.geolocation.getCurrentPosition(pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }), reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 })
  })
}
