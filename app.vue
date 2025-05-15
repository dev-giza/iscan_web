<template>
  <div class="app-container">
    <ProgressBar />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <BottomNav />
  </div>
</template>

<script setup>
import ProgressBar from '~/components/ProgressBar.vue'

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
  ],
  script: [
    { src: 'https://kit.fontawesome.com/092469c598.js', crossorigin: 'anonymous' }
  ]
})
</script>

<style>
.app-container {
  min-height: 100vh;
  padding-bottom: 60px;
  /* Space for bottom nav */
}
</style>
