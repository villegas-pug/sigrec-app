// Motor de dictado del navegador (Web Speech API, es-PE). Devuelve resultados parciales en vivo.
// Interfaz común de los motores: crear() → { iniciar({ alParcial, alEstado, alError, alTerminar }), detener(), cancelar() }.
const Motor = typeof window !== 'undefined' ? (window.SpeechRecognition ?? window.webkitSpeechRecognition) : undefined

export const motorNavegadorSoportado = !!Motor

export function crear () {
  let r = null

  function iniciar ({ alParcial, alEstado, alError, alTerminar }) {
    r = new Motor()
    r.lang = 'es-PE'
    r.interimResults = true
    r.maxAlternatives = 1
    // En Chrome para Android el modo continuo duplica resultados: cada pulsación es un tramo de dictado.
    r.continuous = false

    let final = ''
    r.onresult = (e) => {
      let parcial = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else parcial += t
      }
      alParcial?.(`${final} ${parcial}`.trim())
    }
    r.onerror = (e) => alError?.(e.error)
    r.onend = () => {
      r = null
      alTerminar?.(final)
    }
    alEstado?.('escuchando')
    try {
      r.start()
    } catch {
      r = null
      alError?.('audio-capture')
      alTerminar?.('')
    }
  }

  return {
    iniciar,
    detener: () => r?.stop(),
    cancelar: () => r?.abort()
  }
}
