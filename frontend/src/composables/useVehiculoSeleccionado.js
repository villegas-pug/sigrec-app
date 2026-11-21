// Vehículo seleccionado dentro del ámbito del perfil, compartido por Vehículos, Itinerarios y Combustible.
import { ref, watch } from 'vue'
import { usePerfil } from './usePerfil'

const vehiculoId = ref(null)

// `inicial` (p. ej. ?vehiculo= de la URL) solo se acepta si el vehículo está en el ámbito del perfil.
export function useVehiculoSeleccionado (inicial = null) {
  const { vehiculosEnAmbito } = usePerfil()

  if (inicial && vehiculosEnAmbito.value.some((v) => v.id === inicial)) vehiculoId.value = inicial

  watch(vehiculosEnAmbito, (lista) => {
    if (!lista.some((v) => v.id === vehiculoId.value)) vehiculoId.value = lista[0]?.id ?? null
  }, { immediate: true })

  return { vehiculoId, vehiculosEnAmbito }
}
