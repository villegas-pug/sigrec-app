// Reglas de validación reutilizables para los campos de QInput/QSelect (devuelven true o el mensaje de error).
import { FECHA_CORTE } from 'src/config/demo'
import { fecha } from './formato'

// Texto de ayuda de los campos de fecha: la demostración trabaja con una fecha de corte fija (SPEC 001 §3).
export const HINT_FECHA_CORTE = `Fecha de corte de la demostración: ${fecha(FECHA_CORTE)}`

export const requerido = (v) => (v !== null && v !== undefined && v !== '') || 'Campo obligatorio'

export const mayorQueCero = (v) => (Number.isFinite(v) && v > 0) || 'Indique un valor mayor que cero'

export const minimo = (min) => (v) => (Number.isFinite(v) && v >= min) || `Mínimo ${min}`

// Acepta 'AAAA-MM-DD' o 'AAAA-MM': los hechos no pueden ser posteriores a la fecha de corte.
export const noFutura = (v) => !v || v <= FECHA_CORTE.slice(0, v.length) || `No puede ser posterior a la fecha de corte (${fecha(FECHA_CORTE)})`

// La llegada no puede ser anterior a la salida (`salida` es una función para leer el valor actual del formulario).
// `referencia` es una función para leer el valor actual del formulario.
export const noAnteriorA = (referencia, mensaje) => (v) => !v || !referencia() || v >= referencia() || mensaje

export const llegadaPosterior = (salida) => noAnteriorA(salida, 'La llegada no puede ser anterior a la salida')

// Un registro nuevo no puede repetir un identificador existente (`existe` recibe el valor normalizado).
export const unico = (existe, mensaje) => (v) => !existe(v) || mensaje
