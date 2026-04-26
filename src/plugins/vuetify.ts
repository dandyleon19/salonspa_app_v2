// plugins/vuetify.js
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createVuetify } from 'vuetify'
import { VBtn } from 'vuetify/components/VBtn'

export default defineNuxtPlugin(nuxtApp => {
  const myCustomLightTheme = {
    dark: false,
    colors: {
      primary: '#eb5889',
      'primary-light': '#F48FB1',
      background: '#FFFFFF',
      surface: '#F5F5F5',
      text: '#212121',
      'text-secondary': '#9E9E9E',
      success: '#81C784',
      warning: '#FFD54F',
      info: '#4FC3F7',
      error: '#E57373',
      navbar: '#eb5889',
      sidebar: '#212121',
    },
  }

  const vuetify = createVuetify({
    ssr: false,
    components,
    directives,
    aliases: {
      VBtnSalonSpaPrimary: VBtn,
    },
    display: {
      thresholds: {
        xs: 0,
        sm: 340,
        md: 540,
        lg: 800,
        xl: 1280,
      }
    },
    defaults : {
      VBtn: {
        variant: 'flat',
        color: 'warning',
        class: 'text-white',
        elevation: 0,
      },
      VSecondaryBtn: {
        variant: 'flat',
        color: 'primary-light',
        class: 'text-white',
        elevation: 0,
      },
      VBtnSalonSpaPrimary: {
        variant: 'flat',
        color: 'salon-spa',
        class: 'text-white',
        fontWeight: 'bold',
        elevation: 4,
      },
    },
    theme: {
      defaultTheme: 'myCustomLightTheme',
      themes: {
        myCustomLightTheme,
      }
    }
  })
  nuxtApp.vueApp.use(vuetify)
})