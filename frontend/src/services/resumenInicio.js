// SPEC 044. Resumen de Inicio calculado por el backend (`GET /inicio/resumen`): indicadores, situación por centro y avisos,
// sin descargar las colecciones completas. Se guarda el último resumen recibido: Inicio lo muestra de inmediato y lo
// actualiza en segundo plano; la campana de la cabecera cuenta sus avisos.
import { ref, shallowRef } from 'vue'
import { api, despuesDeEscribir } from './api'

// Última respuesta válida. `shallowRef`: es un dato de solo lectura, no hace falta volver reactivas sus miles de propiedades.
export const resumenInicio = shallowRef(null)

// Cada escritura exitosa deja desactualizado lo calculado hasta ese momento. Inicio la observa para volver a pedirlo.
export const escrituras = ref(0)
despuesDeEscribir(() => { escrituras.value++ })

let generacion = 0
let secuencia = 0
let pendiente = null
let pendienteDesde = 0
let escrituraDelResumen = 0

/** ¿Hubo escrituras después de calcular el resumen que se tiene? */
export const resumenDesactualizado = () => !!resumenInicio.value && escrituraDelResumen !== escrituras.value

/**
 * Pide el resumen al backend. Las llamadas simultáneas comparten una sola solicitud, salvo que una escritura haya ocurrido
 * después de lanzarla: entonces se pide otra y prevalece la más reciente. Un fallo no se guarda (se puede reintentar) y una
 * respuesta de una sesión anterior no sustituye a la actual.
 */
export function cargarResumenInicio () {
  if (pendiente && pendienteDesde === escrituras.value) return pendiente
  const actual = generacion
  const mia = ++secuencia
  const desde = escrituras.value
  const solicitud = api('/inicio/resumen').then((datos) => {
    if (actual !== generacion) throw new Error('La sesión cambió durante la carga.')
    if (mia === secuencia) {
      resumenInicio.value = datos
      escrituraDelResumen = desde
    }
    return datos
  }).finally(() => {
    if (pendiente === solicitud) pendiente = null
  })
  pendiente = solicitud
  pendienteDesde = desde
  return solicitud
}

/** Olvida el resumen (cierre de sesión o cambio de usuario). */
export function reiniciarResumenInicio () {
  generacion++
  secuencia++
  pendiente = null
  resumenInicio.value = null
  escrituras.value = 0
  escrituraDelResumen = 0
}
