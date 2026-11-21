// Worker de Whisper (transformers.js): transcribe en el propio dispositivo, sin bloquear la interfaz.
// El modelo se descarga una vez del CDN de Hugging Face y queda en la caché del navegador.
import { env, pipeline } from '@huggingface/transformers'

// Si el español de este modelo no basta, puede pasarse a 'onnx-community/whisper-base' (~80 MB).
const MODELO_WHISPER = 'onnx-community/whisper-tiny'

env.allowLocalModels = false

let canalizacion = null
const archivos = {}

async function cargar () {
  if (canalizacion) return canalizacion
  canalizacion = pipeline('automatic-speech-recognition', MODELO_WHISPER, {
    dtype: 'q8',
    device: 'wasm',
    progress_callback: (p) => {
      if (p.status !== 'progress' || !p.file) return
      archivos[p.file] = p.progress
      const valores = Object.values(archivos)
      self.postMessage({ tipo: 'progreso', valor: Math.round(valores.reduce((a, b) => a + b, 0) / valores.length) })
    }
  }).catch((e) => {
    canalizacion = null
    throw e
  })
  return canalizacion
}

self.onmessage = async (e) => {
  const { id, audio } = e.data
  try {
    const asr = await cargar()
    self.postMessage({ id, tipo: 'transcribiendo' })
    const salida = await asr(audio, { language: 'spanish', task: 'transcribe' })
    self.postMessage({ id, tipo: 'texto', texto: (salida.text ?? '').trim() })
  } catch (err) {
    self.postMessage({ id, tipo: 'error', mensaje: String(err?.message ?? err) })
  }
}
