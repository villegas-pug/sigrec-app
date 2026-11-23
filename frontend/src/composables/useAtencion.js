// Avisos de «Atención requerida» del perfil activo (SPEC 011). Los comparten Inicio y el contador de la cabecera.
import { computed } from 'vue'
import { inicioListo } from 'src/services/cargaDatos'
import { usePerfil } from './usePerfil'
import { avisosDeAtencion } from 'src/services/atencion'
import { anioRevision, anioServicios, hoy } from 'src/config/reglas'

export function useAtencion () {
  const { carsEnAmbito, vehiculosEnAmbito } = usePerfil()
  // SPEC 042: los avisos solo son fiables con todas las colecciones de Inicio cargadas.
  const avisos = computed(() => !inicioListo.value ? { ahora: [], proximos: [] } :
    avisosDeAtencion({ cars: carsEnAmbito.value, vehiculos: vehiculosEnAmbito.value, fechaCorte: hoy(), anio: anioRevision(), anioServicios: anioServicios() })
  )
  return { avisos }
}
