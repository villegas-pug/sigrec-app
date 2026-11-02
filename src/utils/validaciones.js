// Reglas de validación reutilizables para los campos de QInput/QSelect (devuelven true o el mensaje de error).
import { FECHA_CORTE } from 'src/config/demo'

export const requerido = (v) => (v !== null && v !== undefined && v !== '') || 'Campo obligatorio'

export const mayorQueCero = (v) => (Number.isFinite(v) && v > 0) || 'Indique un valor mayor que cero'

export const minimo = (min) => (v) => (Number.isFinite(v) && v >= min) || `Mínimo ${min}`

// Acepta 'AAAA-MM-DD' o 'AAAA-MM': los hechos no pueden ser posteriores a la fecha de corte.
export const noFutura = (v) => !v || v <= FECHA_CORTE.slice(0, v.length) || 'No puede ser posterior a la fecha de corte'

// La llegada no puede ser anterior a la salida (`salida` es una función para leer el valor actual del formulario).
export const llegadaPosterior = (salida) => (v) => !v || !salida() || v >= salida() || 'La llegada no puede ser anterior a la salida'

// Un registro nuevo no puede repetir un identificador existente (`existe` recibe el valor normalizado).
export const unico = (existe, mensaje) => (v) => !existe(v) || mensaje
