// Cada nombre de ruta coincide con una entrada de menu.js y con el `enlace` que SRH devuelve en el menú del perfil (SPEC 039).
// `meta.grupo` y `meta.titulo` alimentan las migas y el título de página.
// `meta.datos` (SPEC 041) lista los grupos de services/cargaDatos.js que la pantalla necesita antes de mostrarse.
// `meta.filtros` (SPEC 052) muestra los filtros de cabecera: `principal` es el grupo que recibe Año y Mes, y `registro`
// el tipo de registro sobre el que el backend los aplica; todos los grupos reciben el centro.
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      // La raíz lleva a la primera pantalla a la que el perfil activo tiene acceso.
      { path: '', name: 'raiz', component: () => import('pages/InicioPage.vue') },
      { path: 'sin-perfiles', name: 'sin-perfiles', component: () => import('components/layout/SinAcceso.vue') },
      { path: 'inicio', name: 'inicio', component: () => import('pages/InicioPage.vue'), meta: { datos: [], titulo: 'Inicio' } },
      { path: 'manual', name: 'manual', component: () => import('pages/ManualPage.vue'), meta: { titulo: 'Manual de usuario' } },
      { path: 'centros', name: 'centros', component: () => import('pages/GestionCentrosPage.vue'), meta: { datos: ['jerarquia', 'inventario', 'tiposBien:precios', 'mantenimientos', 'vehiculos', 'servicios', 'fotos', 'intervenciones'], filtros: { principal: 'jerarquia', registro: 'CENTRO' }, titulo: 'Gestión de centros' } },
      { path: 'incidencias', name: 'incidencias', component: () => import('pages/IncidenciasPage.vue'), meta: { datos: ['jerarquia', 'inventario', 'tiposBien:precios', 'mantenimientos'], filtros: { principal: 'inventario', registro: 'HECHO' }, titulo: 'Incidencias, bajas y reposiciones' } },
      { path: 'necesidades', name: 'necesidades', component: () => import('pages/NecesidadesPage.vue'), meta: { datos: ['jerarquia', 'inventario', 'tiposBien:precios'], filtros: { principal: 'inventario', registro: 'BIEN' }, grupo: 'Necesidades y presupuesto', titulo: 'Necesidades' } },
      { path: 'necesidades/inventario', name: 'inventario', component: () => import('pages/InventarioPage.vue'), meta: { datos: ['jerarquia', 'inventario', 'tiposBien:precios', 'mantenimientos'], filtros: { principal: 'inventario', registro: 'BIEN' }, grupo: 'Necesidades y presupuesto', titulo: 'Inventario para planificación' } },
      { path: 'necesidades/precios', name: 'precios', redirect: (to) => {
        const { tipo, filtro, ...contexto } = to.query
        return { name: 'necesidades', query: { ...contexto, catalogo: 'precios', ...(tipo ? { tipoCatalogo: tipo } : {}), ...(filtro ? { filtroCatalogo: filtro } : {}) } }
      } },
      { path: 'servicios', name: 'servicios', component: () => import('pages/ServiciosPage.vue'), meta: { datos: ['jerarquia', 'servicios'], filtros: { principal: 'servicios' }, titulo: 'Servicios básicos y pagos' } },
      { path: 'movilidad/vehiculos', name: 'vehiculos', component: () => import('pages/VehiculosPage.vue'), meta: { datos: ['jerarquia', 'vehiculos', 'itinerarios', 'mantenimientos'], filtros: { principal: 'vehiculos' }, grupo: 'Movilidad', titulo: 'Vehículos' } },
      { path: 'movilidad/itinerarios', name: 'itinerarios', component: () => import('pages/ItinerariosPage.vue'), meta: { datos: ['jerarquia', 'vehiculos', 'itinerarios', 'combustible'], filtros: { principal: 'itinerarios' }, grupo: 'Movilidad', titulo: 'Itinerarios' } },
      { path: 'movilidad/combustible', name: 'combustible', component: () => import('pages/CombustiblePage.vue'), meta: { datos: ['jerarquia', 'vehiculos', 'itinerarios', 'combustible'], filtros: { principal: 'combustible' }, grupo: 'Movilidad', titulo: 'Combustible' } },
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
