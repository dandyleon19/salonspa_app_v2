import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  app: {
    head: {
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
    },
  },
  css: [
    '@/assets/styles/variables.css'
  ],
  components: [
    {
      path: '~/components',
      pathPrefix: false
    },
    {
      path: '~/components/app/shared',
      pathPrefix: false
    }
  ],
  srcDir: 'src/',
  modules: [
    '@nuxt/icon',
    '@pinia/nuxt',
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        config.plugins.push(vuetify({ autoImport: true }))
      })
    },
  ],
  build: {
    transpile: ['vuetify'],
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_API_BASE,
      passportClientId: process.env.NUXT_PASSPORT_CLIENT_ID,
      passportClientSecret: process.env.NUXT_PASSPORT_CLIENT_SECRET,
    }
  }
})