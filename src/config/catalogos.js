// Catálogos de presentación. Los tonos corresponden a las clases .sg-chip--* de app.scss.

export const CONDICIONES = {
  bueno: { label: 'Bueno', tono: 'ok' },
  regular: { label: 'Regular', tono: 'wa' },
  malo: { label: 'Malo', tono: 'da' },
  inservible: { label: 'Inservible', tono: 'da' }
}

export const CONDICION_DESCONOCIDA = { label: 'No constatable', tono: 'si' }

export function condicion (clave) {
  return CONDICIONES[clave] ?? CONDICION_DESCONOCIDA
}

export const OPCIONES_CONDICION = Object.entries(CONDICIONES).map(([value, c]) => ({ value, label: c.label }))

export const SITUACIONES = {
  activo: { label: 'Activo', tono: 'ok', icono: 'check_circle' },
  baja: { label: 'Dado de baja', tono: 'ne', icono: 'remove_circle' }
}

export const CATEGORIAS = {
  mobiliario: 'Mobiliario',
  equipo: 'Equipo',
  fungible: 'Fungible'
}

export const OPCIONES_CATEGORIA = Object.entries(CATEGORIAS).map(([value, label]) => ({ value, label }))

export const TIPOS_EVENTO = {
  dano: { label: 'Daño', tono: 'da', icono: 'build' },
  robo: { label: 'Robo', tono: 'da', icono: 'report' },
  incendio: { label: 'Incendio', tono: 'da', icono: 'local_fire_department' },
  baja: { label: 'Baja', tono: 'ne', icono: 'remove_circle' },
  reposicion: { label: 'Reposición', tono: 'in', icono: 'swap_horiz' },
  verificacion: { label: 'Verificación física', tono: 'ok', icono: 'fact_check' },
  condicion: { label: 'Condición actualizada', tono: 'wa', icono: 'update' },
  alta: { label: 'Alta', tono: 'in', icono: 'add_circle' }
}

// Hechos que pueden originar una necesidad antes del fin de la vida útil (RF-19).
export const INCIDENTES = ['dano', 'robo', 'incendio']

export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre']
export const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic']
export const ORDINALES_TRIMESTRE = ['1.er', '2.º', '3.er', '4.º']

export const TIPOS_SERVICIO = {
  luz: 'Luz',
  agua: 'Agua',
  internet: 'Internet',
  cable: 'Cable',
  gas: 'Gas',
  arbitrios: 'Arbitrios'
}

export const ESTADOS_PERIODO = {
  pagado: { label: 'Pagado', tono: 'ok' },
  pendiente: { label: 'Pendiente', tono: 'da' },
  sin_info: { label: 'Sin información', tono: 'si' },
  por_venir: { label: 'Por venir', tono: 'ne' }
}

export const EVALUACIONES_COMBUSTIBLE = {
  comparable: { label: 'Comparable', tono: 'ok' },
  solo_previsto: { label: 'Solo previsto', tono: 'ne' },
  no_comparable: { label: 'No comparable', tono: 'in' }
}
