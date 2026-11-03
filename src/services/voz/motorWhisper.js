// Motor de respaldo: graba con el micrófono y transcribe con Whisper en el propio dispositivo (sin conexión tras la primera descarga).
// No da resultados parciales. Estados: escuchando → descargando (solo la primera vez) → transcribiendo.
import { normalizarErrorVoz } from './errores'

const DURACION_MAXIMA_MS = 30000
const FRECUENCIA = 16000

export const motorWhisperSoportado =
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined' && typeof WebAssembly !== 'undefined'

let worker = null
let siguienteId = 1
const pendientes = new Map()
let ultimoProgreso = 0

function obtenerWorker () {
  if (worker) return worker
  worker = new Worker(new URL('./whisper.worker.js', import.meta.url), { type: 'module' })
  worker.onmessage = (e) => {
    const { id, tipo } = e.data
    if (tipo === 'progreso') {
      ultimoProgreso = e.data.valor
      pendientes.forEach((p) => p.alEstado?.('descargando', e.data.valor))
      return
    }
    const p = pendientes.get(id)
    if (!p) return
    if (tipo === 'transcribiendo') p.alEstado?.('transcribiendo')
    else {
      pendientes.delete(id)
      if (tipo === 'texto') p.resolver(e.data.texto)
      else p.rechazar(new Error(e.data.mensaje))
    }
  }
  worker.onerror = (e) => {
    pendientes.forEach((p) => p.rechazar(new Error(e.message)))
    pendientes.clear()
    worker = null
  }
  return worker
}

function transcribir (audio, alEstado) {
  return new Promise((resolver, rechazar) => {
    const id = siguienteId++
    pendientes.set(id, { resolver, rechazar, alEstado })
    alEstado?.('descargando', ultimoProgreso)
    obtenerWorker().postMessage({ id, audio }, [audio.buffer])
  })
}

// Decodifica la grabación y la deja en mono a 16 kHz, como exige Whisper.
async function aAudio16k (blob) {
  const ctx = new (window.AudioContext ?? window.webkitAudioContext)()
  try {
    const buffer = await ctx.decodeAudioData(await blob.arrayBuffer())
    const fuera = new OfflineAudioContext(1, Math.max(1, Math.ceil(buffer.duration * FRECUENCIA)), FRECUENCIA)
    const fuente = fuera.createBufferSource()
    fuente.buffer = buffer
    fuente.connect(fuera.destination)
    fuente.start()
    return (await fuera.startRendering()).getChannelData(0)
  } finally {
    ctx.close()
  }
}

export function crear () {
  let grabador = null
  let flujo = null
  let temporizador = null
  let cancelado = false

  const liberar = () => {
    clearTimeout(temporizador)
    flujo?.getTracks().forEach((t) => t.stop())
    flujo = null
  }

  function detener () {
    if (grabador?.state === 'recording') grabador.stop()
  }

  async function iniciar ({ alEstado, alError, alTerminar }) {
    cancelado = false
    try {
      flujo = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (e) {
      alError?.(normalizarErrorVoz(e))
      alTerminar?.('')
      return
    }
    if (cancelado) { liberar(); alTerminar?.(''); return }

    try {
      const trozos = []
      grabador = new MediaRecorder(flujo)
      grabador.ondataavailable = (e) => { if (e.data.size) trozos.push(e.data) }
      grabador.onstop = async () => {
        liberar()
        grabador = null
        if (cancelado || !trozos.length) { alTerminar?.(''); return }
        try {
          const audio = await aAudio16k(new Blob(trozos))
          const texto = await transcribir(audio, (estado, valor) => { if (!cancelado) alEstado?.(estado, valor) })
          alTerminar?.(cancelado ? '' : texto)
        } catch {
          if (!cancelado) alError?.('transcripcion')
          alTerminar?.('')
        }
      }
      alEstado?.('escuchando')
      grabador.start()
      temporizador = setTimeout(detener, DURACION_MAXIMA_MS)
    } catch (e) {
      liberar()
      grabador = null
      alError?.(normalizarErrorVoz(e))
      alTerminar?.('')
    }
  }

  function cancelar () {
    cancelado = true
    if (grabador?.state === 'recording') grabador.stop()
    else if (!grabador) liberar()
  }

  return { iniciar, detener, cancelar }
}
