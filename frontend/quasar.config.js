// Configuración de Quasar CLI (app-vite v2)
// https://legacy-app.quasar.dev/quasar-cli-vite-v2/quasar-config-file

import { defineConfig } from '#q-app/wrappers'

export default defineConfig(() => {
  return {
    boot: [],

    css: ['app.scss'],

    extras: ['material-icons'],

    build: {
      target: {
        browser: 'baseline-widely-available',
        node: 'node22'
      },
      vueRouterMode: 'hash',
      // Path base de la SPA: se sirve en /sigrec/ (dev y build).
      publicPath: '/sigrec/'
    },

    devServer: {
      // Acceso desde la IP local de red; solo esa interfaz escucha.
      host: '10.101.0.36',
      port: 9000,
      // Falla si el 9000 está ocupado, en lugar de saltar a otro puerto.
      strictPort: true,
      open: false,
      proxy: { '/api': { target: 'http://127.0.0.1:8080', changeOrigin: true } }
    },

    framework: {
      config: {},
      lang: 'es',
      iconSet: 'material-icons',
      plugins: ['Notify', 'Dialog']
    },

    animations: []
  }
})
