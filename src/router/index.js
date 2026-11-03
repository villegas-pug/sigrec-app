import { defineRouter } from '#q-app/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'

export default defineRouter(() => {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  return createRouter({
    // Al volver con «Atrás» se recupera la posición; en cualquier otra navegación se abre arriba.
    scrollBehavior: (to, from, savedPosition) => savedPosition ?? { left: 0, top: 0 },
    routes,
    // Se configura en quasar.config.js › build › vueRouterMode y publicPath.
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })
})
