<template>
  <v-card class="app-collapsible-toolbar-card" rounded="xl" elevation="0">
    <div v-if="$slots.header" class="app-collapsible-toolbar-card__header">
      <slot name="header" />
    </div>

    <div
      class="app-collapsible-toolbar-card__toggle-bar"
      :class="{
        'app-collapsible-toolbar-card__toggle-bar--with-header': $slots.header,
      }"
    >
      <button
        type="button"
        class="app-collapsible-toolbar-card__toggle"
        :aria-expanded="expanded"
        @click="toggleExpanded"
      >
        <v-icon size="20">
          {{ expanded ? "mdi-chevron-up" : "mdi-chevron-down" }}
        </v-icon>
        <span class="app-collapsible-toolbar-card__toggle-label">{{ label }}</span>
        <span v-if="!expanded" class="app-collapsible-toolbar-card__toggle-hint text-medium-emphasis">
          {{ collapsedHint }}
        </span>
      </button>

      <div v-if="$slots['toggle-actions']" class="app-collapsible-toolbar-card__toggle-actions">
        <slot name="toggle-actions" />
      </div>
    </div>

    <v-expand-transition>
      <div v-show="expanded" class="app-collapsible-toolbar-card__toolbar">
        <div class="app-collapsible-toolbar-card__toolbar-inner">
          <slot />
        </div>
      </div>
    </v-expand-transition>

    <div v-if="$slots.body" class="app-collapsible-toolbar-card__body">
      <slot name="body" />
    </div>
  </v-card>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    expanded?: boolean
    label?: string
    collapsedHint?: string
  }>(),
  {
    expanded: true,
    label: "Filtros",
    collapsedHint: "Contraído",
  }
)

const emit = defineEmits<{
  (e: "update:expanded", value: boolean): void
}>()

const expanded = computed({
  get: () => props.expanded,
  set: (value) => emit("update:expanded", value),
})

const toggleExpanded = () => {
  expanded.value = !expanded.value
}
</script>

<style scoped>
.app-collapsible-toolbar-card {
  border: 1px solid rgba(var(--v-border-color), 0.55);
  overflow: hidden;
  background: rgb(var(--v-theme-background));
  width: 100%;
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 12px 32px rgba(15, 23, 42, 0.06);
}

.app-collapsible-toolbar-card__header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.45);
  background:
    linear-gradient(
      180deg,
      rgba(var(--v-theme-primary), 0.045) 0%,
      rgba(var(--v-theme-background), 1) 100%
    );
}

.app-collapsible-toolbar-card__toggle-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.625rem 1.25rem;
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-bottom: 1px solid rgba(var(--v-border-color), 0.45);
}

.app-collapsible-toolbar-card__toggle-bar--with-header {
  border-top: none;
}

.app-collapsible-toolbar-card__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  margin: -0.375rem -0.5rem;
  border: 0;
  border-radius: 0.75rem;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.82);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.app-collapsible-toolbar-card__toggle:hover {
  background: rgba(var(--v-theme-on-surface), 0.04);
  color: rgb(var(--v-theme-primary));
}

.app-collapsible-toolbar-card__toggle-label {
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.app-collapsible-toolbar-card__toggle-hint {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
}

.app-collapsible-toolbar-card__toggle-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.app-collapsible-toolbar-card__toolbar {
  padding: 1rem 1.25rem;
  background:
    linear-gradient(
      180deg,
      rgba(var(--v-theme-primary), 0.045) 0%,
      rgba(var(--v-theme-background), 1) 100%
    );
  border-bottom: 1px solid rgba(var(--v-border-color), 0.45);
}

.app-collapsible-toolbar-card__toolbar-inner {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.app-collapsible-toolbar-card__toolbar-inner :deep(.app-table__filter),
.app-collapsible-toolbar-card__toolbar-inner :deep(.app-table__search),
.app-collapsible-toolbar-card__toolbar-inner :deep(.app-collapsible-toolbar-card__filter) {
  min-width: 170px;
  max-width: 220px;
  flex: 1 1 170px;
}

.app-collapsible-toolbar-card__toolbar-inner :deep(.v-field) {
  background: rgba(var(--v-theme-surface), 0.65) !important;
  box-shadow: inset 0 0 0 1px rgba(var(--v-border-color), 0.55);
  transition: box-shadow 0.2s ease, background-color 0.2s ease;
}

.app-collapsible-toolbar-card__toolbar-inner :deep(.v-field--focused) {
  box-shadow:
    inset 0 0 0 1px rgba(var(--v-theme-primary), 0.45),
    0 0 0 3px rgba(var(--v-theme-primary), 0.1);
}

.app-collapsible-toolbar-card__body {
  position: relative;
  min-width: 0;
}

@media (max-width: 960px) {
  .app-collapsible-toolbar-card__header,
  .app-collapsible-toolbar-card__toolbar,
  .app-collapsible-toolbar-card__toggle-bar {
    padding-inline: 1rem;
  }

  .app-collapsible-toolbar-card__toolbar-inner :deep(.app-table__filter),
  .app-collapsible-toolbar-card__toolbar-inner :deep(.app-table__search),
  .app-collapsible-toolbar-card__toolbar-inner :deep(.app-collapsible-toolbar-card__filter) {
    min-width: 100%;
    max-width: 100%;
    flex: 1 1 100%;
  }
}
</style>
