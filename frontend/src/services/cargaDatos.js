// SPEC 041. Carga de datos por pantalla con caché por sesión: cada grupo se pide una sola vez.
import { ref } from 'vue'
import { api } from 'src/services/api'
import { aplicarCatalogos } from 'src/config/catalogos'
import { aplicarJerarquia } from 'src/services/jerarquiaRest'
import { aplicarInventario } from 'src/services/inventarioRest'
import { aplicarTiposBien } from 'src/services/tiposBienRest'
import { aplicarColeccion } from 'src/services/coleccionRest'

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

// Grupos que una sola llamada del backend entrega completos. Inicio los necesita todos para calcular sus indicadores.
const COMPUESTOS = {
  inicio: {
    grupos: ['jerarquia', 'inventario', 'tiposBien:precios', 'servicios', 'vehiculos', 'itinerarios', 'combustible', 'mantenimientos'],
    // Solo aplica los grupos que faltaban: reemplazar uno ya cargado desconectaría los objetos que las pantallas conservan.
    cargar: async (faltantes) => {
      const generacionActual = generacion
      const datos = await api('/inicio/datos')
      if (generacionActual !== generacion) throw new Error('La sesión cambió durante la carga.')
      if (faltantes.includes('jerarquia')) aplicarJerarquia(datos.jerarquia)
      if (faltantes.includes('inventario')) aplicarInventario(datos.inventario)
      if (faltantes.includes('tiposBien:precios')) aplicarTiposBien(datos.tiposBien, datos.precios)
      for (const coleccion of ['servicios', 'vehiculos', 'itinerarios', 'combustible', 'mantenimientos']) {
        if (faltantes.includes(coleccion)) aplicarColeccion(coleccion, datos[coleccion])
      }
    }
  }
}

// Un grupo que ya incluye a otro lo cubre (precios incluye tiposBien).
const CUBRE = { tiposBien: ['tiposBien:precios'] }

const cache = new Map()
const completos = new Set()

// Verdadero cuando Inicio ya tiene todas sus colecciones: los avisos de atención solo son fiables con ellas completas.
export const inicioListo = ref(false)

const claveCubierta = (grupo) => [grupo, ...(CUBRE[grupo] ?? [])].find((clave) => cache.has(clave))

/** ¿Faltan datos por pedir para esos grupos? Sirve para mostrar el indicador de carga solo cuando hace falta. */
export function faltanDatos (grupos = []) {
  const completo = (grupo) => [grupo, ...(CUBRE[grupo] ?? [])].some((clave) => completos.has(clave))
  return grupos.some((grupo) => (COMPUESTOS[grupo] ? COMPUESTOS[grupo].grupos.some((g) => !completo(g)) : !completo(grupo)))
}

function cargarCompuesto (nombre) {
  const generacionActual = generacion
  const { grupos, cargar } = COMPUESTOS[nombre]
  const pendientes = grupos.filter((g) => !claveCubierta(g))
  if (!pendientes.length) {
    // La caché también contiene promesas en curso: no marcar Inicio listo antes de que terminen.
    return Promise.all(grupos.map((g) => cache.get(claveCubierta(g))))
      .then(() => { if (nombre === 'inicio' && generacionActual === generacion) inicioListo.value = true })
  }
  // SPEC 042: si ya hay datos o solicitudes en curso, evitar que /inicio/datos vuelva a transferirlos.
  if (pendientes.length < grupos.length) {
    const existentes = grupos.map((g) => cache.get(claveCubierta(g))).filter(Boolean)
    return Promise.all([...existentes, asegurarDatos(pendientes)])
      .then(() => { if (nombre === 'inicio' && generacionActual === generacion) inicioListo.value = true })
  }
  // Una sola llamada: todos los grupos pendientes comparten su promesa; si falla, ninguno queda en caché.
  const promesa = cargar(pendientes).then(() => {
    if (generacionActual === generacion) pendientes.forEach((g) => completos.add(g))
  }).catch((error) => {
    if (generacionActual === generacion) pendientes.forEach((g) => cache.delete(g))
    throw error
  })
  pendientes.forEach((g) => cache.set(g, promesa))
  return Promise.all(grupos.map((g) => cache.get(claveCubierta(g))))
    .then(() => { if (nombre === 'inicio' && generacionActual === generacion) inicioListo.value = true })
}

/** Pide solo los grupos que no están en caché. Un fallo no se guarda: se puede reintentar. */
export async function asegurarDatos (grupos = []) {
  const pendientes = grupos.map((grupo) => {
    if (COMPUESTOS[grupo]) return cargarCompuesto(grupo)
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
  inicioListo.value = false
}
