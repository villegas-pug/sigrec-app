// SPEC 033: accesos a los datos de centros que tienen colección propia en el modelo ER.
// Devuelven la misma forma y el mismo orden que cuando estaban anidados en su registro padre, para que la interfaz no cambie.
import { db, ambientePorId } from './datos'

// ---------- Hechos y novedades (SGR_INCIDENTE) ----------

const esNovedad = (evento) => evento.clase === 'novedad'

// SPEC 034: las verificaciones de la carga inicial solo se consultan desde verificacionDe.
export const eventosRegistrados = () => db.eventos.filter((e) => !esNovedad(e) && e.cargaInicial !== true)

// Novedades de un ambiente en orden de registro.
export const novedadesDe = (ambienteId) => db.eventos.filter((e) => esNovedad(e) && e.ambienteId === ambienteId)

export const novedadPorId = (id) => db.eventos.find((e) => esNovedad(e) && e.id === id) ?? null

// ---------- Intervenciones (SGR_INTERVENCION) ----------

// Del más reciente registrado al más antiguo, como el antiguo `ambiente.intervenciones`.
export const intervencionesDe = (ambienteId) => db.intervenciones.filter((i) => i.ambienteId === ambienteId)

// ---------- Fotografías (SGR_FOTO) ----------

// Arco exclusivo: una foto es de un centro, de un ambiente o de un bien. La galería del centro incluye las de sus ambientes.
export const centroDeFoto = (foto) => foto.carId ?? ambientePorId(foto.ambienteId)?.carId ?? null

export const fotosDe = ({ carId = null, bienId = null } = {}) =>
  bienId ? db.fotos.filter((f) => f.bienId === bienId) : db.fotos.filter((f) => !f.bienId && centroDeFoto(f) === carId)

// ---------- Elementos evaluados (SGR_ELEMENTO) ----------

const CLAVE_OBJETIVO = { centro: 'carId', modulo: 'moduloId', ambiente: 'ambienteId' }
const filasDe = (tipo, id) => db.elementos.filter((e) => e[CLAVE_OBJETIVO[tipo]] === id)

// `{ clave: condición }` de los elementos evaluados; null si no hay ninguno (no informado).
export function estadoElementosDe (tipo, id) {
  const evaluados = filasDe(tipo, id).filter((e) => e.condicion)
  return evaluados.length ? Object.fromEntries(evaluados.map((e) => [e.clave, e.condicion])) : null
}

// Elementos agregados al registro, en el orden en que se agregaron: `[{ key, label }]`.
export const elementosAdicionalesDe = (tipo, id) =>
  filasDe(tipo, id).filter((e) => e.nombre).map((e) => ({ key: e.clave, label: e.nombre, icono: e.icono || 'category' }))
