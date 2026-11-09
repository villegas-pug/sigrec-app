import { defineRouter } from '#q-app/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'

export default defineRouter(() => {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  return createRouter({
    // Al volver con «Atrás» se recupera la posición; en cualquier otra navegación se abre arriba.
    // Un enlace con ancla (p. ej. Inicio › #atencion) baja a esa sección, descontando la cabecera fija.
    scrollBehavior: (to, from, savedPosition) => savedPosition ?? (to.hash ? { el: to.hash, top: 80 } : { left: 0, top: 0 }),
    routes,
    // Se configura en quasar.config.js › build › vueRouterMode y publicPath.
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })
})
