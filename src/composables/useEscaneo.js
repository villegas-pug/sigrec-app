// Lectura de códigos QR o de barras con la cámara (SPEC 011, Olas 3 y 4). Mejora progresiva:
// - Con la API nativa BarcodeDetector (Chrome y Edge en Android, macOS y ChromeOS) se leen QR y códigos de barras.
// - Sin ella (Chrome y Edge en Windows, Firefox, Safari) se lee QR con jsQR, que se carga solo en ese caso.
// La cámara exige un contexto seguro (HTTPS o localhost). Sin cámara, la interfaz ofrece escribir el rótulo o usar un lector USB.
// La imagen de la cámara se procesa en el dispositivo y no se guarda ni se envía.
import { onScopeDispose, ref } from 'vue'

export const contextoSeguro = typeof window !== 'undefined' && window.isSecureContext !== false
export const camaraDisponible = contextoSeguro && typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

const FORMATOS_PREFERIDOS = ['qr_code', 'code_128', 'code_39', 'ean_13']
const ANCHO_MAXIMO_LECTURA = 640
const INTERVALO_MS = 350

// Devuelve { detectar(video) → Promise<texto | null> }: nativo si lee QR; si no, jsQR sobre un cuadro reducido.
async function crearLector () {
  if ('BarcodeDetector' in window) {
    try {
      const soportados = await window.BarcodeDetector.getSupportedFormats()
      if (soportados.includes('qr_code')) {
        const detector = new window.BarcodeDetector({ formats: FORMATOS_PREFERIDOS.filter((f) => soportados.includes(f)) })
        return {
          detectar: async (video) => (await detector.detect(video))[0]?.rawValue ?? null
        }
      }
    } catch {
      // Sin formatos utilizables: se usa jsQR.
    }
  }
  const { default: jsQR } = await import('jsqr')
  const lienzo = document.createElement('canvas')
  const contexto = lienzo.getContext('2d', { willReadFrequently: true })
  return {
    detectar: async (video) => {
      const escala = Math.min(1, ANCHO_MAXIMO_LECTURA / video.videoWidth)
      const ancho = Math.round(video.videoWidth * escala)
      const alto = Math.round(video.videoHeight * escala)
      if (!ancho || !alto) return null
      lienzo.width = ancho
      lienzo.height = alto
      contexto.drawImage(video, 0, 0, ancho, alto)
      return jsQR(contexto.getImageData(0, 0, ancho, alto).data, ancho, alto, { inversionAttempts: 'dontInvert' })?.data || null
    }
  }
}

function mensajeDeError (e) {
  if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') return 'El navegador no permitió usar la cámara. Revise los permisos del sitio, escriba el rótulo o use un lector de códigos USB.'
  if (e?.name === 'NotFoundError' || e?.name === 'OverconstrainedError') return 'No se encontró una cámara en este equipo. Escriba el rótulo o use un lector de códigos USB.'
  if (e?.name === 'NotReadableError') return 'La cámara está en uso por otra aplicación. Ciérrela o escriba el rótulo.'
  return 'No se pudo iniciar la cámara en este equipo. Escriba el rótulo o use un lector de códigos USB.'
}

export function useEscaneo () {
  // inactivo | iniciando | leyendo | error
  const estado = ref('inactivo')
  const error = ref(contextoSeguro ? null : 'La cámara requiere una conexión segura (HTTPS).')
  // La vista previa se refleja con una cámara frontal (webcam de laptop) para que el movimiento se vea natural.
  const espejo = ref(false)
  const camaras = ref([])
  let camaraId = null
  let stream = null
  let temporizador = null
  let video = null
  let alLeer = null

  function detener () {
    clearInterval(temporizador)
    temporizador = null
    stream?.getTracks().forEach((t) => t.stop())
    stream = null
    if (estado.value !== 'error') estado.value = 'inactivo'
  }

  async function abrir () {
    const restricciones = camaraId
      ? { deviceId: { exact: camaraId }, width: { ideal: 1280 } }
      : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }
    stream = await navigator.mediaDevices.getUserMedia({ video: restricciones, audio: false })
    const pista = stream.getVideoTracks()[0]
    const ajustes = pista?.getSettings?.() ?? {}
    camaraId = ajustes.deviceId ?? camaraId
    espejo.value = ajustes.facingMode !== 'environment'
    // Las etiquetas y la lista completa solo están disponibles con el permiso concedido.
    camaras.value = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput')
    video.srcObject = stream
    await video.play()
  }

  // `elemento`: <video>; `lectura(texto)` recibe cada lectura. Sigue leyendo hasta llamar a `detener()`.
  async function iniciar (elemento, lectura) {
    if (!camaraDisponible || estado.value === 'iniciando' || estado.value === 'leyendo') return
    video = elemento
    alLeer = lectura
    estado.value = 'iniciando'
    error.value = null
    try {
      const lector = await crearLector()
      await abrir()
      estado.value = 'leyendo'
      let ocupado = false
      temporizador = setInterval(async () => {
        if (!stream || ocupado || video.readyState < 2) return
        ocupado = true
        try {
          const texto = await lector.detectar(video)
          if (texto) alLeer(texto)
        } catch {
          // Un cuadro ilegible no interrumpe la lectura.
        } finally {
          ocupado = false
        }
      }, INTERVALO_MS)
    } catch (e) {
      clearInterval(temporizador)
      stream?.getTracks().forEach((t) => t.stop())
      stream = null
      estado.value = 'error'
      error.value = mensajeDeError(e)
    }
  }

  // Pasa a la cámara siguiente (p. ej. webcam integrada y cámara USB) sin cerrar el escáner.
  async function cambiarCamara () {
    if (camaras.value.length < 2 || estado.value !== 'leyendo') return
    const indice = camaras.value.findIndex((c) => c.deviceId === camaraId)
    camaraId = camaras.value[(indice + 1) % camaras.value.length].deviceId
    stream?.getTracks().forEach((t) => t.stop())
    try {
      await abrir()
    } catch (e) {
      detener()
      estado.value = 'error'
      error.value = mensajeDeError(e)
    }
  }

  function reiniciar () {
    detener()
    estado.value = 'inactivo'
    error.value = contextoSeguro ? null : 'La cámara requiere una conexión segura (HTTPS).'
  }

  onScopeDispose(detener)

  return { estado, error, espejo, camaras, iniciar, detener, reiniciar, cambiarCamara }
}
