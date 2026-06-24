<template>
  <v-navigation-drawer
    v-model="model"
    :location="location"
    :temporary="temporary"
    :width="computedWidth"
    class="pa-5"
  >
    <v-overlay
      v-if="loading"
      contained
      :model-value="loading"
      class="align-center justify-center"
      persistent
      scrim="white"
      opacity="0.72"
    >
      <v-progress-circular indeterminate size="40" width="3" color="primary" />
    </v-overlay>

    <div class="d-flex justify-space-between align-center mb-4">
      <h2 class="text-h6 font-weight-bold">{{ title }}</h2>
      <v-btn icon variant="text" @click="close">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>

    <div v-if="model" class="drawer-content">
      <AppSkeletonTransition>
        <AppFormSkeleton
          v-if="contentLoading"
          key="drawer-content-skeleton"
          :sections="skeletonSections"
          :fields-per-section="skeletonFields"
          :show-button="skeletonShowButton"
        />
        <slot v-else key="drawer-content-slot" />
      </AppSkeletonTransition>
    </div>

    <div v-if="$slots.footer" class="mt-4 pt-2 border-t">
      <slot name="footer" />
    </div>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    size?: "small" | "medium" | "large" | "xlarge";
    location?: "start" | "end" | "left" | "right";
    temporary?: boolean;
    loading?: boolean;
    contentLoading?: boolean;
    skeletonSections?: number;
    skeletonFields?: number;
    skeletonShowButton?: boolean;
  }>(),
  {
    skeletonSections: 2,
    skeletonFields: 4,
    skeletonShowButton: true,
  }
);

const emit = defineEmits(["update:modelValue", "close"]);

const model = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const computedWidth = computed(() => {
  switch (props.size) {
    case "small":
      return 300;
    case "medium":
      return 480;
    case "large":
      return 720;
    case "xlarge":
      return "9vw";
    default:
      return 400;
  }
});

const close = () => {
  emit("update:modelValue", false);
  emit("close");
};
</script>

<style scoped>
.drawer-content {
  min-height: calc(100vh - 150px);
  overflow-y: auto;
}
</style>
