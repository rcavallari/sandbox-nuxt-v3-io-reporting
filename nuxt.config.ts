import { defineNuxtConfig } from 'nuxt'

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: ['@pinia/nuxt', 'nuxt-lodash'],
  css: ['~/assets/styles/main.scss'],
  meta: {
    meta: [
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
  },
})
