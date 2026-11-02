// plugins/vuetify.js
import 'vuetify/styles'
import '~/assets/styles/typography.css'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createVuetify } from 'vuetify'
import { es } from 'vuetify/locale'
import { VBtn } from 'vuetify/components/VBtn'
import { createHybridIconSet } from '~/helpers/iconHelpers'
import { VUETIFY_ICON_ALIASES } from '~/constants/vuetifyIconAliases'

export default defineNuxtPlugin(nuxtApp => {
  const myCustomLightTheme = {
    dark: false,
    colors: {
      // Papaya orange on carbon black (McLaren). Orange is the action color; black frames the app.
      primary: '#FF8000',
      'primary-light': '#FFA64D',
      background: '#FFFFFF',
      // Cards and panels are white; the page behind them is a soft tinted canvas (--app-canvas).
      surface: '#FFFFFF',
      text: '#212121',
      'text-secondary': '#9E9E9E',
      // State fills are deep enough for WHITE text (4.5:1 or better); orange and amber are too light for white,
      // so their text is near-black. The "on-*" colors below are what buttons, chips and alerts print on each fill.
      success: '#1B8556',
      warning: '#F2B100',
      info: '#1F78C1',
      error: '#D32F2F',
      'on-primary': '#14110F',
      'on-warning': '#14110F',
      'on-success': '#FFFFFF',
      'on-info': '#FFFFFF',
      'on-error': '#FFFFFF',
      navbar: '#0E0E10',
      sidebar: '#0B0B0C',
    },
    variables: {
      // Secondary text ("text-medium-emphasis", subtitles) was 60% black = 4.3:1; 72% is 6:1.
      'medium-emphasis-opacity': 0.72,
    },
  }

  const vuetify = createVuetify({
    ssr: false,
    locale: {
      locale: 'es',
      fallback: 'en',
      messages: { es },
    },
    components: {
      ...components,
    },
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
      VChip: {
        rounded: 'lg',
      },
      VBtn: {
        variant: 'flat',
        color: 'primary',
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
    },
    icons: {
      defaultSet: 'hybrid',
      aliases: VUETIFY_ICON_ALIASES,
      sets: {
        hybrid: createHybridIconSet(),
      },
    },
  })
  nuxtApp.vueApp.use(vuetify)
})