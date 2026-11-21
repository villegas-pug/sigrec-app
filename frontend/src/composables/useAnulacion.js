// Flujo común de baja lógica: pide el motivo (AnularDialog), ejecuta la acción y avisa con la opción «Deshacer».
// También ofrece la reactivación de un registro anulado con sus bloqueos y confirmación.
import { reactive } from 'vue'
import { useQuasar } from 'quasar'
import { bloqueoDeReactivacion, reactivar } from 'src/services/acciones'

export function useAnulacion () {
  const $q = useQuasar()

  // Estado del AnularDialog: <anular-dialog v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
  const anulacion = reactive({ abierto: false, datos: {}, mensaje: '', ejecutar: null, deshacer: null })

  // `ejecutar(motivo)` aplica la baja; `dependencias` bloquea la anulación mientras no esté vacía.
  // `registro`: con él, «Deshacer» lo reactiva (reactivar genérico). `deshacer` reemplaza esa reversión si la anulación tiene
  // efectos adicionales (p. ej. un bien con sus componentes). Sin ninguno de los dos, la notificación no ofrece «Deshacer».
  function pedirAnulacion ({ titulo, subtitulo = '', aviso = '', dependencias = [], mensaje = 'Registro anulado.', ejecutar, registro = null, deshacer = null }) {
    const reversion = deshacer ?? (registro ? () => reactivar(registro) : null)
    Object.assign(anulacion, { abierto: true, datos: { titulo, subtitulo, aviso, dependencias }, mensaje, ejecutar, deshacer: reversion })
  }

  function confirmarAnulacion (motivo) {
    anulacion.ejecutar({ motivo })
    anulacion.abierto = false
    const deshacer = anulacion.deshacer
    $q.notify({
      type: 'positive',
      message: anulacion.mensaje,
      timeout: deshacer ? 8000 : undefined,
      actions: deshacer
        ? [{ label: 'Deshacer', icon: 'undo', color: 'white', handler: () => { deshacer(); $q.notify({ type: 'info', message: 'Anulación deshecha: el registro vuelve a estar vigente.' }) } }]
        : []
    })
  }

  // `entidad` identifica el bloqueo (ver bloqueoDeReactivacion); `accion` reemplaza a `reactivar` si hay efectos adicionales.
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
    }).onOk(() => {
      accion(registro)
      $q.notify({ type: 'positive', message: `${nombre} reactivado.` })
    })
  }

  return { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion }
}
