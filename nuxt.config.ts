import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
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