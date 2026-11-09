// Avisos de «Atención requerida» del perfil activo (SPEC 011). Los comparten Inicio y el contador de la cabecera.
import { computed } from 'vue'
import { usePerfil } from './usePerfil'
import { avisosDeAtencion } from 'src/services/atencion'
import { ANIO_REVISION, FECHA_CORTE } from 'src/config/demo'

// Año de los períodos de pago que se revisan: el de la fecha de corte.
export const ANIO_SERVICIOS = Number(FECHA_CORTE.slice(0, 4))

export function useAtencion () {
  const { carsEnAmbito, vehiculosEnAmbito } = usePerfil()
  const avisos = computed(() =>
    avisosDeAtencion({ cars: carsEnAmbito.value, vehiculos: vehiculosEnAmbito.value, fechaCorte: FECHA_CORTE, anio: ANIO_REVISION, anioServicios: ANIO_SERVICIOS })
  )
  return { avisos }
}
