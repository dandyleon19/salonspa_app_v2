<template>
  <div class="app-form-section">
    <div v-if="title" class="app-form-section__header mb-3">
      <p class="text-subtitle-2 font-weight-bold mb-0">{{ title }}</p>
      <p v-if="subtitle" class="text-caption text-medium-emphasis mb-0 mt-1">
        {{ subtitle }}
      </p>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
}>()
</script>

<style scoped>
.app-form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.app-form-section:last-child {
  margin-bottom: 0;
}

.app-form-section__header {
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.55);
}
</style>
