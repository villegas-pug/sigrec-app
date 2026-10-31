// Cada nombre de ruta coincide con una entrada de menu.js y con los accesos de perfiles.js.
// `meta.grupo` y `meta.titulo` alimentan las migas y el título de página.
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'raiz', redirect: { name: 'inicio' } },
      { path: 'inicio', name: 'inicio', component: () => import('pages/InicioPage.vue'), meta: { titulo: 'Inicio' } },
      { path: 'locales', name: 'locales', component: () => import('pages/LocalesPage.vue'), meta: { grupo: 'Locales e infraestructura', titulo: 'Centros y locales' } },
      { path: 'ambientes', name: 'ambientes', component: () => import('pages/AmbientesPage.vue'), meta: { grupo: 'Locales e infraestructura', titulo: 'Ambientes' } },
      { path: 'bienes', name: 'bienes', component: () => import('pages/BienesPage.vue'), meta: { grupo: 'Bienes', titulo: 'Bienes del CAR' } },
      { path: 'bienes/registro', name: 'registro', component: () => import('pages/RegistroBienPage.vue'), meta: { grupo: 'Bienes', titulo: 'Registro y verificación' } },
      { path: 'incidencias', name: 'incidencias', component: () => import('pages/IncidenciasPage.vue'), meta: { titulo: 'Incidencias, bajas y reposiciones' } },
      { path: 'necesidades', name: 'necesidades', component: () => import('pages/NecesidadesPage.vue'), meta: { grupo: 'Necesidades y presupuesto', titulo: 'Necesidades' } },
      { path: 'necesidades/precios', name: 'precios', component: () => import('pages/PreciosPage.vue'), meta: { grupo: 'Necesidades y presupuesto', titulo: 'Precios referenciales' } },
      { path: 'servicios', name: 'servicios', component: () => import('pages/ServiciosPage.vue'), meta: { titulo: 'Servicios básicos y pagos' } },
      { path: 'movilidad', name: 'movilidad', component: () => import('pages/MovilidadPage.vue'), meta: { grupo: 'Movilidad', titulo: 'Vehículos e itinerarios' } },
      { path: 'movilidad/combustible', name: 'combustible', component: () => import('pages/CombustiblePage.vue'), meta: { grupo: 'Movilidad', titulo: 'Combustible' } }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
