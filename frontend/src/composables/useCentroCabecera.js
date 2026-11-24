// SPEC 052. Centro de los filtros de cabecera con la forma que usaban las pantallas (`useCentroSeleccionado`):
// `carId` vale TODOS sin centro; asignarlo cambia el filtro de cabecera y el layout vuelve a pedir los datos.
import { computed } from 'vue'
import { TODOS } from 'src/config/catalogos'
import { carPorId } from 'src/services/datos'
import { useFiltrosCabecera } from './useFiltrosCabecera'
import { usePerfil } from './usePerfil'

export function useCentroCabecera () {
  const { carsEnAmbito } = usePerfil()
  const { filtros, fijarCentro } = useFiltrosCabecera()

  const carId = computed({
    get: () => filtros.centro ?? TODOS,
    set: (id) => fijarCentro(id && id !== TODOS ? id : null)
  })
  const car = computed(() => (filtros.centro ? carPorId(filtros.centro) : null))
  // Los centros cargados ya vienen acotados por el filtro; se repite el criterio por si la recarga aún no llega.
  const carIdsVisibles = computed(() => carsEnAmbito.value.filter((c) => carId.value === TODOS || c.id === carId.value).map((c) => c.id))

  return { carId, car, carIdsVisibles }
}
