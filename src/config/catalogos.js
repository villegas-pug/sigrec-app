// Catálogos de presentación. Los tonos corresponden a las clases .sg-chip--* de app.scss.

// Valor de filtro «sin restricción»: QSelect no muestra la etiqueta de una opción con valor null.
export const TODOS = 'todos'

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

// Condición del inmueble donde funciona el centro (dato de la ficha del centro).
export const CONDICIONES_INMUEBLE = {
  propio: { label: 'Propio', tono: 'ne' },
  alquilado: { label: 'Alquilado', tono: 'in' }
}

export const condicionInmueble = (clave) => CONDICIONES_INMUEBLE[clave] ?? { label: 'No informada', tono: 'si' }

export const OPCIONES_INMUEBLE = Object.entries(CONDICIONES_INMUEBLE).map(([value, c]) => ({ value, label: c.label }))

export const SITUACIONES = {
  activo: { label: 'Activo', tono: 'ok', icono: 'check_circle' },
  baja: { label: 'Dado de baja', tono: 'ne', icono: 'remove_circle' },
  anulado: { label: 'Anulado', tono: 'ne', icono: 'block' }
}

// Marca de un registro anulado (baja lógica) en listados con «Mostrar inactivos».
export const CHIP_ANULADO = { label: 'Anulado', tono: 'ne', icono: 'block' }

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
  asociacion: { label: 'Componente actualizado', tono: 'ne', icono: 'account_tree' },
  traslado: { label: 'Traslado', tono: 'in', icono: 'moving' },
  alta: { label: 'Alta', tono: 'in', icono: 'add_circle' }
}

// Hechos que pueden originar una necesidad antes del fin de la vida útil (RF-19).
export const INCIDENTES = ['dano', 'robo', 'incendio']

export const OPCIONES_INCIDENTE = INCIDENTES.map((value) => ({ value, label: TIPOS_EVENTO[value].label }))

// Tipos de novedad de un ambiente (infraestructura).
export const TIPOS_NOVEDAD = {
  dano: 'Daño',
  incendio: 'Incendio',
  humedad: 'Humedad o filtración',
  instalaciones: 'Instalaciones eléctricas o sanitarias',
  estructura: 'Estructura',
  otro: 'Otro'
}

export const OPCIONES_NOVEDAD = Object.entries(TIPOS_NOVEDAD).map(([value, label]) => ({ value, label }))

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

export const PERIODICIDADES = {
  mensual: 'Mensual',
  trimestral: 'Trimestral'
}

export const OPCIONES_PERIODICIDAD = Object.entries(PERIODICIDADES).map(([value, label]) => ({ value, label }))

export const ESTADOS_PERIODO = {
  pagado: { label: 'Pagado', tono: 'ok' },
  pendiente: { label: 'Pendiente', tono: 'da' },
  sin_info: { label: 'Sin información', tono: 'si' },
  por_venir: { label: 'Por venir', tono: 'ne' }
}

// Hechos de un servicio: suministro (interrupción y restablecimiento), pagos y correcciones de período.
export const HECHOS_SERVICIO = {
  interrupcion: { tono: 'wa', label: 'Interrupción informada' },
  restablecimiento: { tono: 'ok', label: 'Restablecimiento informado' },
  pago: { tono: 'in', label: 'Pago informado' },
  correccion: { tono: 'si', label: 'Corrección de período' }
}

export const EVALUACIONES_COMBUSTIBLE = {
  comparable: { label: 'Comparable', tono: 'ok' },
  solo_previsto: { label: 'Solo previsto', tono: 'ne' },
  no_comparable: { label: 'No comparable', tono: 'in' }
}
