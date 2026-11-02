// Menú lateral. Cada `key` de una entrada navegable coincide con el nombre de su ruta y con los accesos de perfiles.js.
// El grupo «Centros» sigue la jerarquía Centro › Ambiente › Bien › Componente.
export const MENU = [
  { key: 'inicio', label: 'Inicio', icon: 'home' },
  {
    key: 'grupo-centros',
    label: 'Centros',
    icon: 'home_work',
    items: [
      { key: 'locales', label: 'Centros y locales', icon: 'domain' },
      { key: 'ambientes', label: 'Ambientes', icon: 'meeting_room' },
      { key: 'bienes', label: 'Bienes y componentes', icon: 'account_tree' },
      { key: 'registro', label: 'Registro y verificación', icon: 'fact_check' }
    ]
  },
  { key: 'incidencias', label: 'Incidencias, bajas y reposiciones', icon: 'history' },
  {
    key: 'grupo-necesidades',
    label: 'Necesidades y presupuesto',
    icon: 'request_quote',
    items: [
      { key: 'necesidades', label: 'Necesidades', icon: 'assignment' },
      { key: 'precios', label: 'Precios referenciales', icon: 'sell' }
    ]
  },
  { key: 'servicios', label: 'Servicios básicos y pagos', icon: 'receipt_long' },
  {
    key: 'grupo-movilidad',
    label: 'Movilidad',
    icon: 'directions_car',
    items: [
      { key: 'vehiculos', label: 'Vehículos', icon: 'directions_car' },
      { key: 'movilidad', label: 'Itinerarios', icon: 'route' },
      { key: 'combustible', label: 'Combustible', icon: 'local_gas_station' }
    ]
  }
]
