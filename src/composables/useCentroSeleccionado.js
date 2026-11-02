// Centro seleccionado dentro del ámbito del perfil, compartido por las pantallas que filtran por centro.
// `inicial` (p. ej. ?car= de la URL) solo se acepta si el centro está en el ámbito del perfil.
// Con `todos` se ofrece también «Todos los centros del ámbito» cuando hay más de uno.
// `fuente` permite otra lista de centros (p. ej. incluir los anulados).
import { computed, ref, watch } from 'vue'
import { usePerfil } from './usePerfil'
import { carPorId } from 'src/services/datos'
import { TODOS } from 'src/config/catalogos'

export function useCentroSeleccionado (inicial = null, { todos = false, fuente = null } = {}) {
  const { carsEnAmbito, enAmbitoCar } = usePerfil()
  const cars = fuente ?? carsEnAmbito

  const valorPorDefecto = () => (todos && cars.value.length > 1 ? TODOS : cars.value[0]?.id ?? null)

  const carId = ref(enAmbitoCar(inicial) ? inicial : valorPorDefecto())

  watch(cars, (lista) => {
    if (carId.value !== TODOS && !lista.some((c) => c.id === carId.value)) carId.value = valorPorDefecto()
  })

  const opcionesCar = computed(() => [
    ...(todos && cars.value.length > 1 ? [{ label: `Todos los centros del ámbito (${cars.value.length})`, value: TODOS }] : []),
    ...cars.value.map((c) => ({ label: c.nombre, value: c.id }))
  ])

  const carIdsVisibles = computed(() => (carId.value === TODOS ? cars.value.map((c) => c.id) : carId.value ? [carId.value] : []))

  const car = computed(() => (carId.value && carId.value !== TODOS ? carPorId(carId.value) : null))

  return { carId, car, opcionesCar, carIdsVisibles }
}
