<template>
  <div class="app-list-skeleton" :aria-busy="true">
    <v-skeleton-loader
      v-if="showSearch"
      type="image"
      height="40"
      class="app-list-skeleton__search mb-3"
    />

    <div class="d-flex flex-column ga-2">
      <v-card
        v-for="item in items"
        :key="`item-${item}`"
        class="app-list-skeleton__item pa-3"
        variant="flat"
        rounded="lg"
      >
        <v-skeleton-loader type="list-item-three-line" />
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    items?: number
    showSearch?: boolean
  }>(),
  {
    items: 4,
    showSearch: true,
  }
)
</script>

<style scoped>
.app-list-skeleton__item {
  border: 1px solid rgba(var(--v-border-color), 0.45);
  background: rgb(var(--v-theme-background));
}

.app-list-skeleton :deep(.v-skeleton-loader__bone) {
  border-radius: 0.625rem;
}
</style>
