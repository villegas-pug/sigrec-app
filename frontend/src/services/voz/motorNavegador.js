// Motor de dictado del navegador (Web Speech API, es-PE). Devuelve resultados parciales en vivo.
// Interfaz común de los motores: crear() → { iniciar({ alParcial, alEstado, alError, alTerminar }), detener(), cancelar() }.
import { normalizarErrorVoz } from './errores'

const Motor = typeof window !== 'undefined' ? (window.SpeechRecognition ?? window.webkitSpeechRecognition) : undefined

export const motorNavegadorSoportado = !!Motor

export function crear () {
  let r = null

  function iniciar ({ alParcial, alEstado, alError, alTerminar }) {
    let final = ''
    try {
      r = new Motor()
      r.lang = 'es-PE'
      r.interimResults = true
      r.maxAlternatives = 1
      // En Chrome para Android el modo continuo duplica resultados: cada pulsación es un tramo de dictado.
      r.continuous = false

      r.onresult = (e) => {
        let parcial = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript
          if (e.results[i].isFinal) final += t
          else parcial += t
        }
        alParcial?.(`${final} ${parcial}`.trim())
      }
      r.onerror = (e) => alError?.(normalizarErrorVoz(e.error))
      r.onend = () => {
        r = null
        alTerminar?.(final)
      }
      alEstado?.('escuchando')
      r.start()
    } catch (e) {
      r = null
      alError?.(normalizarErrorVoz(e))
      alTerminar?.('')
    }
  }

  return {
    iniciar,
    detener: () => r?.stop(),
    cancelar: () => r?.abort()
  }
}
