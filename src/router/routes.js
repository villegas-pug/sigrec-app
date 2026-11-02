// Cada nombre de ruta coincide con una entrada de menu.js y con los accesos de perfiles.js.
// Los nombres `locales` y `movilidad` se mantienen por compatibilidad; sus direcciones siguen las etiquetas del menú.
// `meta.grupo` y `meta.titulo` alimentan las migas y el título de página.
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'raiz', redirect: { name: 'inicio' } },
      { path: 'inicio', name: 'inicio', component: () => import('pages/InicioPage.vue'), meta: { titulo: 'Inicio' } },
      { path: 'centros', name: 'locales', component: () => import('pages/LocalesPage.vue'), meta: { grupo: 'Centros', titulo: 'Centros y locales' } },
      { path: 'ambientes', name: 'ambientes', component: () => import('pages/AmbientesPage.vue'), meta: { grupo: 'Centros', titulo: 'Ambientes' } },
      { path: 'bienes', name: 'bienes', component: () => import('pages/BienesPage.vue'), meta: { grupo: 'Centros', titulo: 'Bienes y componentes' } },
      { path: 'bienes/registro', name: 'registro', component: () => import('pages/RegistroBienPage.vue'), meta: { grupo: 'Centros', titulo: 'Registro y verificación' } },
      { path: 'incidencias', name: 'incidencias', component: () => import('pages/IncidenciasPage.vue'), meta: { titulo: 'Incidencias, bajas y reposiciones' } },
      { path: 'necesidades', name: 'necesidades', component: () => import('pages/NecesidadesPage.vue'), meta: { grupo: 'Necesidades y presupuesto', titulo: 'Necesidades' } },
      { path: 'necesidades/precios', name: 'precios', component: () => import('pages/PreciosPage.vue'), meta: { grupo: 'Necesidades y presupuesto', titulo: 'Precios referenciales' } },
      { path: 'servicios', name: 'servicios', component: () => import('pages/ServiciosPage.vue'), meta: { titulo: 'Servicios básicos y pagos' } },
      { path: 'movilidad/vehiculos', name: 'vehiculos', component: () => import('pages/VehiculosPage.vue'), meta: { grupo: 'Movilidad', titulo: 'Vehículos' } },
      { path: 'movilidad/itinerarios', name: 'movilidad', component: () => import('pages/MovilidadPage.vue'), meta: { grupo: 'Movilidad', titulo: 'Itinerarios' } },
      { path: 'movilidad/combustible', name: 'combustible', component: () => import('pages/CombustiblePage.vue'), meta: { grupo: 'Movilidad', titulo: 'Combustible' } },
      // Direcciones anteriores: se conservan como redirecciones para no romper enlaces guardados (conservan la consulta).
      { path: 'locales', redirect: (to) => ({ name: 'locales', query: to.query }) },
      { path: 'movilidad', redirect: (to) => ({ name: 'movilidad', query: to.query }) }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
