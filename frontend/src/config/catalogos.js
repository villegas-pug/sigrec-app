import { reactive } from 'vue'

// Catálogos de presentación. Los tonos corresponden a las clases .sg-chip--* de app.scss.

// Valor de filtro «sin restricción»: QSelect no muestra la etiqueta de una opción con valor null.
export const TODOS = 'todos'

export const CONDICIONES = reactive({
  bueno: { label: 'Bueno', tono: 'ok' },
  regular: { label: 'Regular', tono: 'wa' },
  malo: { label: 'Malo', tono: 'da' },
  inservible: { label: 'Inservible', tono: 'da' }
})

export const CONDICION_DESCONOCIDA = { label: 'No constatable', tono: 'si' }

export function condicion (clave) {
  return CONDICIONES[clave] ?? CONDICION_DESCONOCIDA
}

export const OPCIONES_CONDICION = reactive([])

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

export const CATEGORIAS = reactive({
  mobiliario: 'Mobiliario',
  equipo: 'Equipo',
  fungible: 'Fungible'
})

export const OPCIONES_CATEGORIA = reactive([])

// Tipos de novedad de un ambiente (infraestructura).
export const TIPOS_NOVEDAD = reactive({
  dano: 'Daño',
  incendio: 'Incendio',
  humedad: 'Humedad o filtración',
  instalaciones: 'Instalaciones eléctricas o sanitarias',
  estructura: 'Estructura',
  otro: 'Otro'
})

export const OPCIONES_NOVEDAD = reactive([])

export const TIPOS_EVENTO = reactive({
  ...Object.fromEntries(Object.entries(TIPOS_NOVEDAD).filter(([key]) => !['dano', 'incendio'].includes(key)).map(([key, label]) => [key, { label, tono: 'wa', icono: 'construction' }])),
  dano: { label: 'Daño', tono: 'da', icono: 'build' },
  robo: { label: 'Robo', tono: 'da', icono: 'report' },
  incendio: { label: 'Incendio', tono: 'da', icono: 'local_fire_department' },
  baja: { label: 'Baja', tono: 'ne', icono: 'remove_circle' },
  reposicion: { label: 'Reposición', tono: 'in', icono: 'swap_horiz' },
  verificacion: { label: 'Verificación física', tono: 'ok', icono: 'fact_check' },
  condicion: { label: 'Condición actualizada', tono: 'wa', icono: 'update' },
  asociacion: { label: 'Componente actualizado', tono: 'ne', icono: 'account_tree' },
  traslado: { label: 'Traslado', tono: 'in', icono: 'moving' },
  alta: { label: 'Alta', tono: 'in', icono: 'add_circle' },
  mantenimiento: { label: 'Mantenimiento', tono: 'in', icono: 'build' }
})

// Hechos que pueden originar una necesidad antes del fin de la vida útil (RF-19).
export const INCIDENTES = ['dano', 'robo', 'incendio']

export const OPCIONES_INCIDENTE = reactive([])

// Tipos de hecho del historial (incidentes, novedades, baja y reposición); se rearma con los catálogos del backend.
export const TIPOS_HECHO = reactive([])

export const OPCIONES_INCIDENCIA_INFRAESTRUCTURA = reactive([])

// Tipos de módulo del centro (SPEC 020): una casa alberga a un grupo; uno de uso común lo comparten todas las casas.
export const TIPOS_MODULO = {
  casa: { label: 'Casa', descripcion: 'Vive un grupo de residentes' },
  comun: { label: 'Uso común', descripcion: 'Lo comparten las casas: comedor, cocina, lavandería, administración' }
}
export const OPCIONES_TIPO_MODULO = Object.entries(TIPOS_MODULO).map(([value, t]) => ({ value, label: t.label }))

export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre']
export const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic']
export const ORDINALES_TRIMESTRE = ['1.er', '2.º', '3.er', '4.º']

export const TIPOS_SERVICIO = reactive({
  luz: 'Luz',
  agua: 'Agua',
  internet: 'Internet',
  cable: 'Cable',
  gas_natural: 'Gas natural',
  gas_balon: 'Gas balón',
  extintores: 'Extintores',
  fumigacion: 'Fumigación',
  arbitrios: 'Arbitrios'
})

// Toda periodicidad divide el año en meses enteros (ver PERIODOS_POR_ANIO en services/servicios.js).
export const PERIODICIDADES = {
  mensual: 'Mensual',
  bimestral: 'Bimestral',
  trimestral: 'Trimestral',
  cuatrimestral: 'Cuatrimestral',
  semestral: 'Semestral',
  anual: 'Anual'
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

// Elementos cuya condición se evalúa en un ambiente, un módulo y la construcción de un centro (SPEC 010 §3, SPEC 022; lista por validar).
// El mobiliario y los equipos no se evalúan aquí: su estado se obtiene de los bienes registrados en el ambiente.
export const ELEMENTOS_INFRAESTRUCTURA = reactive([
  { key: 'puertas', label: 'Puertas', icono: 'door_front' },
  { key: 'ventanas', label: 'Ventanas', icono: 'window' },
  { key: 'pintura', label: 'Pintura', icono: 'format_paint' },
  { key: 'pisos', label: 'Pisos', icono: 'grid_on' },
  { key: 'techo', label: 'Techo', icono: 'roofing' },
  { key: 'estructura', label: 'Estructura', icono: 'foundation' },
  { key: 'electricas', label: 'Instalaciones eléctricas', icono: 'electrical_services' },
  { key: 'sanitarias', label: 'Instalaciones sanitarias', icono: 'plumbing' }
])

// Sugerencias al agregar un elemento propio de un centro o módulo (SPEC 022); también se acepta texto libre.
export const SUGERENCIAS_ELEMENTOS = [
  'Cerco perimétrico', 'Portón de ingreso', 'Patios y veredas', 'Áreas verdes', 'Cisterna', 'Tanque elevado',
  'Escaleras', 'Barandas', 'Desagüe', 'Iluminación exterior', 'Fachada'
]

// Condiciones que justifican sugerir el registro de una novedad.
export const CONDICIONES_CRITICAS = ['malo', 'inservible']

// Estado operativo de un vehículo (SPEC 010 §3; criterio de «detenido» por validar).
export const ESTADOS_VEHICULO = {
  operativo: { label: 'Operativo', tono: 'ok', icono: 'check_circle' },
  requiereMantenimiento: { label: 'Requiere mantenimiento', tono: 'wa', icono: 'build' },
  detenido: { label: 'Detenido', tono: 'da', icono: 'block' }
}

export const ESTADO_VEHICULO_DESCONOCIDO = { label: 'No informado', tono: 'si', icono: 'help' }

export const estadoVehiculo = (clave) => ESTADOS_VEHICULO[clave] ?? ESTADO_VEHICULO_DESCONOCIDO

export const OPCIONES_ESTADO_VEHICULO = Object.entries(ESTADOS_VEHICULO).map(([value, e]) => ({ value, label: e.label }))

// Estados que requieren atención (mantenimiento pendiente o vehículo detenido).
export const ESTADOS_VEHICULO_CON_ATENCION = ['requiereMantenimiento', 'detenido']

// Control preventivo y mantenimientos (SPEC 010 §7). Un único registro cubre todos los tipos; `objetivo` indica a qué se aplica.
// `meses` es la periodicidad sugerida (provisional, por validar con las direcciones de los centros): solo propone la próxima fecha.
export const TIPOS_MANTENIMIENTO = reactive({
  fumigacion: { label: 'Fumigación', icono: 'pest_control', objetivo: 'centro', meses: 6 },
  recarga_extintor: { label: 'Recarga de extintor', icono: 'fire_extinguisher', objetivo: 'extintor', meses: 12 },
  mantenimiento_equipo: { label: 'Mantenimiento de equipo', icono: 'handyman', objetivo: 'equipo', meses: 12 },
  mantenimiento_vehiculo: { label: 'Mantenimiento de vehículo', icono: 'car_repair', objetivo: 'vehiculo', meses: 6 }
})

export const OPCIONES_TIPO_MANTENIMIENTO = reactive([])

// Los extintores son bienes de este tipo: su cantidad sale del inventario, no de un contador aparte.
export const TIPO_EXTINTOR = 'extintor'

// Estado de un control según su próxima fecha frente a la fecha de corte.
export const ESTADOS_CONTROL = {
  al_dia: { label: 'Al día', tono: 'ok', icono: 'check_circle' },
  por_vencer: { label: 'Por vencer', tono: 'wa', icono: 'schedule' },
  vencido: { label: 'Vencido', tono: 'da', icono: 'error' },
  sin_programar: { label: 'Sin programar', tono: 'si', icono: 'help' }
}

export const EVALUACIONES_COMBUSTIBLE = {
  comparable: { label: 'Comparable', tono: 'ok' },
  solo_previsto: { label: 'Solo previsto', tono: 'ne' },
  no_comparable: { label: 'No comparable', tono: 'in' }
}

// ---------- Catálogos del backend (SPEC 040) ----------
// GET /api/v1/catalogos define códigos, nombres y orden de los dominios CONDICION, ELEMENTO_BASE, CATEGORIA_BIEN,
// TIPO_SERVICIO, TIPO_INCIDENCIA y TIPO_MANTENIMIENTO. El tono y el icono son presentación y se quedan aquí, por código.
const TONO_CONDICION = { bueno: 'ok', regular: 'wa', malo: 'da', inservible: 'da' }
const ICONO_ELEMENTO = {
  puertas: 'door_front', ventanas: 'window', pintura: 'format_paint', pisos: 'grid_on', techo: 'roofing',
  estructura: 'foundation', electricas: 'electrical_services', sanitarias: 'plumbing'
}
const ICONO_TIPO_MANTENIMIENTO = {
  fumigacion: 'pest_control', recarga_extintor: 'fire_extinguisher', mantenimiento_equipo: 'handyman', mantenimiento_vehiculo: 'car_repair'
}

const porDominio = (catalogos, dominio) => catalogos.filter((c) => c.dominio === dominio)

/**
 * Reemplaza el contenido de un objeto reactivo: primero los códigos del backend (en su orden) y después los que solo
 * conoce el cliente, que se conservan porque los datos existentes pueden referirse a ellos.
 */
function sincronizarMapa (mapa, entradas, valorDe) {
  if (!entradas.length) return
  const anterior = { ...mapa }
  const nuevo = {}
  for (const entrada of entradas) nuevo[entrada.codigo] = valorDe(entrada, anterior[entrada.codigo])
  for (const [codigo, valor] of Object.entries(anterior)) if (!Object.hasOwn(nuevo, codigo)) nuevo[codigo] = valor
  for (const codigo of Object.keys(mapa)) delete mapa[codigo]
  Object.assign(mapa, nuevo)
}

const llenar = (lista, filas) => lista.splice(0, lista.length, ...filas)

// Las listas de opciones se derivan de los mapas anteriores; se vuelven a armar tras cada sincronización.
function reconstruirOpciones () {
  llenar(OPCIONES_CONDICION, Object.entries(CONDICIONES).map(([value, c]) => ({ value, label: c.label })))
  llenar(OPCIONES_CATEGORIA, Object.entries(CATEGORIAS).map(([value, label]) => ({ value, label })))
  llenar(OPCIONES_NOVEDAD, Object.entries(TIPOS_NOVEDAD).map(([value, label]) => ({ value, label })))
  llenar(OPCIONES_INCIDENTE, INCIDENTES.map((value) => ({ value, label: TIPOS_EVENTO[value]?.label ?? value })))
  llenar(OPCIONES_INCIDENCIA_INFRAESTRUCTURA,
    [...new Set([...INCIDENTES, ...Object.keys(TIPOS_NOVEDAD)])].map((value) => ({ value, label: TIPOS_EVENTO[value]?.label ?? value })))
  llenar(OPCIONES_TIPO_MANTENIMIENTO, Object.entries(TIPOS_MANTENIMIENTO).map(([value, t]) => ({ value, label: t.label })))
  llenar(TIPOS_HECHO, [...new Set([...INCIDENTES, ...Object.keys(TIPOS_NOVEDAD), 'baja', 'reposicion'])])
}
reconstruirOpciones()

export function aplicarCatalogos (catalogos = []) {
  sincronizarMapa(CONDICIONES, porDominio(catalogos, 'CONDICION'),
    ({ codigo, nombre }, previo) => ({ tono: TONO_CONDICION[codigo] ?? 'ne', ...previo, label: nombre }))

  const elementos = porDominio(catalogos, 'ELEMENTO_BASE')
  if (elementos.length) {
    const previos = new Map(ELEMENTOS_INFRAESTRUCTURA.map((e) => [e.key, e]))
    const nuevos = elementos.map(({ codigo, nombre }) => ({ key: codigo, label: nombre, icono: previos.get(codigo)?.icono ?? ICONO_ELEMENTO[codigo] ?? 'build' }))
    for (const previo of ELEMENTOS_INFRAESTRUCTURA) if (!nuevos.some((e) => e.key === previo.key)) nuevos.push(previo)
    llenar(ELEMENTOS_INFRAESTRUCTURA, nuevos)
  }

  sincronizarMapa(CATEGORIAS, porDominio(catalogos, 'CATEGORIA_BIEN'), ({ nombre }) => nombre)
  sincronizarMapa(TIPOS_SERVICIO, porDominio(catalogos, 'TIPO_SERVICIO'), ({ nombre }) => nombre)

  // Una novedad es una incidencia que no es un robo (el robo es solo un incidente patrimonial).
  const incidencias = porDominio(catalogos, 'TIPO_INCIDENCIA')
  sincronizarMapa(TIPOS_NOVEDAD, incidencias.filter((c) => c.codigo !== 'robo'), ({ nombre }) => nombre)
  for (const { codigo, nombre } of incidencias) {
    const previo = TIPOS_EVENTO[codigo]
    if (previo) previo.label = nombre
    else TIPOS_EVENTO[codigo] = { label: nombre, tono: 'wa', icono: 'construction' }
  }

  sincronizarMapa(TIPOS_MANTENIMIENTO, porDominio(catalogos, 'TIPO_MANTENIMIENTO'), ({ codigo, nombre, mesesSugeridos }, previo) => ({
    icono: ICONO_TIPO_MANTENIMIENTO[codigo] ?? 'build',
    // El backend solo distingue BIEN; la diferencia extintor/equipo es una regla del cliente.
    objetivo: 'equipo',
    meses: 12,
    ...previo,
    label: nombre,
    ...(mesesSugeridos != null ? { meses: mesesSugeridos } : {})
  }))

  reconstruirOpciones()
}
