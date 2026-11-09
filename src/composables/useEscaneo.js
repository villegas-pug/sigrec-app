// Lectura de códigos QR o de barras con la cámara (SPEC 011, Ola 3). Mejora progresiva: usa la API nativa BarcodeDetector
// (Chrome y Edge en Android y escritorio). Sin soporte, `escaneoDisponible` es false y la interfaz ofrece escribir el rótulo.
// La imagen de la cámara se procesa en el dispositivo y no se guarda ni se envía.
import { onScopeDispose, ref } from 'vue'

export const escaneoDisponible = typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia

const FORMATOS_PREFERIDOS = ['qr_code', 'code_128', 'code_39', 'ean_13']

export function useEscaneo () {
  // inactivo | iniciando | leyendo | error
  const estado = ref('inactivo')
  const error = ref(null)
  let stream = null
  let temporizador = null

  function detener () {
    clearInterval(temporizador)
    temporizador = null
    stream?.getTracks().forEach((t) => t.stop())
    stream = null
    estado.value = 'inactivo'
  }

  // `video`: elemento <video>; `alLeer(texto)` recibe cada lectura. Sigue leyendo hasta llamar a `detener()`.
  async function iniciar (video, alLeer) {
    if (!escaneoDisponible || estado.value !== 'inactivo') return
    estado.value = 'iniciando'
    error.value = null
    try {
      const soportados = await window.BarcodeDetector.getSupportedFormats()
      const formatos = FORMATOS_PREFERIDOS.filter((f) => soportados.includes(f))
      const detector = new window.BarcodeDetector(formatos.length ? { formats: formatos } : undefined)
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      video.srcObject = stream
      await video.play()
      estado.value = 'leyendo'
      temporizador = setInterval(async () => {
        if (!stream || video.readyState < 2) return
        try {
          const [codigo] = await detector.detect(video)
          if (codigo?.rawValue) alLeer(codigo.rawValue)
        } catch {
          // Un cuadro ilegible no interrumpe la lectura.
        }
      }, 350)
    } catch (e) {
      detener()
      estado.value = 'error'
      error.value = e?.name === 'NotAllowedError'
        ? 'El navegador no permitió usar la cámara. Revise los permisos del sitio o escriba el rótulo.'
        : 'No se pudo iniciar la cámara en este dispositivo. Escriba el rótulo.'
    }
  }

  onScopeDispose(detener)

  return { estado, error, iniciar, detener }
}
