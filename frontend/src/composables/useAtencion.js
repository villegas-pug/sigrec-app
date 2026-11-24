// Avisos de «Atención requerida» del perfil activo (SPEC 011). SPEC 044: el backend los selecciona (`GET /inicio/resumen`) y
// aquí se redactan con los nombres de los centros del propio resumen; sin resumen no hay avisos que mostrar.
import { computed } from 'vue'
import { resumenInicio } from 'src/services/resumenInicio'
import { avisosDesdeResumen } from 'src/services/avisosResumen'

export function useAtencion () {
  const avisos = computed(() => {
    const resumen = resumenInicio.value
    if (!resumen) return { ahora: [], proximos: [] }
    const nombres = new Map(resumen.filas.map((f) => [f.car.id, f.car.nombre]))
    return avisosDesdeResumen(resumen.avisos, (carId) => nombres.get(carId) ?? carId)
  })
  return { avisos }
}
