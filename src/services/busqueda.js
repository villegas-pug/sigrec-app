// Buscador global (SPEC 011, Ola 3): un índice de centros, módulos (SPEC 020), ambientes, bienes, vehículos, servicios y tipos de bien del ámbito,
// con su destino (enlace profundo). Funciones puras: el ámbito y los accesos los decide quien llama.
import { db, moduloPorId, vigente } from './datos'
import { celdasDelServicio } from './servicios'
import { normalizar } from 'src/utils/interpretacionVoz'
import { CONDICIONES, SITUACIONES, TIPOS_SERVICIO } from 'src/config/catalogos'

/**
 * Entradas del índice. `cars` y `vehiculos` ya vienen filtrados por el ámbito del perfil.
 * Cada entrada: { clave, tipo, id, titulo, detalle, icono, destino: { name, query }, acciones, texto }.
 * `acciones`: atajos de la entrada [{ label, icono, permiso, destino }]; quien llama muestra solo los que el perfil puede hacer.
 * `fechaCorte` y `anioServicios` permiten llevar «Informar pago» al primer período por informar del servicio.
 */
export function indiceDeBusqueda ({ cars, vehiculos, fechaCorte = null, anioServicios = null }) {
  const entradas = []
  const agregar = (e) => entradas.push({ ...e, texto: normalizar(`${e.id} ${e.titulo} ${e.detalle ?? ''}`) })
  const carIds = new Set(cars.map((c) => c.id))

  for (const car of cars) {
    agregar({
      clave: `car-${car.id}`, tipo: 'centro', id: car.id, titulo: car.nombre, detalle: car.inmueble?.direccion ?? 'Centro', icono: 'home_work', destino: { name: 'centros', query: { car: car.id } },
      acciones: [{ label: `Registrar mantenimiento en ${car.nombre}`, icono: 'build', permiso: 'mantenimiento.registrar', destino: { name: 'centros', query: { car: car.id, tab: 'seguridad' } } }]
    })
  }
  const nombreCar = (id) => cars.find((c) => c.id === id)?.nombre ?? id
  for (const m of db.modulos.filter((m) => vigente(m) && carIds.has(m.carId))) {
    agregar({ clave: `mod-${m.id}`, tipo: 'modulo', id: m.id, titulo: m.nombre, detalle: `${nombreCar(m.carId)}${m.tipo === 'comun' ? ' · Uso común' : ''}`, icono: m.tipo === 'comun' ? 'groups' : 'cottage', destino: { name: 'centros', query: { modulo: m.id } } })
  }
  const ambientes = db.ambientes.filter((a) => vigente(a) && carIds.has(a.carId))
  // «Centro › Módulo»: ruta del ambiente para el detalle de ambientes y bienes.
  const rutaAmbiente = (a) => [nombreCar(a.carId), moduloPorId(a.moduloId)?.nombre].filter(Boolean).join(' › ')
  for (const a of ambientes) {
    agregar({ clave: `amb-${a.id}`, tipo: 'ambiente', id: a.id, titulo: a.nombre, detalle: rutaAmbiente(a), icono: 'meeting_room', destino: { name: 'centros', query: { ambiente: a.id } },
      acciones: [{ label: `Registrar bien en ${a.nombre} (${nombreCar(a.carId)})`, icono: 'playlist_add', permiso: 'bien.registrar', destino: { name: 'centros', query: { ambiente: a.id, registrar: '1' } } }] })
  }
  const ambientePorId = new Map(ambientes.map((a) => [a.id, a]))
  for (const b of db.bienes) {
    const a = ambientePorId.get(b.ambienteId)
    if (!a || b.situacion === 'anulado') continue
    const estado = b.situacion === 'activo' ? CONDICIONES[b.condicion]?.label ?? 'Sin condición' : SITUACIONES[b.situacion]?.label ?? b.situacion
    agregar({ clave: `bien-${b.id}`, tipo: 'bien', id: b.id, titulo: b.nombre, detalle: `${rutaAmbiente(a)} › ${a.nombre} · ${estado}${b.codigoPatrimonial ? ` · ${b.codigoPatrimonial}` : ''}`, icono: b.asociadoA ? 'extension' : 'label', destino: { name: 'centros', query: { bien: b.id } } })
  }
  for (const v of vehiculos) {
    agregar({ clave: `veh-${v.id}`, tipo: 'vehiculo', id: v.id, titulo: `${v.tipo} · placa ${v.placa}`, detalle: nombreCar(v.carId), icono: 'directions_car', destino: { name: 'vehiculos', query: { car: v.carId, vehiculo: v.id } },
      acciones: [{ label: `Registrar itinerario de ${v.id} (${nombreCar(v.carId)})`, icono: 'add_road', permiso: 'itinerario.registrar', destino: { name: 'itinerarios', query: { vehiculo: v.id } } }] })
  }
  for (const s of db.servicios.filter((s) => vigente(s) && carIds.has(s.carId))) {
    // «Informar pago» lleva al primer período por informar (pendiente o sin información); si no hay, a la ficha del servicio.
    const celda = fechaCorte && anioServicios ? celdasDelServicio(s, anioServicios, fechaCorte).find((c) => c.estado === 'pendiente' || c.estado === 'sin_info') : null
    const servicio = { car: s.carId, servicio: s.id }
    agregar({ clave: `srv-${s.id}`, tipo: 'servicio', id: s.id, titulo: `${TIPOS_SERVICIO[s.tipo] ?? s.tipo} · ${s.proveedor ?? ''}`, detalle: `${nombreCar(s.carId)} · suministro ${s.suministro ?? 'no informado'}`, icono: 'receipt_long', destino: { name: 'servicios', query: servicio },
      acciones: [{ label: `Informar pago de ${TIPOS_SERVICIO[s.tipo] ?? s.tipo} (${nombreCar(s.carId)})`, icono: 'payments', permiso: 'servicio.periodo', destino: { name: 'servicios', query: celda ? { ...servicio, anio: anioServicios, periodo: celda.numero } : servicio } }] })
  }
  for (const t of db.tiposBien.filter(vigente)) {
    agregar({ clave: `tipo-${t.id}`, tipo: 'tipo', id: t.id, titulo: t.nombre, detalle: 'Tipo de bien · consulta por centro', icono: 'travel_explore', destino: { name: 'inventario', query: { tipo: t.id } } })
  }
  return entradas
}

/**
 * Resultados ordenados por relevancia: rótulo exacto, rótulo que empieza igual, título que empieza igual y luego coincidencia de
 * todas las palabras. Sin consulta no devuelve nada.
 */
export function buscar (indice, consulta, limite = 12) {
  const q = normalizar(consulta)
  if (!q) return []
  const palabras = q.split(' ')
  const puntaje = (e) => {
    const id = normalizar(e.id)
    if (id === q) return 0
    if (id.startsWith(q)) return 1
    if (normalizar(e.titulo).startsWith(q)) return 2
    return palabras.every((p) => e.texto.includes(p)) ? 3 : null
  }
  return indice
    .map((e) => ({ e, p: puntaje(e) }))
    .filter((r) => r.p != null)
    .sort((a, b) => a.p - b.p || a.e.titulo.localeCompare(b.e.titulo, 'es'))
    .slice(0, limite)
    .map((r) => r.e)
}

/**
 * Rótulo leído de un código (QR o de barras). Acepta el rótulo tal cual o un enlace de SIGREC con `?bien=`.
 * Devuelve el texto en mayúsculas y sin espacios, o null si está vacío.
 */
export function rotuloDesdeCodigo (texto) {
  const crudo = String(texto ?? '').trim()
  if (!crudo) return null
  const enlace = crudo.match(/[?&]bien=([^&#]+)/)
  return decodeURIComponent(enlace ? enlace[1] : crudo).trim().toUpperCase().replace(/\s+/g, '')
}
