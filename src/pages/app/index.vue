<template>
  <!-- A SUPER_ADMIN has no salon: the API adds up every salon, so it gets a platform panel instead of a salon's. -->
  <DashboardSuperAdmin v-if="authStore.isSuperAdmin" />
  <DashboardSalonOverview v-else />
</template>

<script setup lang="ts">
import { useAuthStore } from "~/store/modules/auth"

definePageMeta({
  layout: "app",
})

useHead({ title: "Dashboard" })

const authStore = useAuthStore()
</script>
