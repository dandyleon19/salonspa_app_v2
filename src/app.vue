<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AppNotification />
  </div>
</template>

<script setup lang="ts">
useHead({
  link: [
    { rel: "icon", href: "/favicon.ico?v=3", sizes: "any" },
    { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png?v=3" },
    { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png?v=3" },
    { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png?v=3" },
  ],
})
</script>