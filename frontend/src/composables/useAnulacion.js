// Flujo común de baja lógica y reactivación. Confirma las operaciones REST antes de avisar.
import { reactive } from 'vue'
import { useQuasar } from 'quasar'
import { bloqueoDeReactivacion, reactivar } from 'src/services/acciones'

export function useAnulacion () {
  const $q = useQuasar()
  const anulacion = reactive({ abierto: false, guardando: false, datos: {}, mensaje: '', ejecutar: null, deshacer: null })

  function pedirAnulacion ({ titulo, subtitulo = '', aviso = '', dependencias = [], mensaje = 'Registro anulado.', ejecutar, registro = null, deshacer = null }) {
    const reversion = deshacer ?? (registro ? () => reactivar(registro) : null)
    Object.assign(anulacion, { abierto: true, datos: { titulo, subtitulo, aviso, dependencias }, mensaje, ejecutar, deshacer: reversion })
  }

  function errorDeOperacion (error) {
    $q.notify({ type: 'negative', message: error.message })
  }

  async function confirmarAnulacion (motivo) {
    if (anulacion.guardando) return
    anulacion.guardando = true
    try {
      await anulacion.ejecutar({ motivo })
      anulacion.abierto = false
      const deshacer = anulacion.deshacer
      $q.notify({
        type: 'positive',
        message: anulacion.mensaje,
        timeout: deshacer ? 8000 : undefined,
        actions: deshacer
          ? [{ label: 'Deshacer', icon: 'undo', color: 'white', handler: async () => {
              try {
                await deshacer()
                $q.notify({ type: 'info', message: 'Anulación deshecha: el registro vuelve a estar vigente.' })
              } catch (error) {
                errorDeOperacion(error)
              }
            } }]
          : []
      })
    } catch (error) {
      errorDeOperacion(error)
    } finally {
      anulacion.guardando = false
    }
  }

  function pedirReactivacion ({ entidad, registro, nombre, accion = reactivar }) {
    const bloqueo = bloqueoDeReactivacion(entidad, registro)
    if (bloqueo) {
      $q.notify({ type: 'warning', message: bloqueo })
      return
    }
    $q.dialog({
      title: `Reactivar ${nombre}`,
      message: 'El registro volverá a contar en los listados y los cálculos.',
      persistent: true,
      cancel: { flat: true, icon: 'close', label: 'Cancelar', color: 'secondary' },
      ok: { unelevated: true, icon: 'restore', label: 'Reactivar', color: 'primary' }
    }).onOk(async () => {
      try {
        await accion(registro)
        $q.notify({ type: 'positive', message: `${nombre} reactivado.` })
      } catch (error) {
        errorDeOperacion(error)
      }
    })
  }

  return { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion }
}
