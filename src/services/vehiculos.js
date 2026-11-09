// Resumen del estado operativo de los vehículos (SPEC 010 §3). Solo cuentan los vehículos vigentes.
import { vigente } from './datos'
import { ESTADOS_VEHICULO, ESTADOS_VEHICULO_CON_ATENCION } from 'src/config/catalogos'

export const requiereAtencion = (vehiculo) => ESTADOS_VEHICULO_CON_ATENCION.includes(vehiculo.estadoOperativo)

/**
 * - Un vehículo sin estado informado no se cuenta como operativo.
 * - El presupuesto estimado suma solo los vehículos que requieren atención y lo informaron; los demás se cuentan en `sinEstimar`
 *   (nunca se asume cero).
 */
export function resumirEstadoVehiculos (vehiculos) {
  const activos = vehiculos.filter(vigente)
  const conAtencion = activos.filter(requiereAtencion)
  const conPresupuesto = conAtencion.filter((v) => v.mantenimiento?.presupuestoEstimado != null)
  return {
    total: activos.length,
    operativos: activos.filter((v) => v.estadoOperativo === 'operativo').length,
    requierenMantenimiento: activos.filter((v) => v.estadoOperativo === 'requiereMantenimiento').length,
    detenidos: activos.filter((v) => v.estadoOperativo === 'detenido').length,
    sinInformar: activos.filter((v) => !ESTADOS_VEHICULO[v.estadoOperativo]).length,
    requierenAtencion: conAtencion.length,
    presupuestoEstimado: conPresupuesto.reduce((suma, v) => suma + v.mantenimiento.presupuestoEstimado, 0),
    sinEstimar: conAtencion.length - conPresupuesto.length
  }
}
