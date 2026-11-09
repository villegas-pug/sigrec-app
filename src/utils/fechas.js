// Aritmética de fechas ISO ('AAAA-MM-DD'). Se calcula en UTC para no depender de la zona horaria del equipo.
const aUtc = (iso) => {
  const [anio, mes, dia] = iso.split('-').map(Number)
  return Date.UTC(anio, mes - 1, dia ?? 1)
}

const MS_POR_DIA = 24 * 60 * 60 * 1000

// Días de `desde` a `hasta` (negativo si `hasta` es anterior).
export const diasEntre = (desde, hasta) => Math.round((aUtc(hasta) - aUtc(desde)) / MS_POR_DIA)

// Fecha ISO resultante de retroceder `meses` meses; el día se acota al último día del mes resultante.
export function restarMeses (iso, meses) {
  const [anio, mes, dia] = iso.split('-').map(Number)
  const total = anio * 12 + (mes - 1) - meses
  const anioNuevo = Math.floor(total / 12)
  const mesNuevo = total % 12
  const ultimoDia = new Date(Date.UTC(anioNuevo, mesNuevo + 1, 0)).getUTCDate()
  const pad = (n) => String(n).padStart(2, '0')
  return `${anioNuevo}-${pad(mesNuevo + 1)}-${pad(Math.min(dia, ultimoDia))}`
}

// Meses completos entre dos fechas 'AAAA', 'AAAA-MM' o 'AAAA-MM-DD' (un año sin mes cuenta desde enero).
export function mesesEntre (desde, hasta) {
  const [a1, m1 = 1] = desde.split('-').map(Number)
  const [a2, m2 = 1] = hasta.split('-').map(Number)
  return (a2 - a1) * 12 + (m2 - m1)
}
