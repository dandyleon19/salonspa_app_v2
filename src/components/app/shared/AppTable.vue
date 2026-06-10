<template>
    <div class="app-table-wrapper">
        <v-card class="app-table__hero mb-4" rounded="xl" elevation="0">
            <v-card-text class="pa-5 pa-md-6">
                <div class="d-flex align-center justify-space-between flex-wrap ga-4">
                    <div>
                        <p v-if="subtitle" class="text-overline text-medium-emphasis mb-1">
                            {{ subtitle }}
                        </p>
                        <h1 class="text-h5 text-md-h4 font-weight-bold mb-2">
                            {{ title }}
                        </h1>
                        <v-chip
                            size="small"
                            color="primary"
                            variant="tonal"
                            prepend-icon="mdi-format-list-bulleted"
                        >
                            {{ totalItems }} registro{{ totalItems === 1 ? "" : "s" }}
                        </v-chip>
                    </div>

                    <div class="d-flex ga-2">
                        <v-btn
                            class="app-table__btn-export"
                            color="primary"
                            variant="tonal"
                            size="large"
                            rounded="lg"
                            @click="$emit('handleExportButton')"
                        >
                            <v-icon start>mdi-download</v-icon>
                            Exportar
                        </v-btn>
                        <v-btn
                            class="app-table__btn-primary"
                            color="primary"
                            variant="flat"
                            size="large"
                            rounded="lg"
                            @click="$emit('handleCreateButton')"
                        >
                            <v-icon start>mdi-plus</v-icon>
                            Nuevo
                        </v-btn>
                    </div>
                </div>
            </v-card-text>
        </v-card>

        <v-card class="app-table" rounded="xl" elevation="0">
            <div class="app-table__toolbar px-4 py-4">
                <div class="d-flex align-center flex-wrap ga-2">
                    <v-text-field
                        v-model="search"
                        placeholder="Buscar..."
                        prepend-inner-icon="mdi-magnify"
                        hide-details
                        density="compact"
                        variant="outlined"
                        rounded="lg"
                        clearable
                        class="app-table__search"
                    />

                    <template v-for="filter in filters" :key="filter.key">
                        <v-select
                            v-if="filter.type === 'select'"
                            v-model="selectedFilters[filter.key]"
                            :label="filter.label"
                            :items="filter.items"
                            hide-details
                            density="compact"
                            variant="outlined"
                            rounded="lg"
                            clearable
                            class="app-table__filter"
                        />

                        <v-select
                            v-else-if="filter.type === 'multiselect'"
                            v-model="selectedFilters[filter.key]"
                            :label="filter.label"
                            :items="filter.items"
                            multiple
                            clearable
                            hide-details
                            density="compact"
                            variant="outlined"
                            rounded="lg"
                            class="app-table__filter"
                        />
                    </template>
                </div>
            </div>

            <v-divider />

            <v-data-table-server
                class="app-table__data"
                :headers="tableHeaders"
                :items="items"
                :items-length="totalItems"
                :loading="loading"
                :search="search"
                :items-per-page="props.itemsPerPage"
                :page="props.page"
                hover
                @update:options="handleOptionsUpdate"
            >
                <template v-if="!$slots['item.id']" v-slot:[`item.id`]="{ index }">
                    {{ rowNumber(index) }}
                </template>

                <template
                    v-for="(_, slotName) in customColumnSlots"
                    :key="slotName"
                    v-slot:[slotName]="slotData"
                >
                    <slot :name="slotName" v-bind="slotData" />
                </template>

                <template v-if="!$slots['item.actions']" v-slot:[`item.actions`]="{ item }">
                    <div class="app-table__actions">
                        <v-tooltip
                            v-for="rowOption in rowOptions"
                            :key="rowOption.action"
                            :text="rowOption.title || getActionLabel(rowOption.action)"
                            location="top"
                        >
                            <template #activator="{ props: tooltipProps }">
                                <button
                                    v-bind="tooltipProps"
                                    type="button"
                                    :class="[
                                        'app-table__action',
                                        `app-table__action--${rowOption.color}`,
                                    ]"
                                    @click="$emit('handleRowActionButton', item, rowOption.action)"
                                >
                                    <v-icon size="18">{{ rowOption.icon }}</v-icon>
                                </button>
                            </template>
                        </v-tooltip>
                    </div>
                </template>
                <template v-else v-slot:[`item.actions`]="slotData">
                    <slot name="item.actions" v-bind="slotData" />
                </template>

                <template #loading>
                    <div class="app-table__state py-6">
                        <v-progress-circular indeterminate color="primary" size="28" width="2" />
                    </div>
                </template>

                <template #no-data>
                    <div class="app-table__state py-8">
                        <v-icon size="28" color="disabled" class="mb-2">mdi-inbox-outline</v-icon>
                        <p class="text-body-2 text-medium-emphasis mb-0">
                            No se encontraron registros
                        </p>
                    </div>
                </template>
            </v-data-table-server>
        </v-card>
    </div>
</template>

<script setup lang="ts">
import { ref, useSlots, computed, watch } from "vue";
import type { TableHeader, FilterOption, TableRowOption } from "~/interfaces/tableInterfaces";

const slots = useSlots();

const customColumnSlots = computed(() =>
    Object.keys(slots).filter(
        (name) =>
            name.startsWith("item.") &&
            name !== "item.actions" &&
            name !== "item.id"
    )
);

const tableHeaders = computed(() =>
    props.headers.map((header) => {
        if (header.key === "id") {
            return {
                ...header,
                title: "N°",
                sortable: false,
                width: 64,
                minWidth: 64,
                maxWidth: 72,
            }
        }

        if (header.key === "actions") {
            return {
                ...header,
                sortable: false,
                width: 128,
                minWidth: 128,
                maxWidth: 148,
            }
        }

        return header
    })
);

const rowNumber = (index: number) =>
    (props.page - 1) * props.itemsPerPage + index + 1;

const props = withDefaults(
    defineProps<{
        title: string;
        subtitle?: string;
        headers: TableHeader[];
        rowOptions: TableRowOption[];
        items: any[];
        totalItems: number;
        filters?: FilterOption[];
        page: number;
        itemsPerPage: number;
        loading?: boolean;
    }>(),
    {
        subtitle: "",
        filters: () => [],
        loading: false,
    }
);

const emit = defineEmits<{
    (e: "handleCreateButton"): void
    (e: "handleExportButton"): void
    (e: "handleRowActionButton", item: any, action: string): void
    (e: "handleUpdateFilters", values: Record<string, any>): void,
    (e: "update:pagination", value: {
      page: number,
      itemsPerPage: number
    }): void
}>()

const search = ref("");
const selectedFilters = ref<Record<string, any>>({})

const actionLabels: Record<string, string> = {
    update: "Editar",
    delete: "Eliminar",
    branches: "Sucursales",
    clinicalRecords: "Historial clínico",
    changePassword: "Cambiar contraseña",
}

const getActionLabel = (action: string) => actionLabels[action] ?? action

const handleOptionsUpdate = (options: any) => {
  emit("update:pagination", {
    page: options.page,
    itemsPerPage: options.itemsPerPage,
  })
}

watch(selectedFilters, (val) => {
    emit("handleUpdateFilters", val)
}, { deep: true })
</script>

<style scoped>
.app-table-wrapper {
    width: 100%;
    max-width: 1280px;
    margin-inline: auto;
    min-width: 0;
}

.app-table__hero {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    background: linear-gradient(
        135deg,
        rgba(var(--v-theme-primary), 0.08) 0%,
        rgba(var(--v-theme-surface), 1) 55%
    );
}

.app-table__btn-primary {
    color: #fff !important;
    text-transform: none;
    letter-spacing: normal;
}

.app-table__btn-export {
    text-transform: none;
    letter-spacing: normal;
    color: rgb(var(--v-theme-primary)) !important;
    background: rgba(var(--v-theme-primary), 0.14) !important;
    border: 1px solid rgba(var(--v-theme-primary), 0.28) !important;
}

.app-table__btn-export :deep(.v-btn__content),
.app-table__btn-export :deep(.v-icon) {
    color: rgb(var(--v-theme-primary)) !important;
}

.app-table {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    overflow: hidden;
    background: rgb(var(--v-theme-surface));
    width: 100%;
}

.app-table__data {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.app-table__data :deep(.v-table) {
    width: 100%;
    min-width: min(100%, 720px);
    table-layout: auto;
}

.app-table__data :deep(.v-data-table__tbody td:not(:last-child)),
.app-table__data :deep(.v-data-table__thead th:not(:last-child)) {
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.app-table__data :deep(.v-data-table__tbody td:first-child),
.app-table__data :deep(.v-data-table__thead th:first-child) {
    max-width: 72px;
    width: 64px;
}

.app-table__data :deep(.v-data-table__tbody td:last-child),
.app-table__data :deep(.v-data-table__thead th:last-child) {
    max-width: none;
    white-space: nowrap;
}

.app-table__search {
    min-width: 220px;
    max-width: 280px;
    flex: 1 1 220px;
}

.app-table__filter {
    min-width: 160px;
    max-width: 220px;
    flex: 1 1 160px;
}

.app-table__actions {
    display: flex;
    align-items: center;
    gap: 2px;
    opacity: 0.55;
    transition: opacity 0.15s ease;
}

.app-table__data :deep(tr:hover) .app-table__actions {
    opacity: 1;
}

.app-table__action {
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

.app-table__action:hover {
    background: rgba(var(--v-theme-on-surface), 0.06);
    color: rgba(var(--v-theme-on-surface), 0.87);
}

.app-table__action--primary:hover {
    background: rgba(var(--v-theme-primary), 0.1);
    color: rgb(var(--v-theme-primary));
}

.app-table__action--error:hover {
    background: rgba(var(--v-theme-error), 0.1);
    color: rgb(var(--v-theme-error));
}

.app-table__state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.app-table__data :deep(.v-data-table__thead th) {
    background: transparent !important;
    color: rgba(var(--v-theme-on-surface), 0.55) !important;
    font-size: 0.72rem !important;
    font-weight: 600 !important;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
    height: 44px !important;
}

.app-table__data :deep(.v-data-table__tbody td) {
    border-bottom: 1px solid rgba(var(--v-border-color), 0.45) !important;
    padding-top: 10px !important;
    padding-bottom: 10px !important;
    font-size: 0.875rem;
    color: rgba(var(--v-theme-on-surface), 0.87);
}

.app-table__data :deep(.v-data-table__tbody tr:hover) {
    background: rgba(var(--v-theme-on-surface), 0.03) !important;
}

.app-table__data :deep(.v-data-table-footer) {
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    padding-inline: 16px;
    font-size: 0.8125rem;
}

.app-table__data :deep(.v-pagination .v-btn) {
    color: rgba(var(--v-theme-on-surface), 0.7) !important;
}

.app-table__data :deep(.v-pagination__item--is-active .v-btn) {
    background: rgba(var(--v-theme-primary), 0.12) !important;
    color: rgb(var(--v-theme-primary)) !important;
}

@media (max-width: 960px) {
    .app-table__hero :deep(.v-card-text) {
        padding: 1.25rem !important;
    }

    .app-table__toolbar {
        padding-inline: 1rem !important;
    }

    .app-table__search,
    .app-table__filter {
        min-width: 100%;
        max-width: 100%;
        flex: 1 1 100%;
    }
}

@media (max-width: 600px) {
    .app-table__data :deep(.v-data-table-footer) {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
        padding-block: 12px !important;
    }

    .app-table__data :deep(.v-data-table-footer__info) {
        justify-content: center;
        margin-inline: 0 !important;
    }

    .app-table__data :deep(.v-data-table-footer__pagination) {
        justify-content: center;
    }
}
</style>
