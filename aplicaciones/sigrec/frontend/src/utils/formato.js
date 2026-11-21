// Formatos de presentación: miles separados por espacio y coma decimal (S/ 1 300; 1,5 L).
import { MESES } from 'src/config/catalogos'

// Identificador legible a partir de un texto: sin tildes, en minúsculas y con guiones («Tanque elevado» → «tanque-elevado»).
export const identificador = (texto) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const agrupar = (entero) => entero.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

export function numero (valor, decimales = 0) {
  if (valor == null || Number.isNaN(valor)) return '—'
  const [entero, decimal] = Math.abs(valor).toFixed(decimales).split('.')
  const signo = valor < 0 && Number(Math.abs(valor).toFixed(decimales)) !== 0 ? '−' : ''
  const fraccion = decimal && Number(decimal) !== 0 ? ',' + decimal.replace(/0+$/, '') : ''
  return signo + agrupar(entero) + fraccion
}

export const soles = (valor) => (valor == null ? '—' : `S/ ${numero(valor, 2)}`)

export const litros = (valor) => (valor == null ? '—' : `${numero(valor, 2)} L`)

// Acepta 'AAAA', 'AAAA-MM' o 'AAAA-MM-DD'.
export function fecha (iso) {
  if (!iso) return '—'
  const [anio, mes, dia] = iso.split('-')
  if (!mes) return anio
  if (!dia) return `${MESES[Number(mes) - 1]} ${anio}`
  return `${dia}/${mes}/${anio}`
}

export const porcentaje = (parte, total) => (total ? Math.round((parte / total) * 100) : 0)

export const plural = (cantidad, singular, varios) => `${cantidad} ${cantidad === 1 ? singular : varios}`
