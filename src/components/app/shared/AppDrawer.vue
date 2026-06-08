<template>
  <v-navigation-drawer
    v-model="model"
    :location="location"
    :temporary="temporary"
    :width="computedWidth"
    class="pa-5"
  >
    <!-- LOADING OVERLAY -->
    <v-overlay
      v-if="loading"
      contained
      :model-value="loading"
      class="align-center justify-center"
      persistent
      scrim="white"
      opacity="0.8"
    >
      <v-progress-circular indeterminate size="48" width="4" />
    </v-overlay>
    <!-- HEADER -->
    <div class="d-flex justify-space-between align-center mb-4">
      <h2 class="text-h6 font-weight-bold">{{ title }}</h2>
      <v-btn icon variant="text" @click="close">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>

    <!-- CONTENT -->
    <div class="drawer-content" v-if="model">
      <slot />
    </div>

    <!-- FOOTER -->
    <div v-if="$slots.footer" class="mt-4 pt-2 border-t">
      <slot name="footer" />
    </div>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  modelValue: boolean;
  title?: string;
  size?: "small" | "medium" | "large" | "xlarge";
  location?: "start" | "end" | "left" | "right";
  temporary?: boolean;
  loading?: boolean;
}>();

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