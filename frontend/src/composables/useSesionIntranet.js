// SPEC 039. Port a Vue 3 del flujo de ingreso de educalle-app (layouts/MainLayout.vue): la intranet redirige con
// un JWT en `?p=`, SRH valida al usuario y entrega su menú, y la sesión vive en localStorage (claves «sgr-*»).
import { computed, ref } from 'vue'
import { Dialog, LocalStorage, Notify } from 'quasar'
import HmacSHA256 from 'crypto-js/hmac-sha256'
import Base64 from 'crypto-js/enc-base64'
import routes from 'src/router/routes'
import { alVencerSesion } from 'src/services/api'
import { reiniciarCargaDatos } from 'src/services/cargaDatos'
import { restablecerDatos } from 'src/services/datos'
import { INTRANET, PREFIJO } from 'src/config/intranet'

const clave = (nombre) => `${PREFIJO}${nombre}`
const leer = (nombre) => LocalStorage.getItem(clave(nombre))
// Un dato que SRH no entrega no se guarda (Quasar escribiría «undefined»).
const escribir = (nombre, valor) => { if (valor !== undefined && valor !== null) LocalStorage.set(clave(nombre), valor) }
const quitar = (nombre) => LocalStorage.remove(clave(nombre))
const existe = (nombre) => LocalStorage.has(clave(nombre))
const valorTexto = (nombre) => String(leer(nombre) ?? '').replace(/^__q_\w+\|/, '')

// Estado compartido de módulo.
export const usuario = ref(leerUsuario())
const menuBackend = ref([])
export const menuCargado = ref(false)
let intervaloSesion = null
let dialogoAbierto = false

function leerUsuario () {
  return existe('idUsuario') ? { nombre: valorTexto('nombreCompleto'), unidad: valorTexto('nombreUnidad') } : null
}

// ───────────── Token `p` ─────────────

export function leerParametroP (route) {
  const enRuta = route?.query?.p
  const valor = Array.isArray(enRuta) ? enRuta[0] : enRuta
  if (valor) return valor
  const hash = window.location.hash || ''
  const indice = hash.indexOf('?')
  const desdeHash = indice === -1 ? null : new URLSearchParams(hash.slice(indice + 1)).get('p')
  return desdeHash || new URLSearchParams(window.location.search).get('p')
}

/** Quita `p` de la dirección visible para no dejar el token en el historial. */
function quitarParametroP () {
  const url = new URL(window.location.href)
  const enBusqueda = url.searchParams.has('p')
  url.searchParams.delete('p')
  const hash = url.hash
  const indice = hash.indexOf('?')
  if (indice !== -1) {
    const parametros = new URLSearchParams(hash.slice(indice + 1))
    if (parametros.has('p')) {
      parametros.delete('p')
      const resto = parametros.toString()
      url.hash = hash.slice(0, indice) + (resto ? `?${resto}` : '')
    }
  }
  if (enBusqueda || url.href !== window.location.href) window.history.replaceState(window.history.state, '', url)
}

function parseJwt (token) {
  if (!token || typeof token !== 'string') return null
  const partes = token.split('.')
  if (partes.length !== 3) return null
  try {
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
    return JSON.parse(json)
  } catch {
    return null
  }
}

// ───────────── Token de sesión local (HS256, como educalle) ─────────────

const base64Url = (texto) => {
  const bytes = new TextEncoder().encode(texto)
  let binario = ''
  bytes.forEach((byte) => { binario += String.fromCharCode(byte) })
  return btoa(binario).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

const firmar = (contenido) => HmacSHA256(contenido, INTRANET.secretoToken).toString(Base64)
  .replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')

function crearTokenSesion (payload) {
  const ahora = Math.floor(Date.now() / 1000)
  const cuerpo = { ...payload, exp: ahora + INTRANET.minutosToken * 60 }
  const encabezado = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const contenido = base64Url(JSON.stringify(cuerpo))
  return `${encabezado}.${contenido}.${firmar(`${encabezado}.${contenido}`)}`
}

function verificarTokenSesion (token) {
  if (!token || typeof token !== 'string') return null
  const partes = token.split('.')
  if (partes.length !== 3) return null
  if (partes[2] !== firmar(`${partes[0]}.${partes[1]}`)) return null
  return parseJwt(token)
}

function revisarSesion () {
  const token = leer('session-token')
  if (!token) return
  const payload = verificarTokenSesion(String(token))
  if (!payload || (payload.exp && payload.exp <= Math.floor(Date.now() / 1000))) mostrarSesionExpirada()
}

function iniciarRevisionSesion () {
  if (intervaloSesion) clearInterval(intervaloSesion)
  revisarSesion()
  intervaloSesion = setInterval(revisarSesion, 5000)
}

function mostrarSesionExpirada () {
  if (dialogoAbierto) return
  dialogoAbierto = true
  escribir('session-dialog-open', '1')
  if (intervaloSesion) clearInterval(intervaloSesion)
  Dialog.create({
    title: 'Sesión expirada',
    message: 'Su sesión ha vencido. ¿Desea continuar trabajando?',
    persistent: true,
    ok: { label: 'Sí, continuar', color: 'positive', unelevated: true, icon: 'check_circle' },
    cancel: { label: 'No, salir', color: 'grey-5', textColor: 'dark', unelevated: true, icon: 'logout' }
  }).onOk(() => {
    quitar('session-dialog-open')
    const original = leer('payload')
    if (original) escribir('session-token', crearTokenSesion(typeof original === 'string' ? JSON.parse(original) : original))
    dialogoAbierto = false
    iniciarRevisionSesion()
  }).onCancel(() => {
    dialogoAbierto = false
    quitar('session-dialog-open')
    limpiarSesion()
  })
}

// ───────────── Sesión ─────────────

/** Borra las claves `sgr-*` y los datos en memoria. Con `redirigir`, vuelve a la intranet. */
export function limpiarSesion (redirigir = true) {
  if (intervaloSesion) clearInterval(intervaloSesion)
  intervaloSesion = null
  Object.keys(LocalStorage.getAll()).filter((k) => k.startsWith(PREFIJO)).forEach((k) => LocalStorage.remove(k))
  usuario.value = null
  menuBackend.value = []
  menuCargado.value = false
  reiniciarCargaDatos()
  restablecerDatos()
  if (redirigir && INTRANET.urlIntranet) window.location.href = INTRANET.urlIntranet
}

/** Botón «Salir»: limpia la sesión y va a la página principal de seguridad de la intranet. */
export function salir () {
  limpiarSesion(false)
  if (INTRANET.urlSalir) window.location.href = INTRANET.urlSalir
}

async function consultarSrh (parametros) {
  if (!INTRANET.srhUrl) throw new Error('Falta la dirección del servicio de permisos (SIGREC_SRH_URL).')
  const respuesta = await fetch(`${INTRANET.srhUrl}/SPermiso?${new URLSearchParams(parametros)}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(20000)
  })
  if (!respuesta.ok) throw new Error(`SRH respondió ${respuesta.status}`)
  const texto = await respuesta.text()
  return texto.trim() ? JSON.parse(texto) : null
}

const avisar = (message) => Notify.create({ type: 'negative', message })

/**
 * Procesa el token `p` (igual que `recibirParametros` de educalle). Devuelve true si la sesión quedó creada.
 */
async function recibirParametros (route) {
  const token = leerParametroP(route)
  if (!token) return avisar('No llegó el parámetro p')
  const payload = parseJwt(token)
  if (!payload) return avisar('Token inválido')
  const { idUsuario, idSistema, exp } = payload
  if (!idUsuario || !idSistema) return avisar('Token incompleto')
  if (exp && exp < Math.floor(Date.now() / 1000)) return avisar('Token expirado')

  let datos
  try {
    datos = await consultarSrh({ action: 'login', tipo: 'PERFIL_POR_USUARIO_Y_SISTEMA', u: idUsuario, s: idSistema })
  } catch (error) {
    console.error(error)
    return avisar('No se pudo validar el usuario')
  }
  if (!datos) {
    limpiarSesion(false)
    avisar('NO ESTÁ AUTORIZADO A INGRESAR')
    if (INTRANET.urlIntranet) window.location.href = INTRANET.urlIntranet
    return false
  }

  escribir('idUsuario', datos.idUsuario)
  escribir('idPerfil', datos.idPerfil)
  escribir('nombreUsuario', datos.nombreUsuario)
  escribir('nombreCompleto', datos.nombresApellidos)
  escribir('nombreUnidad', datos.unidadOrganica)
  escribir('idPersonal', datos.idPersonal)
  escribir('numeroDocumento', datos.perNroDocumento)
  escribir('token', token)
  escribir('payload', JSON.stringify(payload))
  escribir('session-token', crearTokenSesion(payload))
  usuario.value = leerUsuario()
  iniciarRevisionSesion()
  return true
}

// ───────────── Menú ─────────────

function resolverEnlaceMenu (item, descripcion) {
  const enlace = String(item?.enlace || '').trim()
  return descripcion === 'INICIO' && enlace === '#' ? 'inicio' : enlace
}

function normalizarNodoMenu (item = {}) {
  const descripcion = String(item.descripcion || '').trim()
  const subitems = Array.isArray(item.subitems) ? item.subitems.map(normalizarNodoMenu) : []
  return { ...item, descripcion, enlace: resolverEnlaceMenu(item, descripcion), subitems }
}

const normalizarArbolMenu = (items = []) => items.map(normalizarNodoMenu)

/** Trae el árbol módulo › menú › submenú que SRH asigna al usuario en SIGREC. */
async function obtenerOpcionesMenu () {
  menuCargado.value = false
  try {
    const datos = await consultarSrh({ action: 'itemsMenu2', u: valorTexto('idUsuario'), s: INTRANET.sistemaId })
    menuBackend.value = normalizarArbolMenu(Array.isArray(datos) ? datos : [])
  } catch (error) {
    console.error(error)
    menuBackend.value = []
    avisar('No se pudo cargar el menú de la intranet')
  } finally {
    menuCargado.value = true
  }
}

const porOrden = (a, b) => (a.orden ?? 0) - (b.orden ?? 0)

export const menuOrdenado = computed(() => [...menuBackend.value].sort(porOrden).map((modulo) => ({
  ...modulo,
  subitems: [...modulo.subitems].sort(porOrden).map((menu) => ({ ...menu, subitems: [...menu.subitems].sort(porOrden) }))
})))

const titulosOcultos = new Set(['SIGREC', 'SIGESU', 'SISEC'])
export const ocultarTituloModulo = (modulo) => titulosOcultos.has(String(modulo?.descripcion || '').trim().toUpperCase())
export const obtenerDescripcionVisible = (descripcion) => (descripcion === 'INICIO' ? 'Inicio' : descripcion)

// Enlaces (paths) navegables: habilitados y con destino real.
const esEnlace = (nodo) => !!nodo.enlace && nodo.enlace !== '#' && Number(nodo.flgDeshabilitado ?? 0) !== 1
const recorrer = (nodos) => nodos.flatMap((nodo) => [...(esEnlace(nodo) ? [nodo.enlace.replace(/^\/+/, '')] : []), ...recorrer(nodo.subitems)])

/** Path → nombre de ruta, derivado de router/routes.js (`necesidades/inventario` → `inventario`). */
function mapaDeRutas () {
  const mapa = {}
  for (const raiz of routes) {
    for (const hija of raiz.children ?? []) {
      if (hija.name && hija.path && !hija.redirect) mapa[hija.path] = hija.name
    }
  }
  return mapa
}
const MAPA = mapaDeRutas()
// Rutas que se consideran permitidas junto con otra: «precios» vive dentro de «Necesidades».
const ALIAS = { necesidades: ['precios'] }

export const enlacesPermitidos = computed(() => recorrer(menuOrdenado.value))
export const rutasPermitidas = computed(() => {
  const nombres = enlacesPermitidos.value.map((enlace) => MAPA[enlace]).filter(Boolean)
  return new Set(nombres.flatMap((nombre) => [nombre, ...(ALIAS[nombre] ?? [])]))
})
/** Primera pantalla del menú de SRH, en su orden. */
export const rutaInicialMenu = computed(() => {
  const enlace = enlacesPermitidos.value.find((e) => MAPA[e])
  return enlace ? MAPA[enlace] : null
})

// ───────────── Arranque (equivale a `created` de MainLayout en educalle) ─────────────

let arranque = null

/**
 * Restablece o crea la sesión y consulta el menú. Idempotente: varias llamadas comparten el mismo arranque.
 */
export function iniciarSesionIntranet (route) {
  arranque ??= (async () => {
    alVencerSesion(() => limpiarSesion())
    if (existe('session-dialog-open')) {
      limpiarSesion()
      return
    }
    if (existe('idUsuario') && existe('session-token')) {
      usuario.value = leerUsuario()
      iniciarRevisionSesion()
    } else {
      limpiarSesion(false)
      if (!(await recibirParametros(route))) return
    }
    await obtenerOpcionesMenu()
    quitarParametroP()
  })().finally(() => { arranque = null })
  return arranque
}

export function useSesionIntranet () {
  return {
    usuario, menuOrdenado, menuCargado, enlacesPermitidos, rutasPermitidas, rutaInicialMenu,
    ocultarTituloModulo, obtenerDescripcionVisible, iniciarSesionIntranet, salir, limpiarSesion
  }
}
