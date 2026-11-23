// SPEC 039 (modelo educalle). El menú que SRH entrega define las pantallas a las que accede el usuario; dentro de
// ellas no hay restricción por acción ni por ámbito. La carga de datos es por pantalla (SPEC 041, services/cargaDatos.js).
import { computed } from 'vue'
import { db, vigente } from 'src/services/datos'
import { rutaInicialMenu, rutasPermitidas, salir, usuario } from 'src/composables/useSesionIntranet'

// Perfil único y sin restricciones; conserva la forma que consumen las pantallas.
const perfil = computed(() => ({
  id: 'intranet',
  nombre: usuario.value?.nombre ?? '',
  accesos: [...rutasPermitidas.value],
  acciones: [],
  ambito: { descripcion: 'Todos los CAR · acceso total', carIds: null, vehiculoIds: null }
}))

const puedeAcceder = (ruta) => rutasPermitidas.value.has(ruta)
const puedeHacer = () => true
const enAmbitoCar = (carId) => db.cars.some((c) => c.id === carId)
const enAmbitoVehiculo = (vehiculo) => enAmbitoCar(vehiculo.carId)
const carsDelAmbito = (inactivos = false) => db.cars.filter((c) => enAmbitoCar(c.id) && (inactivos || vigente(c)))
const vehiculosDelAmbito = (inactivos = false) => db.vehiculos.filter((v) => enAmbitoVehiculo(v) && (inactivos || vigente(v)))
const carsEnAmbito = computed(() => carsDelAmbito())
const vehiculosEnAmbito = computed(() => vehiculosDelAmbito())
const carIdsEnAmbito = computed(() => perfil.value.ambito.carIds)
// Primera pantalla del menú de SRH, en su orden.
const rutaInicial = computed(() => rutaInicialMenu.value ?? 'sin-perfiles')

export function usePerfil () {
  return {
    perfil, puedeAcceder, puedeHacer, enAmbitoCar, carsDelAmbito, carsEnAmbito, carIdsEnAmbito,
    vehiculosDelAmbito, vehiculosEnAmbito, rutaInicial, cerrarSesion: salir
  }
}
