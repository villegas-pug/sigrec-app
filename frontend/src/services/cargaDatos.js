// SPEC 041. Carga de datos por pantalla con caché por sesión: cada grupo se pide una sola vez.
// SPEC 044: Inicio ya no es un grupo; su resumen viene calculado del backend (services/resumenInicio.js).
import { api } from 'src/services/api'
import { aplicarCatalogos } from 'src/config/catalogos'
import { aplicarJerarquia } from 'src/services/jerarquiaRest'
import { aplicarInventario } from 'src/services/inventarioRest'
import { aplicarTiposBien } from 'src/services/tiposBienRest'
import { aplicarColeccion } from 'src/services/coleccionRest'
import { reiniciarResumenInicio } from 'src/services/resumenInicio'

const COLECCIONES = ['servicios', 'vehiculos', 'itinerarios', 'combustible', 'fotos', 'intervenciones', 'mantenimientos']
let generacion = 0

async function cargarSiVigente (solicitud, aplicar) {
  const generacionActual = generacion
  const datos = await solicitud()
  if (generacionActual !== generacion) throw new Error('La sesión cambió durante la carga.')
  aplicar(datos)
}

// Cada grupo sabe cómo cargarse. `tiposBien:precios` incluye el historial de precios.
const CARGADORES = {
  // Etiquetas y valores de los catálogos del backend; se piden una vez por sesión, en toda pantalla.
  catalogos: () => cargarSiVigente(() => api('/catalogos'), aplicarCatalogos),
  jerarquia: () => cargarSiVigente(() => api('/centros/jerarquia'), aplicarJerarquia),
  inventario: () => cargarSiVigente(() => api('/bienes/datos'), aplicarInventario),
  tiposBien: () => cargarSiVigente(() => api('/catalogos/tipos-bien'), (tipos) => aplicarTiposBien(tipos)),
  'tiposBien:precios': () => cargarSiVigente(
    () => Promise.all([api('/catalogos/tipos-bien'), api('/precios')]),
    ([tipos, precios]) => aplicarTiposBien(tipos, precios)
  ),
  ...Object.fromEntries(COLECCIONES.map((nombre) => [nombre, () => cargarSiVigente(() => api('/' + nombre), (datos) => aplicarColeccion(nombre, datos))]))
}

// Un grupo que ya incluye a otro lo cubre (precios incluye tiposBien).
const CUBRE = { tiposBien: ['tiposBien:precios'] }

const cache = new Map()
const completos = new Set()

const claveCubierta = (grupo) => [grupo, ...(CUBRE[grupo] ?? [])].find((clave) => cache.has(clave))

/** ¿Faltan datos por pedir para esos grupos? Sirve para mostrar el indicador de carga solo cuando hace falta. */
export function faltanDatos (grupos = []) {
  const completo = (grupo) => [grupo, ...(CUBRE[grupo] ?? [])].some((clave) => completos.has(clave))
  return grupos.some((grupo) => !completo(grupo))
}

/** Pide solo los grupos que no están en caché. Un fallo no se guarda: se puede reintentar. */
export async function asegurarDatos (grupos = []) {
  const pendientes = grupos.map((grupo) => {
    const existente = claveCubierta(grupo)
    if (existente) return cache.get(existente)
    const cargador = CARGADORES[grupo]
    if (!cargador) throw new Error(`Grupo de datos desconocido: ${grupo}`)
    const generacionActual = generacion
    const promesa = cargador().then(() => {
      if (generacionActual === generacion) completos.add(grupo)
    }).catch((error) => {
      if (generacionActual === generacion) cache.delete(grupo)
      throw error
    })
    cache.set(grupo, promesa)
    return promesa
  })
  await Promise.all(pendientes)
}

/** Olvida lo cargado (cierre de sesión o cambio de usuario). */
export function reiniciarCargaDatos () {
  generacion++
  cache.clear()
  completos.clear()
  // SPEC 044: el resumen de Inicio también pertenece a la sesión.
  reiniciarResumenInicio()
}
