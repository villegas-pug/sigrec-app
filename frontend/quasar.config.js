// Configuración de Quasar CLI (app-vite v2)
// https://legacy-app.quasar.dev/quasar-cli-vite-v2/quasar-config-file

import { defineConfig } from '#q-app/wrappers'

// Backend de la API: en dev lo atiende el proxy de quasar; en build, el servidor de la intranet.
const API_DEV = 'http://127.0.0.1:4006'
const API_BUILD = 'http://172.19.0.51:4006'

export default defineConfig((ctx) => {
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
      // SPEC 039: integración con la intranet. Valores por defecto de SIGREC; el entorno puede sobreescribirlos al compilar.
      env: {
        // Vacío en dev: la SPA usa la ruta relativa /api/v1 y el proxy la reenvía.
        SIGREC_API_URL: ctx.dev ? '' : (process.env.SIGREC_API_URL ?? API_BUILD),
        SIGREC_SRH_URL: process.env.SIGREC_SRH_URL ?? 'https://srvapp01.inabif.gob.pe:8443/SRH',
        SIGREC_SISTEMA_ID: process.env.SIGREC_SISTEMA_ID ?? '345',
        SIGREC_INTRANET_URL: process.env.SIGREC_INTRANET_URL ?? 'https://srvapp01.inabif.gob.pe:8443/intranet/#/',
        SIGREC_SALIR_URL: process.env.SIGREC_SALIR_URL ?? 'https://srvapp01.inabif.gob.pe:8443/seguridad/SPrincipal',
        SIGREC_TOKEN_EXPIRATION_MINUTES: process.env.SIGREC_TOKEN_EXPIRATION_MINUTES ?? '240',
        // Como en educalle-app, la clave viaja en el bundle: controla la caducidad de la sesión, no la seguridad.
        SIGREC_TOKEN_SECRET: process.env.SIGREC_TOKEN_SECRET ?? 'sigrec-desarrollo-token-sesion'
      },
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
      proxy: { '/api': { target: API_DEV, changeOrigin: true } }
    },

    framework: {
      config: {},
      lang: 'es',
      iconSet: 'material-icons',
      plugins: ['Notify', 'Dialog', 'LocalStorage']
    },

    animations: []
  }
})
