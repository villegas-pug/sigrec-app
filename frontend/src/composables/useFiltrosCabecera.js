// SPEC 052. Filtros de cabecera compartidos por las pantallas que declaran `meta.filtros`.
// Estado global en memoria: se conserva al navegar y se reinicia al cambiar de sesión. No va en la URL,
// porque `MainLayout` vuelve a montar la pantalla cuando cambia `route.fullPath`.
import { reactive, readonly, watch } from 'vue'
import { MESES, TODOS } from 'src/config/catalogos'
import { anioActual } from 'src/utils/fechas'

export const TIPO_ENTIDAD = 'PÚBLICA'
export const ENTIDAD = 'PROGRAMA INTEGRAL NACIONAL PARA BIENESTAR FAMILIAR - INABIF'
// Primer año con registros en SIGREC; la lista crece sola con el año actual.
const ANIO_INICIAL = 2026

const estado = reactive({ centro: null, centroNombre: '', anio: TODOS, mes: TODOS })

// Sin año no hay mes: se evita filtrar «marzo de cualquier año».
watch(() => estado.anio, (anio) => { if (anio === TODOS) estado.mes = TODOS })

export function opcionesAnio () {
  const anios = []
  for (let anio = Math.max(anioActual(), ANIO_INICIAL); anio >= ANIO_INICIAL; anio--) anios.push({ label: String(anio), value: anio })
  return [{ label: 'Todos', value: TODOS }, ...anios]
}

export const OPCIONES_MES = [{ label: 'Todos', value: TODOS }, ...MESES.map((label, i) => ({ label, value: i + 1 }))]

export function fijarCentro (codigo, nombre = '') {
  estado.centro = codigo || null
  estado.centroNombre = codigo ? nombre : ''
}

export function fijarAnio (anio) { estado.anio = anio ?? TODOS }

export function fijarMes (mes) { estado.mes = estado.anio === TODOS ? TODOS : (mes ?? TODOS) }

export function reiniciarFiltros () {
  Object.assign(estado, { centro: null, centroNombre: '', anio: TODOS, mes: TODOS })
}

/** Clave de los filtros vigentes: distingue una recarga necesaria de una repetida. */
export const claveFiltros = () => `${estado.centro ?? ''}|${estado.anio}|${estado.mes}`

/**
 * Consulta (`?centro=&anio=&mes=`) de un grupo de datos según `meta.filtros` de la ruta.
 * Todos los grupos reciben el centro; solo el principal recibe el periodo y el registro sobre el que se aplica.
 * Con `registro: 'CENTRO'` (Gestión de centros) el periodo va a todos: el backend acota cada colección a los centros
 * registrados en el periodo, para que coincida con la jerarquía.
 */
export function consultaGrupo (grupo, config) {
  if (!config) return ''
  const params = new URLSearchParams()
  if (estado.centro) params.set('centro', estado.centro)
  const conPeriodo = grupo === config.principal || config.registro === 'CENTRO'
  if (conPeriodo && estado.anio !== TODOS) {
    params.set('anio', estado.anio)
    if (estado.mes !== TODOS) params.set('mes', estado.mes)
    if (config.registro) params.set('registro', config.registro)
  }
  const texto = params.toString()
  return texto ? `?${texto}` : ''
}

export function useFiltrosCabecera () {
  return { filtros: readonly(estado), fijarCentro, fijarAnio, fijarMes, opcionesAnio, OPCIONES_MES }
}
