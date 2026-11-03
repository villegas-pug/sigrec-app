// Dictado de voz a texto (SPEC 007). Orquesta el motor (navegador o Whisper en el dispositivo), la sesión única,
// los avisos de privacidad y los mensajes de error. Es una mejora progresiva: sin soporte, `dictadoDisponible` es false.
import { onScopeDispose, ref } from 'vue'
import { useQuasar } from 'quasar'
import { crearMotor, dictadoDisponible, marcarFalloNavegador, nombreDeMotor } from 'src/services/voz'

export { dictadoDisponible }
export { unirDictado } from 'src/utils/interpretacionVoz'

const MENSAJES = {
  'permiso-denegado': 'Chrome o Android no permitió acceder al micrófono. Revise los permisos para este sitio y para Chrome.',
  'service-not-allowed': 'El servicio de voz del navegador no está disponible. La próxima vez se usará el reconocimiento en el dispositivo.',
  'no-speech': 'No se detectó voz.',
  'audio-capture': 'No se encontró un micrófono.',
  'microfono-ocupado': 'El micrófono no está disponible o está siendo usado por otra aplicación. Ciérrela e intente de nuevo.',
  'microfono-no-disponible': 'No se pudo iniciar el micrófono en este navegador. Recargue la página e intente de nuevo.',
  network: 'Sin conexión con el servicio de voz. La próxima vez se usará el reconocimiento en el dispositivo.',
  transcripcion: 'No se pudo transcribir el audio. Intente de nuevo o escriba el texto.'
}

// Una sola sesión de dictado en toda la app: iniciar en otro campo detiene la anterior.
let sesionActiva = null
// Los avisos de privacidad se muestran una vez por sesión de la app y por motor (en memoria, sin almacenamiento del navegador).
const avisos = { navegador: false, whisper: false }

export function useDictado () {
  const $q = useQuasar()
  // inactivo | escuchando | descargando | transcribiendo
  const estado = ref('inactivo')
  const progreso = ref(0)
  let motor = null

  const cancelar = () => motor?.cancelar()
  const detener = () => motor?.detener()

  function confirmarDescarga () {
    return new Promise((resolver) => {
      $q.dialog({
        title: 'Reconocimiento de voz en este dispositivo',
        message: 'Se descargará un modelo de voz de unos 40 MB, una sola vez. El audio se procesa en este dispositivo y no sale de él.',
        persistent: true,
        cancel: { flat: true, label: 'Cancelar', color: 'secondary' },
        ok: { unelevated: true, label: 'Descargar y dictar', color: 'primary' }
      })
        .onOk(() => resolver(true))
        .onCancel(() => resolver(false))
        .onDismiss(() => resolver(false))
    })
  }

  function mostrarGuiaPermiso () {
    $q.dialog({
      title: 'Permitir el micrófono',
      message: 'En Chrome, toque el icono junto a la dirección, abra Permisos y permita el micrófono para este sitio. Si el permiso ya está habilitado, vaya a Ajustes de Android → Aplicaciones → Chrome → Permisos → Micrófono y permita el acceso. Vuelva a SIGREC y pulse el micrófono para reintentar.',
      ok: { unelevated: true, label: 'Entendido', color: 'primary' }
    })
  }

  // alParcial(texto): texto provisional; alFinal(texto): definitivo; alCancelar(): terminó sin texto.
  // `local` obliga a usar el reconocimiento en el dispositivo (campos con datos personales).
  async function iniciar ({ alParcial, alFinal, alCancelar, local = false } = {}) {
    if (!dictadoDisponible || estado.value !== 'inactivo') return
    if (sesionActiva) sesionActiva()

    const nombre = nombreDeMotor({ local })
    estado.value = 'escuchando'
    if (nombre === 'whisper' && !avisos.whisper) {
      if (!(await confirmarDescarga())) {
        estado.value = 'inactivo'
        alCancelar?.()
        return
      }
      avisos.whisper = true
    }
    if (nombre === 'navegador' && !avisos.navegador) {
      avisos.navegador = true
      $q.notify({ type: 'info', icon: 'privacy_tip', message: 'El audio se procesa en el servicio de voz del navegador. No dicte datos personales de residentes.', timeout: 6000 })
    }

    try {
      const motorCreado = crearMotor(nombre)
      // Web Speech API se inicia dentro de esta misma llamada originada por el toque del usuario.
      motor = nombre === 'whisper' ? await motorCreado : motorCreado
    } catch {
      estado.value = 'inactivo'
      if (sesionActiva === cancelar) sesionActiva = null
      $q.notify({ type: 'warning', message: MENSAJES['microfono-no-disponible'] })
      alCancelar?.()
      return
    }
    sesionActiva = cancelar
    progreso.value = 0
    motor.iniciar({
      alParcial,
      alEstado: (e, valor) => {
        estado.value = e
        if (valor != null) progreso.value = valor
      },
      alError: (codigo) => {
        if (nombre === 'navegador' && (codigo === 'network' || codigo === 'service-not-allowed')) marcarFalloNavegador()
        const mensaje = MENSAJES[codigo]
        if (!mensaje) return
        const notificacion = { type: 'warning', message: mensaje }
        if (codigo === 'permiso-denegado') {
          notificacion.timeout = 10000
          notificacion.actions = [{ label: 'Cómo habilitarlo', color: 'white', handler: mostrarGuiaPermiso }]
        }
        $q.notify(notificacion)
      },
      alTerminar: (texto) => {
        estado.value = 'inactivo'
        if (sesionActiva === cancelar) sesionActiva = null
        motor = null
        if (texto?.trim()) alFinal?.(texto)
        else alCancelar?.()
      }
    })
  }

  // Al cerrar el diálogo o cambiar de página se libera el micrófono.
  onScopeDispose(cancelar)

  return { estado, progreso, iniciar, detener, cancelar }
}
