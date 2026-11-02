// Perfiles de demostración. Accesos y ámbitos son supuestos provisionales pendientes de validar con el jefe de proyecto.
// `accesos` lista nombres de ruta; el primero es la ruta inicial del perfil.
// `acciones` lista las acciones permitidas dentro de esas rutas (ver docs/spec/002-acciones-y-jerarquia.md §3).
// `carIds` / `vehiculoIds` en null significan «sin restricción».
const ACCIONES_CAR = [
  'local.actualizar', 'local.foto',
  'ambiente.registrar', 'ambiente.actualizar', 'ambiente.novedad', 'ambiente.intervencion', 'novedad.atender',
  'bien.registrar', 'bien.actualizar', 'bien.componente', 'bien.verificar', 'bien.incidente', 'bien.baja', 'bien.reposicion',
  'servicio.registrar', 'servicio.actualizar', 'servicio.periodo', 'servicio.hecho',
  'vehiculo.registrar', 'vehiculo.actualizar',
  'itinerario.registrar', 'itinerario.ejecucion', 'combustible.informar'
]

export const PERFILES = [
  {
    id: 'central',
    nombre: 'Equipo central USPNNA',
    ambito: { descripcion: 'Todos los CAR', carIds: null, vehiculoIds: null },
    accesos: ['inicio', 'locales', 'ambientes', 'bienes', 'incidencias', 'necesidades', 'precios', 'servicios', 'vehiculos', 'movilidad', 'combustible'],
    acciones: ['centro.registrar', 'local.actualizar', 'local.foto', 'precio.informar']
  },
  {
    id: 'car',
    nombre: 'Personal del CAR',
    ambito: { descripcion: 'CAR Demo Amanecer', carIds: ['AMA'], vehiculoIds: null },
    accesos: ['inicio', 'locales', 'ambientes', 'bienes', 'registro', 'incidencias', 'necesidades', 'servicios', 'vehiculos', 'movilidad', 'combustible'],
    acciones: ACCIONES_CAR
  },
  {
    id: 'verifica',
    nombre: 'Verificación física',
    ambito: { descripcion: 'CAR Demo Amanecer', carIds: ['AMA'], vehiculoIds: null },
    accesos: ['bienes', 'registro', 'incidencias'],
    acciones: ['bien.verificar', 'bien.incidente']
  },
  {
    id: 'chofer',
    nombre: 'Chofer',
    ambito: { descripcion: 'Movilidad AMA-V01 · CAR Demo Amanecer', carIds: ['AMA'], vehiculoIds: ['AMA-V01'] },
    accesos: ['movilidad', 'vehiculos', 'combustible'],
    acciones: ['itinerario.registrar', 'itinerario.ejecucion', 'combustible.informar']
  }
]

export const PERFIL_POR_DEFECTO = 'central'
