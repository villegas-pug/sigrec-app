// SPEC 041. Carga de datos por pantalla.
// SPEC 044: Inicio ya no es un grupo; su resumen viene calculado del backend (services/resumenInicio.js).
// SPEC 052: solo los catálogos y los tipos de bien se guardan en caché por sesión. Los demás grupos se piden
// cada vez, con la consulta de los filtros de cabecera (`?centro=&anio=&mes=`), para no mostrar datos desactualizados.
import { api } from 'src/services/api'
import { aplicarCatalogos } from 'src/config/catalogos'
import { aplicarJerarquia } from 'src/services/jerarquiaRest'
import { aplicarInventario, recordarConsultaInventario } from 'src/services/inventarioRest'
import { aplicarTiposBien } from 'src/services/tiposBienRest'
import { aplicarColeccion } from 'src/services/coleccionRest'
import { reiniciarResumenInicio } from 'src/services/resumenInicio'
import { reiniciarFiltros } from 'src/composables/useFiltrosCabecera'

const COLECCIONES = ['servicios', 'vehiculos', 'itinerarios', 'combustible', 'fotos', 'intervenciones', 'mantenimientos']
// Datos de referencia que cambian poco: se piden una vez por sesión.
const EN_CACHE = new Set(['catalogos', 'tiposBien', 'tiposBien:precios'])
let generacion = 0
// Turno de la última solicitud de cada grupo: una respuesta que llega tarde no pisa a una más reciente.
const turnos = new Map()

async function cargarSiVigente (grupo, solicitud, aplicar) {
  const generacionActual = generacion
  const turno = (turnos.get(grupo) ?? 0) + 1
  turnos.set(grupo, turno)
  const datos = await solicitud()
  if (generacionActual !== generacion) throw new Error('La sesión cambió durante la carga.')
  if (turnos.get(grupo) === turno) aplicar(datos)
}

// Cada grupo sabe cómo cargarse con la consulta recibida. `tiposBien:precios` incluye el historial de precios.
const CARGADORES = {
  // Etiquetas y valores de los catálogos del backend; se piden una vez por sesión, en toda pantalla.
  catalogos: () => cargarSiVigente('catalogos', () => api('/catalogos'), aplicarCatalogos),
  jerarquia: (consulta) => cargarSiVigente('jerarquia', () => api('/centros/jerarquia' + consulta), aplicarJerarquia),
  inventario: (consulta) => {
    // Las recargas tras guardar repiten la consulta filtrada de la pantalla.
    recordarConsultaInventario(consulta)
    return cargarSiVigente('inventario', () => api('/bienes/datos' + consulta), aplicarInventario)
  },
  tiposBien: () => cargarSiVigente('tiposBien', () => api('/catalogos/tipos-bien'), (tipos) => aplicarTiposBien(tipos)),
  'tiposBien:precios': () => cargarSiVigente(
    'tiposBien:precios',
    () => Promise.all([api('/catalogos/tipos-bien'), api('/precios')]),
    ([tipos, precios]) => aplicarTiposBien(tipos, precios)
  ),
  ...Object.fromEntries(COLECCIONES.map((nombre) => [nombre, (consulta) => cargarSiVigente(nombre, () => api('/' + nombre + consulta), (datos) => aplicarColeccion(nombre, datos))]))
}

// Un grupo que ya incluye a otro lo cubre (precios incluye tiposBien).
const CUBRE = { tiposBien: ['tiposBien:precios'] }

const cache = new Map()
const completos = new Set()

const claveCubierta = (grupo) => [grupo, ...(CUBRE[grupo] ?? [])].find((clave) => cache.has(clave))

/** ¿Faltan datos por pedir para esos grupos? Los grupos fuera de caché siempre se piden. */
export function faltanDatos (grupos = []) {
  const completo = (grupo) => EN_CACHE.has(grupo) && [grupo, ...(CUBRE[grupo] ?? [])].some((clave) => completos.has(clave))
  return grupos.some((grupo) => !completo(grupo))
}

function cargarEnCache (grupo) {
  const existente = claveCubierta(grupo)
  if (existente) return cache.get(existente)
  const generacionActual = generacion
  const promesa = CARGADORES[grupo]().then(() => {
    if (generacionActual === generacion) completos.add(grupo)
  }).catch((error) => {
    if (generacionActual === generacion) cache.delete(grupo)
    throw error
  })
  cache.set(grupo, promesa)
  return promesa
}

/**
 * Pide los grupos de una pantalla. Los de caché solo si faltan (un fallo no se guarda: se puede reintentar);
 * los demás siempre, con la consulta de `consultaDe(grupo)`.
 */
export async function asegurarDatos (grupos = [], consultaDe = () => '') {
  await Promise.all(grupos.map((grupo) => {
    if (!CARGADORES[grupo]) throw new Error(`Grupo de datos desconocido: ${grupo}`)
    return EN_CACHE.has(grupo) ? cargarEnCache(grupo) : CARGADORES[grupo](consultaDe(grupo))
  }))
}

// SPEC 052: quien carga datos fuera de la pantalla (el buscador global) pide después recargarla con sus filtros.
let recargaPantalla = () => {}

export function alRecargarPantalla (callback) {
  recargaPantalla = callback
}

export function recargarPantalla () {
  return recargaPantalla()
}

/** Olvida lo cargado (cierre de sesión o cambio de usuario). */
export function reiniciarCargaDatos () {
  generacion++
  cache.clear()
  completos.clear()
  recordarConsultaInventario('')
  // SPEC 052: los filtros de cabecera pertenecen a la sesión.
  reiniciarFiltros()
  // SPEC 044: el resumen de Inicio también pertenece a la sesión.
  reiniciarResumenInicio()
}
