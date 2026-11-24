// SPEC 044. Totales de la situación por centro. Es lo único de Inicio que se calcula en el navegador: suma las filas que
// el backend entrega calculadas (`GET /inicio/resumen`), con la misma forma que `resumenPorCentro` (services/situacion.js).
const sumar = (lista) => lista.reduce((suma, n) => suma + n, 0)

export function totalizarSituacion (filas) {
  const total = (fn) => sumar(filas.map(fn))
  return {
    centros: filas.length,
    necesidades: total((f) => f.necesidades.cantidad),
    importeConocido: total((f) => f.necesidades.importeConocido),
    sinValorar: total((f) => f.necesidades.sinValorar),
    bienesActivos: total((f) => f.bienesActivos),
    bienesMalos: total((f) => f.bienesMalos),
    registrosActivos: total((f) => f.registrosActivos),
    verificados: total((f) => f.verificados),
    controlesVencidos: total((f) => f.controles.vencidos),
    controlesPorVencer: total((f) => f.controles.porVencer),
    extintoresFaltantes: total((f) => f.controles.extintoresFaltantes),
    vehiculosConAtencion: total((f) => f.vehiculos.requierenAtencion),
    presupuestoVehiculos: total((f) => f.vehiculos.presupuestoEstimado),
    vehiculosSinEstimar: total((f) => f.vehiculos.sinEstimar)
  }
}
