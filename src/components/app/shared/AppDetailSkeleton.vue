<template>
  <div class="app-detail-skeleton" :aria-busy="true">
    <v-skeleton-loader type="chip" width="128" class="mb-3" />
    <v-skeleton-loader type="heading" width="62%" class="mb-2" />
    <v-skeleton-loader type="text" width="48%" class="mb-5" />

    <v-row dense class="mb-4">
      <v-col v-for="card in metaCards" :key="`meta-${card}`" cols="12" sm="6">
        <v-skeleton-loader type="image" height="84" />
      </v-col>
    </v-row>

    <div v-for="block in textBlocks" :key="`block-${block}`" class="mb-4">
      <v-skeleton-loader type="subtitle" width="34%" class="mb-2" />
      <v-skeleton-loader type="paragraph" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    metaCards?: number
    textBlocks?: number
  }>(),
  {
    metaCards: 2,
    textBlocks: 3,
  }
)
</script>

<style scoped>
.app-detail-skeleton :deep(.v-skeleton-loader__bone) {
  border-radius: 0.75rem;
}
</style>
