// Dictado de voz a texto con la Web Speech API del navegador (SPEC 007). Es una mejora progresiva: donde el navegador
// no la ofrece o el contexto no es seguro (sin HTTPS), `dictadoDisponible` es false y los campos se usan con el teclado.
// El audio lo procesa el servicio de voz del navegador; SIGREC no graba ni guarda audio.
import { onScopeDispose, ref } from 'vue'
import { useQuasar } from 'quasar'

const Motor = typeof window !== 'undefined' ? (window.SpeechRecognition ?? window.webkitSpeechRecognition) : undefined
export const dictadoDisponible = !!Motor && typeof window !== 'undefined' && window.isSecureContext

const MENSAJES = {
  'not-allowed': 'Permiso de micrófono denegado: actívelo en el navegador.',
  'service-not-allowed': 'Permiso de micrófono denegado: actívelo en el navegador.',
  'no-speech': 'No se detectó voz.',
  'audio-capture': 'No se encontró un micrófono.',
  network: 'Sin conexión con el servicio de voz: escriba el texto.'
}

// Una sola sesión de dictado en toda la app: iniciar en otro campo detiene la anterior.
let sesionActiva = null
// El aviso de privacidad se muestra una vez por sesión de la app (en memoria, sin almacenamiento del navegador).
let avisoMostrado = false

// Añade el texto dictado al final del existente, con un espacio y mayúscula inicial si empieza una oración.
export function unirDictado (actual, dictado) {
  const previo = actual ?? ''
  let texto = (dictado ?? '').trim()
  if (!texto) return previo
  const recorte = previo.trimEnd()
  if (!recorte || /[.!?]$/.test(recorte)) texto = texto.charAt(0).toLocaleUpperCase('es-PE') + texto.slice(1)
  return recorte ? `${recorte} ${texto}` : texto
}

export function useDictado () {
  const $q = useQuasar()
  const escuchando = ref(false)
  let reconocimiento = null

  function detener () {
    reconocimiento?.stop()
  }

  function cancelar () {
    reconocimiento?.abort()
  }

  // alParcial(texto) recibe el texto provisional; alFinal(texto) el definitivo; alCancelar() se llama si no hubo texto final.
  function iniciar ({ alParcial, alFinal, alCancelar } = {}) {
    if (!dictadoDisponible) return
    if (sesionActiva && sesionActiva !== cancelar) sesionActiva()

    if (!avisoMostrado) {
      avisoMostrado = true
      $q.notify({ type: 'info', icon: 'privacy_tip', message: 'El audio se procesa en el servicio de voz del navegador. No dicte datos personales de residentes.', timeout: 6000 })
    }

    const r = new Motor()
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
    r.onerror = (e) => {
      const mensaje = MENSAJES[e.error]
      if (mensaje) $q.notify({ type: 'warning', message: mensaje })
    }
    r.onend = () => {
      escuchando.value = false
      if (sesionActiva === cancelar) sesionActiva = null
      reconocimiento = null
      if (final.trim()) alFinal?.(final)
      else alCancelar?.()
    }

    reconocimiento = r
    sesionActiva = cancelar
    escuchando.value = true
    try {
      r.start()
    } catch {
      escuchando.value = false
      sesionActiva = null
      reconocimiento = null
      alCancelar?.()
    }
  }

  // Al cerrar el diálogo o cambiar de página se libera el micrófono.
  onScopeDispose(cancelar)

  return { escuchando, iniciar, detener }
}
