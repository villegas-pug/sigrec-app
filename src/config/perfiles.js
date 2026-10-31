// Perfiles de demostración. Accesos y ámbitos son supuestos provisionales pendientes de validar con el jefe de proyecto.
// `accesos` lista nombres de ruta; el primero es la ruta inicial del perfil.
// `carIds` / `vehiculoIds` en null significan «sin restricción».
export const PERFILES = [
  {
    id: 'central',
    nombre: 'Equipo central USPNNA',
    ambito: { descripcion: 'Todos los CAR', carIds: null, vehiculoIds: null },
    accesos: ['inicio', 'locales', 'ambientes', 'bienes', 'incidencias', 'necesidades', 'precios', 'servicios', 'movilidad', 'combustible']
  },
  {
    id: 'car',
    nombre: 'Personal del CAR',
    ambito: { descripcion: 'CAR Demo Amanecer', carIds: ['AMA'], vehiculoIds: null },
    accesos: ['inicio', 'locales', 'ambientes', 'bienes', 'registro', 'incidencias', 'necesidades', 'servicios', 'movilidad', 'combustible']
  },
  {
    id: 'verifica',
    nombre: 'Verificación física',
    ambito: { descripcion: 'CAR Demo Amanecer', carIds: ['AMA'], vehiculoIds: null },
    accesos: ['bienes', 'registro', 'incidencias']
  },
  {
    id: 'chofer',
    nombre: 'Chofer',
    ambito: { descripcion: 'Movilidad AMA-V01 · CAR Demo Amanecer', carIds: ['AMA'], vehiculoIds: ['AMA-V01'] },
    accesos: ['movilidad', 'combustible']
  }
]

export const PERFIL_POR_DEFECTO = 'central'
