import { usePerfil } from 'src/composables/usePerfil'

// Cada nombre de ruta coincide con una entrada de menu.js y con los accesos de perfiles.js.
// `meta.grupo` y `meta.titulo` alimentan las migas y el título de página.
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      // La raíz lleva a la primera pantalla a la que el perfil activo tiene acceso.
      { path: '', name: 'raiz', redirect: () => ({ name: usePerfil().rutaInicial.value }) },
      { path: 'inicio', name: 'inicio', component: () => import('pages/InicioPage.vue'), meta: { titulo: 'Inicio' } },
      { path: 'centros', name: 'centros', component: () => import('pages/GestionCentrosPage.vue'), meta: { titulo: 'Gestión de centros' } },
      { path: 'incidencias', name: 'incidencias', component: () => import('pages/IncidenciasPage.vue'), meta: { titulo: 'Incidencias, bajas y reposiciones' } },
      { path: 'necesidades', name: 'necesidades', component: () => import('pages/NecesidadesPage.vue'), meta: { grupo: 'Necesidades y presupuesto', titulo: 'Necesidades' } },
      { path: 'necesidades/inventario', name: 'inventario', component: () => import('pages/InventarioPage.vue'), meta: { grupo: 'Necesidades y presupuesto', titulo: 'Inventario para planificación' } },
      { path: 'necesidades/precios', name: 'precios', component: () => import('pages/PreciosPage.vue'), meta: { grupo: 'Necesidades y presupuesto', titulo: 'Tipos de bien y precios' } },
      { path: 'servicios', name: 'servicios', component: () => import('pages/ServiciosPage.vue'), meta: { titulo: 'Servicios básicos y pagos' } },
      { path: 'movilidad/vehiculos', name: 'vehiculos', component: () => import('pages/VehiculosPage.vue'), meta: { grupo: 'Movilidad', titulo: 'Vehículos' } },
      { path: 'movilidad/itinerarios', name: 'itinerarios', component: () => import('pages/ItinerariosPage.vue'), meta: { grupo: 'Movilidad', titulo: 'Itinerarios' } },
      { path: 'movilidad/combustible', name: 'combustible', component: () => import('pages/CombustiblePage.vue'), meta: { grupo: 'Movilidad', titulo: 'Combustible' } },
      // Direcciones anteriores: se conservan como redirecciones para no romper enlaces guardados (conservan la consulta).
      // Ambientes, bienes y registro de bienes ahora viven en el explorador de «Gestión de centros».
      { path: 'locales', redirect: (to) => ({ name: 'centros', query: to.query }) },
      { path: 'ambientes', redirect: (to) => ({ name: 'centros', query: to.query }) },
      { path: 'bienes', redirect: (to) => ({ name: 'centros', query: to.query }) },
      { path: 'bienes/registro', redirect: (to) => ({ name: 'centros', query: { ...to.query, registrar: '1' } }) },
      { path: 'movilidad', redirect: (to) => ({ name: 'itinerarios', query: to.query }) },
      // El «Tablero de control» se fusionó en Inicio (SPEC 011); su consulta por equipo (?tipo=) vive en Inventario.
      { path: 'tablero', redirect: (to) => (to.query.tipo ? { name: 'inventario', query: { ...to.query, vista: 'equipo' } } : { name: 'inicio', query: to.query }) }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
