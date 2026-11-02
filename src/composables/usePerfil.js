// Perfil de demostración activo, sus accesos por ruta, sus acciones y su ámbito de datos.
// El estado es de módulo para que todas las vistas compartan el mismo perfil.
import { computed, ref, watch } from 'vue'
import { PERFILES, PERFIL_POR_DEFECTO } from 'src/config/perfiles'
import { db, vigente } from 'src/services/datos'
import { fijarAutor } from 'src/services/autor'

const CLAVE = 'sigrec.perfil'

function leerGuardado () {
  try {
    const valor = window.localStorage.getItem(CLAVE)
    return PERFILES.some((p) => p.id === valor) ? valor : null
  } catch {
    return null
  }
}

const perfilId = ref(leerGuardado() ?? PERFIL_POR_DEFECTO)

watch(perfilId, (valor) => {
  try {
    window.localStorage.setItem(CLAVE, valor)
  } catch {
    // Almacenamiento no disponible: el perfil se conserva solo durante la sesión.
  }
})

const perfil = computed(() => PERFILES.find((p) => p.id === perfilId.value) ?? PERFILES[0])

// Los registros nuevos quedan a nombre del perfil activo.
watch(perfil, (p) => fijarAutor(p.nombre), { immediate: true })

const puedeAcceder = (ruta) => perfil.value.accesos.includes(ruta)

const puedeHacer = (accion) => perfil.value.acciones.includes(accion)

// Solo un CAR existente puede estar en el ámbito; evita aceptar valores vacíos (p. ej. un ?car= ausente).
const enAmbitoCar = (carId) =>
  db.cars.some((c) => c.id === carId) && (perfil.value.ambito.carIds === null || perfil.value.ambito.carIds.includes(carId))

const enAmbitoVehiculo = (vehiculo) =>
  enAmbitoCar(vehiculo.carId) && (perfil.value.ambito.vehiculoIds === null || perfil.value.ambito.vehiculoIds.includes(vehiculo.id))

// Con `inactivos` se incluyen los registros anulados (para «Mostrar inactivos»).
const carsDelAmbito = (inactivos = false) => db.cars.filter((c) => enAmbitoCar(c.id) && (inactivos || vigente(c)))

const vehiculosDelAmbito = (inactivos = false) => db.vehiculos.filter((v) => enAmbitoVehiculo(v) && (inactivos || vigente(v)))

const carsEnAmbito = computed(() => carsDelAmbito())

const vehiculosEnAmbito = computed(() => vehiculosDelAmbito())

const carIdsEnAmbito = computed(() => perfil.value.ambito.carIds)

const rutaInicial = computed(() => perfil.value.accesos[0])

export function usePerfil () {
  return {
    perfiles: PERFILES,
    perfilId,
    perfil,
    puedeAcceder,
    puedeHacer,
    enAmbitoCar,
    carsDelAmbito,
    carsEnAmbito,
    carIdsEnAmbito,
    vehiculosDelAmbito,
    vehiculosEnAmbito,
    rutaInicial
  }
}
