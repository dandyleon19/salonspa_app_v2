<template>
  <v-card
    class="dashboard-stat-card"
    :class="{ 'dashboard-stat-card--link': to }"
    :to="to"
    :link="!!to"
    rounded="xl"
    elevation="0"
  >
    <v-card-text class="pa-4 d-flex align-center ga-4">
      <v-avatar :color="color" variant="tonal" size="48">
        <v-icon :icon="icon" size="24" />
      </v-avatar>
      <div class="flex-grow-1 min-width-0">
        <div class="d-flex align-center ga-1 mb-1">
          <p class="text-body-2 text-medium-emphasis mb-0">{{ label }}</p>
          <v-tooltip v-if="hint" location="top">
            <template #activator="{ props }">
              <v-icon v-bind="props" icon="tabler:info-circle" size="14" />
            </template>
            {{ hint }}
          </v-tooltip>
        </div>
        <AppSkeletonTransition>
          <v-skeleton-loader v-if="loading" key="dashboard-stat-skeleton" type="text" width="48" />
          <p v-else key="dashboard-stat-content" class="text-h5 font-weight-bold mb-0">{{ value }}</p>
        </AppSkeletonTransition>
      </div>
      <v-icon v-if="to" icon="tabler:chevron-right" size="18" color="medium-emphasis" />
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
  hint?: string
  to?: string
}>()
</script>

<style scoped>
.dashboard-stat-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  height: 100%;
}

.dashboard-stat-card--link:hover {
  border-color: rgba(var(--v-theme-primary), 0.35);
}
</style>
