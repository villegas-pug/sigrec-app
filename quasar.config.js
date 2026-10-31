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
      vueRouterMode: 'hash'
    },

    devServer: {
      open: true
    },

    framework: {
      config: {},
      lang: 'es',
      iconSet: 'material-icons',
      plugins: ['Notify']
    },

    animations: []
  }
})
