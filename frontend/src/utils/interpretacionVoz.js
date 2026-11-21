// Interpretación del texto dictado (SPEC 007). Funciones puras: reciben el texto y devuelven el valor o null.
import { FECHA_CORTE } from 'src/config/demo'

const quitarTildes = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
export const normalizar = (t) => quitarTildes(String(t ?? '').toLowerCase()).replace(/[^a-z0-9ñ\s:/.,-]/g, ' ').replace(/\s+/g, ' ').trim()

const UNIDADES = {
  cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12,
  trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, veintiun: 21, veintiuno: 21,
  veintiuna: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29
}
const DECENAS = { treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90 }
const CENTENAS = {
  cien: 100, ciento: 100, doscientos: 200, doscientas: 200, trescientos: 300, trescientas: 300, cuatrocientos: 400, cuatrocientas: 400,
  quinientos: 500, quinientas: 500, seiscientos: 600, seiscientas: 600, setecientos: 700, setecientas: 700, ochocientos: 800, ochocientas: 800,
  novecientos: 900, novecientas: 900
}

// Convierte una secuencia de palabras numéricas (sin decimales) en entero; null si hay palabras no numéricas.
function palabrasAEntero (palabras) {
  let total = 0
  let actual = 0
  let hubo = false
  for (const p of palabras) {
    if (p === 'y' || p === 'de') continue
    if (p in UNIDADES) actual += UNIDADES[p]
    else if (p in DECENAS) actual += DECENAS[p]
    else if (p in CENTENAS) actual += CENTENAS[p]
    else if (p === 'mil') { total += (actual || 1) * 1000; actual = 0 } else if (p === 'millon' || p === 'millones') { total += (actual || 1) * 1000000; actual = 0 } else return null
    hubo = true
  }
  return hubo ? total + actual : null
}

// Dígitos sueltos dictados («cero nueve nueve…») → cadena de dígitos.
function digitosDictados (texto) {
  return normalizar(texto).split(' ').map((p) => (/^\d+$/.test(p) ? p : p in UNIDADES && UNIDADES[p] < 10 ? String(UNIDADES[p]) : p === 'y' ? '' : null))
}

export function aNumero (texto) {
  const t = normalizar(texto).replace(/s\/\.?|soles?/g, ' ').replace(/\s+/g, ' ').trim()
  if (!t) return null
  const cifras = t.replace(/(\d)\s+(?=\d{3}\b)/g, '$1').replace(',', '.')
  if (/^-?\d+(\.\d+)?$/.test(cifras)) return Number(cifras)
  const signo = /^(menos|negativo)\s/.test(t) ? -1 : 1
  const limpio = t.replace(/^(menos|negativo)\s/, '')
  const m = limpio.match(/^(.*?)\s(?:coma|punto|con)\s(.*)$/)
  const parteEntera = m ? m[1] : limpio
  const entera = /^\d+$/.test(parteEntera) ? Number(parteEntera) : palabrasAEntero(parteEntera.split(' '))
  if (entera == null) return null
  if (!m) return signo * entera
  const dec = m[2]
  let decimal
  if (/^\d+$/.test(dec)) decimal = dec
  else {
    const ds = digitosDictados(dec)
    if (ds.every((d) => d !== null)) decimal = ds.join('')
    else {
      const n = palabrasAEntero(dec.split(' '))
      if (n == null) return null
      decimal = String(n)
    }
  }
  return signo * Number(`${entera}.${decimal}`)
}

export function aAnio (texto) {
  const n = aNumero(texto)
  return n != null && Number.isInteger(n) && n >= 1900 && n <= 2100 ? String(n) : null
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre']
const indiceMes = (p) => {
  const i = MESES.indexOf(p === 'septiembre' ? 'setiembre' : p)
  return i < 0 ? null : i + 1
}
const dos = (n) => String(n).padStart(2, '0')

export function aMes (texto, referencia = FECHA_CORTE) {
  const t = normalizar(texto)
  const mes = MESES.concat(['septiembre']).find((m) => t.includes(m))
  if (!mes) {
    const iso = t.match(/^(\d{4})-(\d{1,2})$/)
    return iso ? `${iso[1]}-${dos(iso[2])}` : null
  }
  const resto = t.slice(t.indexOf(mes) + mes.length).replace(/^\s*(del?|,)\s*/, '').trim()
  const anio = resto ? aAnio(resto) : referencia.slice(0, 4)
  return anio ? `${anio}-${dos(indiceMes(mes))}` : null
}

function sumarDias (iso, dias) {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + dias)
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`
}

export function aFecha (texto, referencia = FECHA_CORTE) {
  const t = normalizar(texto)
  if (/\banteayer\b/.test(t)) return sumarDias(referencia, -2)
  if (/\bayer\b/.test(t)) return sumarDias(referencia, -1)
  if (/\bhoy\b/.test(t)) return referencia
  const num = t.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/)
  if (num) return validar(num[3], num[2], num[1])
  const iso = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (iso) return validar(iso[1], iso[2], iso[3])
  const mes = MESES.concat(['septiembre']).find((m) => t.includes(m))
  if (!mes) return null
  const antes = t.slice(0, t.indexOf(mes)).replace(/\b(el|dia)\b/g, '').replace(/\bde\s*$/, '').trim()
  const dia = aNumero(antes)
  const despues = t.slice(t.indexOf(mes) + mes.length).replace(/^\s*(del?|,)\s*/, '').trim()
  const anio = despues ? aAnio(despues) : referencia.slice(0, 4)
  return dia != null && anio ? validar(anio, indiceMes(mes), dia) : null
}

function validar (a, m, d) {
  const anio = Number(a)
  const mes = Number(m)
  const dia = Number(d)
  const f = new Date(anio, mes - 1, dia)
  return f.getFullYear() === anio && f.getMonth() === mes - 1 && f.getDate() === dia ? `${anio}-${dos(mes)}-${dos(dia)}` : null
}

export function aHora (texto) {
  const t = normalizar(texto).replace(/^(a las|a la|las|la|son)\s/, '').replace(/\s+/g, ' ').trim()
  if (/\bmediodia\b/.test(t)) return '12:00'
  if (/\bmedianoche\b/.test(t)) return '00:00'
  const franja = /de la (tarde|noche)|\bp\.?\s?m\b/.test(t) ? 'pm' : /de la manana|\ba\.?\s?m\b/.test(t) ? 'am' : null
  const base = t.replace(/\b(de la (tarde|noche|manana)|de la madrugada|horas|hrs?|p\.?\s?m\.?|a\.?\s?m\.?)\b/g, ' ').replace(/\s+/g, ' ').trim()
  let h = null
  let min = 0
  const reloj = base.match(/^(\d{1,2})[:.](\d{2})$/)
  if (reloj) { h = Number(reloj[1]); min = Number(reloj[2]) } else {
    const menos = base.match(/^(.*?)\smenos\s(.*)$/)
    const y = base.match(/^(.*?)\sy\s(.*)$/)
    const cantidad = (s) => (s === 'cuarto' ? 15 : s === 'media' ? 30 : aNumero(s))
    if (menos) {
      const hh = aNumero(menos[1])
      const mm = cantidad(menos[2])
      if (hh == null || mm == null) return null
      h = hh - 1
      min = 60 - mm
    } else if (y) {
      h = aNumero(y[1])
      min = cantidad(y[2])
    } else h = aNumero(base)
  }
  if (h == null || min == null || !Number.isInteger(h) || min < 0 || min > 59) return null
  if (franja === 'pm' && h < 12) h += 12
  if (franja === 'am' && h === 12) h = 0
  if (h < 0 || h > 23) return null
  return `${dos(h)}:${dos(min)}`
}

export function aTelefono (texto) {
  const t = normalizar(texto)
  const palabras = digitosDictados(t)
  const dig = palabras.every((p) => p !== null) ? palabras.join('') : t.replace(/\D/g, '')
  return dig.length >= 6 ? dig : null
}

export function aCodigo (texto) {
  const partes = normalizar(texto).split(' ').map((p) => {
    if (p === 'guion' || p === 'menos') return '-'
    if (p === 'espacio') return ' '
    if (p in UNIDADES && UNIDADES[p] < 10) return String(UNIDADES[p])
    return p
  })
  const c = partes.join('').toUpperCase()
  return c || null
}

// Elige la opción que mejor coincide con lo dictado. Devuelve el valor de la opción (o null si no hay una clara).
export function elegirOpcion (texto, opciones, { etiqueta = (o) => o?.label ?? o, valor = (o) => o?.value ?? o } = {}) {
  const t = normalizar(texto)
  if (!t || !opciones?.length) return null
  const lista = opciones.map((o) => ({ o, e: normalizar(etiqueta(o)) }))
  const un = (f) => {
    const r = lista.filter(f)
    return r.length === 1 ? valor(r[0].o) : undefined
  }
  const exacta = lista.find((x) => x.e === t)
  if (exacta) return valor(exacta.o)
  const n = aNumero(t)
  if (n != null) {
    const num = lista.find((x) => Number(x.e) === n)
    if (num) return valor(num.o)
  }
  for (const f of [(x) => x.e.startsWith(t), (x) => x.e.includes(t), (x) => t.includes(x.e)]) {
    const r = un(f)
    if (r !== undefined) return r
  }
  // Solapamiento de palabras (≥ 2 letras): gana la opción con más palabras en común, si es única.
  const pt = new Set(t.split(' ').filter((p) => p.length > 2))
  const puntaje = lista.map((x) => ({ x, p: x.e.split(' ').filter((p) => pt.has(p)).length }))
  const max = Math.max(...puntaje.map((s) => s.p))
  const mejores = puntaje.filter((s) => s.p === max)
  return max > 0 && mejores.length === 1 ? valor(mejores[0].x.o) : null
}

// Añade el texto dictado al final del existente, con un espacio y mayúscula inicial si empieza una oración.
export function unirDictado (actual, dictado) {
  const previo = actual ?? ''
  let texto = (dictado ?? '').trim()
  if (!texto) return previo
  const recorte = previo.trimEnd()
  if (!recorte || /[.!?]$/.test(recorte)) texto = texto.charAt(0).toLocaleUpperCase('es-PE') + texto.slice(1)
  return recorte ? `${recorte} ${texto}` : texto
}

// Condición dicha en masculino o femenino, singular o plural.
const CONDICION_DICHA = [[/\binservibles?\b/, 'inservible'], [/\bmal[oa]s?\b/, 'malo'], [/\bregular(es)?\b/, 'regular'], [/\bbuen[oa]s?\b/, 'bueno']]

/**
 * Registro rápido de un bien en una sola frase (SPEC 011, Ola 3), dictada o escrita. Ejemplo:
 * «silla de plástico, buena, cuatro unidades, del 2019» → { tipoId, condicion: 'bueno', cantidad: 4, fechaAdquisicion: '2019' }.
 * - `tipos`: [{ value, label }] de los tipos de bien vigentes; el tipo se elige con lo que queda tras quitar los demás datos.
 * - La adquisición acepta año («del 2019», «año dos mil diecinueve») o mes y año («de marzo de 2019»).
 * - Lo que no se entiende queda en null: nunca se inventa un valor. Devuelve también `texto` (lo interpretado).
 */
export function interpretarRegistro (texto, { tipos = [] } = {}) {
  let resto = ` ${normalizar(texto).replace(/,/g, ' , ')} `
  const quitar = (fragmento) => { resto = resto.replace(fragmento, ' , ') }

  let condicion = null
  for (const [patron, valor] of CONDICION_DICHA) {
    const m = resto.match(patron)
    if (m) {
      condicion = valor
      quitar(m[0])
      break
    }
  }

  let cantidad = null
  const mc = resto.match(/(?:cantidad\s+)?((?:[a-z0-9]+\s+y\s+)?[a-z0-9]+)\s+unidad(?:es)?\b/) ?? resto.match(/cantidad\s+((?:[a-z0-9]+\s+y\s+)?[a-z0-9]+)/)
  if (mc) {
    const n = aNumero(mc[1])
    if (n != null && Number.isInteger(n) && n > 0) {
      cantidad = n
      quitar(mc[0])
    }
  }

  let fechaAdquisicion = null
  const mf = resto.match(/(?:\bdel?\b|\bano\b|adquirid[oa]s?\s+en|comprad[oa]s?\s+en|\ben\b)\s+((?:[a-z]+\s+(?:de(?:l)?\s+)?)?(?:\d{4}|dos mil(?:\s+[a-z]+)*|mil novecientos(?:\s+[a-z]+)*))/)
  if (mf) {
    const fragmento = mf[1].trim()
    fechaAdquisicion = aMes(fragmento) ?? aAnio(fragmento.replace(/^[a-z]+\s+(?:del?\s+)?(?=\d|dos|mil)/, '')) ?? aAnio(fragmento)
    if (fechaAdquisicion) quitar(mf[0])
  }

  const nombre = resto.replace(/\s*,\s*/g, ' ').replace(/\s+/g, ' ').trim()
  const tipoId = nombre ? elegirOpcion(nombre, tipos) : null
  return { tipoId, condicion, cantidad, fechaAdquisicion, texto: normalizar(texto) }
}
