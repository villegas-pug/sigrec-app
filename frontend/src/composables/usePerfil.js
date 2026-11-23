// La API resuelve la cuenta y sus asignaciones. El selector solo elige entre asignaciones recibidas.
import { computed, ref, watch } from 'vue'
import { api, limpiarCsrf } from 'src/services/api'
import { aplicarCatalogos } from 'src/config/catalogos'
import { db, restablecerDatos, vigente } from 'src/services/datos'
import { cargarJerarquia } from 'src/services/jerarquiaRest'
import { cargarInventario } from 'src/services/inventarioRest'
import { cargarTiposBien } from 'src/services/tiposBienRest'
import { cargarColeccion } from 'src/services/coleccionRest'

const CLAVE = 'sigrec.asignacion'
const RUTAS_CON_VALORACION = new Set(['inicio', 'centros', 'incidencias', 'necesidades', 'inventario', 'precios'])
const cuenta = ref(null)
const perfilId = ref(null)
const errorSesion = ref('')
let carga
let resuelta = false

const perfiles = computed(() => cuenta.value?.asignaciones.map((a) => ({
  id: a.id,
  nombre: a.nombre,
  accesos: a.rutas,
  acciones: a.acciones,
  ambito: {
    descripcion: a.vehiculo ? `Movilidad ${a.vehiculo} · ${a.centro.nombre}` : a.centro?.nombre ?? 'Todos los CAR · acceso total',
    carIds: a.centro ? [a.centro.codigo] : null,
    vehiculoIds: a.vehiculo ? [a.vehiculo] : null
  }
})) ?? [])
const perfil = computed(() => perfiles.value.find((p) => p.id === perfilId.value) ?? perfiles.value[0] ??
  { nombre: cuenta.value?.nombre ?? '', accesos: [], acciones: [], ambito: { descripcion: 'Sin asignaciones', carIds: [], vehiculoIds: [] } })

function leerAsignacion (usuario) {
  try {
    const seleccion = JSON.parse(window.localStorage.getItem(CLAVE))
    return seleccion?.usuario === usuario ? seleccion.id : null
  } catch {
    return null
  }
}

watch(perfilId, (id) => {
  if (!cuenta.value || id == null) return
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify({ usuario: cuenta.value.id, id }))
  } catch {
    // El perfil se conserva durante la sesión si el navegador bloquea el almacenamiento.
  }
})
async function esperarLecturas (lecturas) {
  const resultados = await Promise.allSettled(lecturas)
  const fallo = resultados.find((r) => r.status === 'rejected')
  if (fallo) throw fallo.reason
  return resultados.map((r) => r.value)
}

async function resolverSesion () {
  try {
    const sesion = await api('/auth/me', { notificarSesion: false })
    const accesos = sesion.asignaciones
    if (accesos.some((a) => a.rutas.includes('centros'))) {
      await esperarLecturas([cargarJerarquia(), cargarInventario()])
    }
    // El ámbito vehicular incluye solo el contexto mínimo del centro del vehículo asignado.
    for (const { centro, vehiculo } of accesos) {
      if (vehiculo && !db.cars.some((c) => c.id === centro.codigo)) {
        db.cars.push({ id: centro.codigo, nombre: centro.nombre, inmueble: {} })
      }
    }
    const veRuta = (ruta) => accesos.some((a) => a.rutas.includes(ruta))
    await esperarLecturas([
      accesos.some((a) => a.alcance !== 'VEHICULO' && a.rutas.includes('servicios')) && cargarColeccion('servicios'),
      (veRuta('vehiculos') || veRuta('centros')) && cargarColeccion('vehiculos'),
      veRuta('itinerarios') && cargarColeccion('itinerarios'),
      veRuta('combustible') && cargarColeccion('combustible'),
      veRuta('centros') && cargarColeccion('fotos'),
      veRuta('centros') && cargarColeccion('intervenciones'),
      (veRuta('centros') || veRuta('vehiculos')) && cargarColeccion('mantenimientos')
    ])
    if (accesos.length) {
      const incluirPrecios = accesos.some((a) =>
        a.alcance !== 'VEHICULO' && a.rutas.some((ruta) => RUTAS_CON_VALORACION.has(ruta)))
      const [catalogos] = await esperarLecturas([api('/catalogos'), cargarTiposBien({ incluirPrecios })])
      aplicarCatalogos(catalogos)
    }
    cuenta.value = sesion
    const guardada = leerAsignacion(sesion.id)
    perfilId.value = accesos.some((a) => a.id === guardada) ? guardada : (accesos[0]?.id ?? null)
    errorSesion.value = ''
    resuelta = true
  } catch (error) {
    restablecerDatos()
    cuenta.value = null
    if (error.status !== 401) throw error
    resuelta = true
  }
}

export async function cargarSesion () {
  if (resuelta) return
  carga ??= resolverSesion().catch((error) => {
    errorSesion.value = error.message
  }).finally(() => { carga = undefined })
  await carga
}

export function olvidarSesion () {
  limpiarCsrf()
  cuenta.value = null
  perfilId.value = null
  resuelta = true
  restablecerDatos()
}

async function iniciarSesion (usuario, password) {
  await api('/auth/login', { method: 'POST', body: { usuario, password }, notificarSesion: false })
  limpiarCsrf()
  restablecerDatos()
  await resolverSesion()
}

async function cerrarSesion () {
  try {
    await api('/auth/logout', { method: 'POST', notificarSesion: false })
  } catch (error) {
    if (error.status !== 401) throw error
  }
  olvidarSesion()
}

const puedeAcceder = (ruta) => perfil.value.accesos.includes(ruta)
const puedeHacer = (accion) => perfil.value.acciones.includes(accion)
const enAmbitoCar = (carId) =>
  db.cars.some((c) => c.id === carId) && (perfil.value.ambito.carIds === null || perfil.value.ambito.carIds.includes(carId))
const enAmbitoVehiculo = (vehiculo) =>
  enAmbitoCar(vehiculo.carId) && (perfil.value.ambito.vehiculoIds === null || perfil.value.ambito.vehiculoIds.includes(vehiculo.id))
const carsDelAmbito = (inactivos = false) => db.cars.filter((c) => enAmbitoCar(c.id) && (inactivos || vigente(c)))
const vehiculosDelAmbito = (inactivos = false) => db.vehiculos.filter((v) => enAmbitoVehiculo(v) && (inactivos || vigente(v)))
const carsEnAmbito = computed(() => carsDelAmbito())
const vehiculosEnAmbito = computed(() => vehiculosDelAmbito())
const carIdsEnAmbito = computed(() => perfil.value.ambito.carIds)
const rutaInicial = computed(() => perfil.value.accesos[0] ?? 'sin-perfiles')

export function usePerfil () {
  return {
    cuenta, errorSesion, iniciarSesion, cerrarSesion, perfiles, perfilId, perfil, puedeAcceder, puedeHacer, enAmbitoCar,
    carsDelAmbito, carsEnAmbito, carIdsEnAmbito, vehiculosDelAmbito, vehiculosEnAmbito, rutaInicial
  }
}
