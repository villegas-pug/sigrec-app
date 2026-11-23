// Reglas de validación reutilizables para los campos de QInput/QSelect (devuelven true o el mensaje de error).
import { hoy } from 'src/config/reglas'
import { fecha } from './formato'

// Texto de ayuda de los campos de fecha (SPEC 040): los hechos no pueden ser posteriores a hoy.
export const HINT_FECHA = 'No puede ser posterior a hoy'

export const requerido = (v) => (v !== null && v !== undefined && v !== '') || 'Campo obligatorio'

export const mayorQueCero = (v) => (Number.isFinite(v) && v > 0) || 'Indique un valor mayor que cero'

// Campo opcional: vacío es válido; si se informa debe ser mayor que cero.
export const opcionalMayorQueCero = (v) => v === null || v === undefined || v === '' || (Number.isFinite(v) && v > 0) || 'Indique un valor mayor que cero'

export const minimo =(min) => (v) => (Number.isFinite(v) && v >= min) || `Mínimo ${min}`

// Acepta 'AAAA-MM-DD' o 'AAAA-MM': los hechos no pueden ser posteriores a hoy.
export const noFutura = (v) => !v || v <= hoy().slice(0, v.length) || `No puede ser posterior a hoy (${fecha(hoy())})`

// El valor no puede ser anterior a otro del formulario (`referencia` es una función para leer el valor actual).
export const noAnteriorA = (referencia, mensaje) => (v) => !v || !referencia() || v >= referencia() || mensaje

export const llegadaPosterior = (salida) => noAnteriorA(salida, 'La llegada no puede ser anterior a la salida')

// Un registro nuevo no puede repetir un identificador existente (`existe` recibe el valor normalizado).
export const unico = (existe, mensaje) => (v) => !existe(v) || mensaje
