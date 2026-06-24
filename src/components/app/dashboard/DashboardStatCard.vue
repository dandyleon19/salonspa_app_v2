<template>
  <v-card class="dashboard-stat-card" rounded="xl" elevation="0">
    <v-card-text class="pa-4 d-flex align-center ga-4">
      <v-avatar :color="color" variant="tonal" size="48">
        <v-icon :icon="icon" size="24" />
      </v-avatar>
      <div class="flex-grow-1 min-width-0">
        <p class="text-caption text-medium-emphasis mb-1">{{ label }}</p>
        <AppSkeletonTransition>
          <v-skeleton-loader v-if="loading" key="dashboard-stat-skeleton" type="text" width="48" />
          <p v-else key="dashboard-stat-content" class="text-h5 font-weight-bold mb-0">{{ value }}</p>
        </AppSkeletonTransition>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: number | string
  icon: string
  color?: string
  loading?: boolean
}>()
</script>

<style scoped>
.dashboard-stat-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  height: 100%;
}
</style>
