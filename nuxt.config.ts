// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: ["@pinia/nuxt"],

  app: {
    head: {
      link: [{ rel: "manifest", href: "/manifest.json" }],
    },
  },

  nitro: {
    devProxy: {
      "/api": {
        target: "https://iscan.store",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  devServer: {
    https: true,
  },
});
