import { api } from './api'
import { db } from './datos'
import { camposPrecio, listarPrecios } from './preciosRest'

const ruta = '/catalogos/tipos-bien'

export async function cargarTiposBien ({ incluirPrecios }) {
  const [tipos, precios] = await Promise.all([api(ruta), incluirPrecios ? listarPrecios() : []])
  aplicarTiposBien(tipos, precios)
}

export function aplicarTiposBien (tipos, precios = []) {
  const porTipo = new Map(precios.map((precio) => [precio.tipoId, precio]))
  const valores = new Map(db.tiposBien.map((tipo) => [tipo.id, tipo]))
  const registros = tipos.map((tipo) => Object.assign(valores.get(tipo.id) ?? {}, tipo, camposPrecio(porTipo.get(tipo.id))))
  db.tiposBien.splice(0, db.tiposBien.length, ...registros)
}

export async function escribirTipoBien (id, body, { operacion, method = 'POST' } = {}) {
  const destino = ruta + (id ? '/' + encodeURIComponent(id) : '') + (operacion ? '/' + operacion : '')
  const actualizado = await api(destino, { body, method })
  const actual = db.tiposBien.find((tipo) => tipo.id === actualizado.id)
  if (actual) return Object.assign(actual, actualizado)
  db.tiposBien.push({ ...actualizado, ...camposPrecio() })
  return actualizado
}
