// Vehículo seleccionado dentro del ámbito del perfil, compartido por Movilidad y Combustible.
import { ref, watch } from 'vue'
import { usePerfil } from './usePerfil'

const vehiculoId = ref(null)

export function useVehiculoSeleccionado () {
  const { vehiculosEnAmbito } = usePerfil()

  watch(vehiculosEnAmbito, (lista) => {
    if (!lista.some((v) => v.id === vehiculoId.value)) vehiculoId.value = lista[0]?.id ?? null
  }, { immediate: true })

  return { vehiculoId, vehiculosEnAmbito }
}
