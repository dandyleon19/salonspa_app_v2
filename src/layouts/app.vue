<template>
  <v-app>
    <AppSidebar />

    <v-main class="app-layout-main">
      <NavBar />
      <SubscriptionBanner />
      <v-container class="app-layout-container" fluid>
        <slot />
      </v-container>
    </v-main>

    <!-- Phones and tablets (the same width as the tables turning into cards): quick access to the key pages. -->
    <AppBottomNav v-if="isMobile" />
  </v-app>
</template>

<script setup lang="ts">
import AppBottomNav from "~/components/app/shared/AppBottomNav.vue"
import NavBar from "~/components/app/shared/NavBar.vue"
import SubscriptionBanner from "~/components/app/shared/SubscriptionBanner.vue"
import { useAppLayout } from "~/composables/useAppLayout"
import { useAuthStore } from "~/store/modules/auth"

const authStore = useAuthStore()
const { isMobile } = useAppLayout()

useHead({
  titleTemplate: (title) => {
    const salonName = authStore.user?.salonName || "SalonSpa"
    return title ? `${title} - ${salonName}` : salonName
  },
})
</script>

<style scoped>
.app-layout-main {
  background: var(--app-canvas);
}

.app-layout-container {
  width: 100%;
  max-width: 100%;
  padding-top: 16px;
  padding-bottom: 32px;
}
</style>
