// Perfiles de demostración. Accesos y ámbitos son supuestos provisionales pendientes de validar con el jefe de proyecto.
// `accesos` lista nombres de ruta; el primero es la ruta inicial del perfil.
// `acciones` lista las acciones permitidas dentro de esas rutas (ver docs/spec/003-centros-mantenedores-y-ux.md §4).
// Convención de acciones: `entidad.registrar | actualizar | anular`. `carIds` / `vehiculoIds` en null significan «sin restricción».

// Mantenimiento de los datos de un centro: lo comparten Equipo central (todos los CAR) y Personal del CAR (su centro).
const ACCIONES_MANTENIMIENTO = [
  'centro.actualizar', 'centro.foto', 'foto.actualizar', 'foto.anular',
  'ambiente.registrar', 'ambiente.actualizar', 'ambiente.anular',
  'novedad.registrar', 'novedad.actualizar', 'novedad.atender', 'novedad.anular',
  'intervencion.registrar', 'intervencion.actualizar', 'intervencion.anular',
  'bien.registrar', 'bien.actualizar', 'bien.componente', 'bien.trasladar', 'bien.anular', 'bien.verificar', 'bien.incidente', 'bien.baja', 'bien.reposicion',
  'incidente.actualizar', 'incidente.anular',
  'servicio.registrar', 'servicio.actualizar', 'servicio.anular', 'servicio.periodo',
  'hecho.registrar', 'hecho.actualizar', 'hecho.anular',
  'vehiculo.registrar', 'vehiculo.actualizar', 'vehiculo.anular',
  'itinerario.registrar', 'itinerario.actualizar', 'itinerario.ejecucion', 'itinerario.anular',
  'combustible.informar', 'combustible.actualizar', 'combustible.anular'
]

// Solo el equipo central administra el alta de centros, el catálogo de tipos de bien y sus precios.
const ACCIONES_CENTRAL = [
  ...ACCIONES_MANTENIMIENTO,
  'centro.registrar', 'centro.anular',
  'tipoBien.registrar', 'tipoBien.actualizar', 'tipoBien.anular', 'precio.informar'
]

export const PERFILES = [
  {
    id: 'central',
    nombre: 'Equipo central USPNNA',
    ambito: { descripcion: 'Todos los CAR', carIds: null, vehiculoIds: null },
    accesos: ['inicio', 'centros', 'ambientes', 'bienes', 'registro', 'incidencias', 'necesidades', 'precios', 'servicios', 'vehiculos', 'itinerarios', 'combustible'],
    acciones: ACCIONES_CENTRAL
  },
  {
    id: 'car',
    nombre: 'Personal del CAR',
    ambito: { descripcion: 'CAR Demo Amanecer', carIds: ['AMA'], vehiculoIds: null },
    accesos: ['inicio', 'centros', 'ambientes', 'bienes', 'registro', 'incidencias', 'necesidades', 'servicios', 'vehiculos', 'itinerarios', 'combustible'],
    acciones: ACCIONES_MANTENIMIENTO
  },
  {
    id: 'verifica',
    nombre: 'Verificación física',
    ambito: { descripcion: 'CAR Demo Amanecer', carIds: ['AMA'], vehiculoIds: null },
    accesos: ['bienes', 'incidencias'],
    acciones: ['bien.verificar', 'bien.incidente']
  },
  {
    id: 'chofer',
    nombre: 'Chofer',
    ambito: { descripcion: 'Movilidad AMA-V01 · CAR Demo Amanecer', carIds: ['AMA'], vehiculoIds: ['AMA-V01'] },
    accesos: ['itinerarios', 'vehiculos', 'combustible'],
    acciones: ['itinerario.registrar', 'itinerario.ejecucion', 'combustible.informar']
  }
]

export const PERFIL_POR_DEFECTO = 'central'
