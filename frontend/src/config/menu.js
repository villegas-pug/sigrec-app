// Etiquetas de respaldo para el buscador y los avisos (SPEC 039). El menú lateral, su orden, iconos y permisos los
// define SRH (`itemsMenu2`); cada `key` coincide con el nombre de su ruta.
// «Gestión de centros» es una sola pantalla: un explorador Centro › Módulo › Ambiente › Bien › Componente con detalle y acciones por nivel.
export const MENU = [
  { key: 'inicio', label: 'Inicio', icon: 'home' },
  { key: 'centros', label: 'Gestión de centros', icon: 'home_work' },
  { key: 'incidencias', label: 'Incidencias, bajas y reposiciones', icon: 'history' },
  {
    key: 'grupo-necesidades',
    label: 'Necesidades y presupuesto',
    icon: 'request_quote',
    items: [
      { key: 'necesidades', label: 'Necesidades', icon: 'assignment' },
      { key: 'inventario', label: 'Inventario para planificación', icon: 'inventory_2' }
    ]
  },
  { key: 'servicios', label: 'Servicios básicos y pagos', icon: 'receipt_long' },
  {
    key: 'grupo-movilidad',
    label: 'Movilidad',
    icon: 'directions_car',
    items: [
      { key: 'vehiculos', label: 'Vehículos', icon: 'directions_car' },
      { key: 'itinerarios', label: 'Itinerarios', icon: 'route' },
      { key: 'combustible', label: 'Combustible', icon: 'local_gas_station' }
    ]
  },
  { key: 'manual', label: 'Manual de usuario', icon: 'video_library' }
]
