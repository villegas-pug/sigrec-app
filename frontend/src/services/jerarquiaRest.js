import { api } from './api'
import { db } from './datos'

const recursos = {
  centro: { ruta: 'centros', lista: 'cars', campo: 'carId' },
  modulo: { ruta: 'modulos', lista: 'modulos', campo: 'moduloId' },
  ambiente: { ruta: 'ambientes', lista: 'ambientes', campo: 'ambienteId' }
}

export async function cargarJerarquia () {
  const datos = await api('/centros/jerarquia')
  for (const [coleccion, registros] of Object.entries(datos)) {
    db[coleccion].splice(0, db[coleccion].length, ...registros)
  }
}

export async function guardarJerarquia (tipo, datos, codigo) {
  const { ruta, lista, campo } = recursos[tipo]
  const path = `/${ruta}${codigo ? `/${encodeURIComponent(codigo)}` : ''}`
  const { registro, elementos } = await api(path, { method: codigo ? 'PUT' : 'POST', body: datos })
  const guardado = db[lista].find((item) => item.id === registro.id)
  if (guardado) Object.assign(guardado, registro)
  else db[lista].push(registro)
  const previos = db.elementos.filter((item) => item[campo] !== registro.id)
  db.elementos.splice(0, db.elementos.length, ...previos, ...elementos)
  return guardado ?? registro
}

export function cambiarEstadoJerarquia (registro, motivo) {
  const recurso = Object.values(recursos).find(({ lista }) => db[lista].includes(registro))
  if (!recurso) return null
  const operacion = motivo == null ? 'reactivar' : 'anular'
  return api(`/${recurso.ruta}/${encodeURIComponent(registro.id)}/${operacion}`, {
    method: 'POST',
    body: motivo == null ? undefined : { motivo }
  }).then((actualizado) => Object.assign(registro, actualizado))
}
