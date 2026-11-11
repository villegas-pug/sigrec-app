// Perfiles de demostración. Accesos y ámbitos son supuestos provisionales pendientes de validar con el jefe de proyecto.
// `accesos` lista nombres de ruta; el primero es la ruta inicial del perfil.
// `acciones` lista las acciones permitidas dentro de esas rutas (ver docs/spec/003-centros-mantenedores-y-ux.md §4).
// Convención de acciones: `entidad.registrar | actualizar | anular`. `carIds` / `vehiculoIds` en null significan «sin restricción».
// `entidad.actualizarPropio` permite actualizar solo los registros vigentes que informó el perfil activo (ver docs/spec/009-responsabilidad-combustible.md).
import { MENU } from 'src/config/menu'

// Mantenimiento de los datos de un centro: lo comparten Equipo central (todos los CAR) y Personal del CAR (su centro).
const ACCIONES_MANTENIMIENTO = [
  'centro.incidente', 'ambiente.incidente',
  'centro.actualizar', 'centro.foto', 'foto.actualizar', 'foto.anular',
  'modulo.registrar', 'modulo.actualizar', 'modulo.anular',
  'ambiente.registrar', 'ambiente.actualizar', 'ambiente.anular',
  'novedad.registrar', 'novedad.actualizar', 'novedad.atender', 'novedad.anular',
  'intervencion.registrar', 'intervencion.actualizar', 'intervencion.anular',
  'bien.registrar', 'bien.actualizar', 'bien.componente', 'bien.trasladar', 'bien.anular', 'bien.verificar', 'bien.incidente', 'bien.baja', 'bien.reposicion',
  'incidente.actualizar', 'incidente.anular',
  'servicio.registrar', 'servicio.actualizar', 'servicio.anular', 'servicio.periodo',
  'hecho.registrar', 'hecho.actualizar', 'hecho.anular',
  'vehiculo.registrar', 'vehiculo.actualizar', 'vehiculo.anular',
  'itinerario.registrar', 'itinerario.actualizar', 'itinerario.ejecucion', 'itinerario.anular',
  'combustible.informar', 'combustible.actualizar', 'combustible.anular',
  'mantenimiento.registrar', 'mantenimiento.actualizar', 'mantenimiento.anular'
]

// Catálogo completo de acciones del sistema: toda acción nueva se añade aquí (o en ACCIONES_MANTENIMIENTO).
// Las exclusivas de administración (alta de centros, catálogo de tipos de bien y precios, reversión de bajas y reposiciones)
// solo las tiene el perfil de acceso total: quien informa un hecho patrimonial no lo corrige.
export const TODAS_LAS_ACCIONES = [
  ...ACCIONES_MANTENIMIENTO,
  'centro.registrar', 'centro.anular',
  'baja.anular', 'reposicion.anular',
  'tipoBien.registrar', 'tipoBien.actualizar', 'tipoBien.anular', 'precio.informar',
  'combustible.actualizarPropio'
]

// Accesos del menú más el catálogo contextual, cuyo permiso se conserva aunque no tenga submenú.
export const TODAS_LAS_RUTAS = [...MENU.flatMap((entrada) => entrada.items ?? [entrada]).map((entrada) => entrada.key), 'precios']

export const PERFILES = [
  {
    // Administrador del prototipo: acceso total (todas las rutas, todas las acciones, todos los CAR).
    id: 'central',
    nombre: 'Equipo central USPNNA',
    ambito: { descripcion: 'Todos los CAR · acceso total', carIds: null, vehiculoIds: null },
    accesos: TODAS_LAS_RUTAS,
    acciones: TODAS_LAS_ACCIONES
  },
  {
    id: 'car',
    nombre: 'Personal del CAR',
    ambito: { descripcion: 'CAR Demo Amanecer', carIds: ['AMA'], vehiculoIds: null },
    accesos: ['inicio', 'centros', 'incidencias', 'necesidades', 'inventario', 'servicios', 'vehiculos', 'itinerarios', 'combustible', 'manual'],
    acciones: ACCIONES_MANTENIMIENTO
  },
  {
    id: 'verifica',
    nombre: 'Verificación física',
    ambito: { descripcion: 'CAR Demo Amanecer', carIds: ['AMA'], vehiculoIds: null },
    accesos: ['centros', 'incidencias', 'manual'],
    acciones: ['bien.verificar', 'bien.incidente']
  },
  {
    id: 'chofer',
    nombre: 'Chofer',
    ambito: { descripcion: 'Movilidad AMA-V01 · CAR Demo Amanecer', carIds: ['AMA'], vehiculoIds: ['AMA-V01'] },
    accesos: ['itinerarios', 'vehiculos', 'combustible', 'manual'],
    acciones: ['itinerario.registrar', 'itinerario.ejecucion', 'combustible.informar', 'combustible.actualizarPropio']
  }
]

export const PERFIL_POR_DEFECTO = 'central'
