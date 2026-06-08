<template>
  <div class="drawer-item-list">
    <v-card
      v-if="formMode"
      class="drawer-item-list__form mb-4"
      rounded="lg"
      elevation="0"
    >
      <v-card-title class="d-flex align-center justify-space-between py-3 px-4">
        <span class="text-subtitle-1 font-weight-bold">{{ formTitle }}</span>
        <v-btn
          icon
          variant="text"
          size="small"
          :disabled="loading"
          @click="$emit('cancel-form')"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-4">
        <v-progress-linear
          v-if="loading"
          indeterminate
          color="primary"
          class="mb-3"
        />
        <slot name="form" />
      </v-card-text>
    </v-card>

    <template v-else>
      <v-btn
        class="drawer-item-list__create-btn mb-4"
        color="primary"
        variant="flat"
        rounded="lg"
        block
        @click="$emit('create')"
      >
        <v-icon start>mdi-plus</v-icon>
        {{ createLabel }}
      </v-btn>
    </template>

    <v-text-field
      :model-value="searchTerm"
      :placeholder="searchPlaceholder"
      density="compact"
      variant="outlined"
      rounded="lg"
      hide-details
      clearable
      prepend-inner-icon="mdi-magnify"
      class="mb-3"
      @update:model-value="$emit('update:searchTerm', $event)"
    />

    <div class="d-flex align-center justify-space-between mb-3">
      <v-chip size="small" color="primary" variant="tonal">
        {{ filteredCount }} {{ itemLabel }}{{ filteredCount === 1 ? "" : "s" }}
      </v-chip>
      <span v-if="totalCount !== filteredCount" class="text-caption text-medium-emphasis">
        de {{ totalCount }} en total
      </span>
    </div>

    <div v-if="!filteredCount" class="drawer-item-list__empty">
      <v-avatar size="52" color="primary" variant="tonal" class="mb-3">
        <v-icon size="26">{{ emptyIcon }}</v-icon>
      </v-avatar>
      <p class="text-body-2 font-weight-medium mb-1">
        {{ totalCount ? noResultsLabel : emptyLabel }}
      </p>
      <p v-if="!totalCount" class="text-caption text-medium-emphasis mb-0">
        {{ emptyHint }}
      </p>
    </div>

    <div v-else class="d-flex flex-column ga-2">
      <v-card
        v-for="item in items"
        :key="getItemKey(item)"
        class="drawer-item-list__item"
        rounded="lg"
        elevation="0"
      >
        <v-card-text class="pa-3">
          <div class="d-flex justify-space-between align-start ga-3">
            <div class="flex-grow-1 min-width-0">
              <slot name="item" :item="item" />
            </div>

            <div v-if="!formMode" class="drawer-item-list__actions">
              <v-tooltip text="Editar" location="top">
                <template #activator="{ props: tooltipProps }">
                  <button
                    v-bind="tooltipProps"
                    type="button"
                    class="drawer-item-list__action drawer-item-list__action--edit"
                    @click="$emit('edit', item)"
                  >
                    <v-icon size="18">mdi-pencil-outline</v-icon>
                  </button>
                </template>
              </v-tooltip>
              <v-tooltip text="Eliminar" location="top">
                <template #activator="{ props: tooltipProps }">
                  <button
                    v-bind="tooltipProps"
                    type="button"
                    class="drawer-item-list__action drawer-item-list__action--delete"
                    @click="$emit('delete', item)"
                  >
                    <v-icon size="18">mdi-delete-outline</v-icon>
                  </button>
                </template>
              </v-tooltip>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  formMode: "create" | "edit" | null
  formTitle: string
  createLabel: string
  searchTerm: string
  searchPlaceholder: string
  items: any[]
  filteredCount: number
  totalCount: number
  itemLabel: string
  emptyLabel: string
  noResultsLabel: string
  emptyHint?: string
  emptyIcon?: string
  loading?: boolean
  itemKey?: string
}>()

defineEmits<{
  (e: "create"): void
  (e: "edit", item: any): void
  (e: "delete", item: any): void
  (e: "cancel-form"): void
  (e: "update:searchTerm", value: string): void
}>()

const getItemKey = (item: any) => item?.id ?? item?.name
</script>

<style scoped>
.drawer-item-list__form,
.drawer-item-list__item {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.drawer-item-list__create-btn {
  color: #fff !important;
  text-transform: none;
  letter-spacing: normal;
}

.drawer-item-list__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2.5rem 1rem;
  border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
}

.drawer-item-list__item {
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.drawer-item-list__item:hover {
  border-color: rgba(var(--v-theme-primary), 0.35);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
}

.drawer-item-list__actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.drawer-item-list__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.55);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.drawer-item-list__action--edit:hover {
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

.drawer-item-list__action--delete:hover {
  background: rgba(var(--v-theme-error), 0.1);
  color: rgb(var(--v-theme-error));
}
</style>
