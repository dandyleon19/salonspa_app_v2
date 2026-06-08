<template>
    <v-card class="pa-4 rounded-lg shadow-md">
        <!-- HEADER-->
        <div class="d-flex justify-space-between align-center mb-4">
            <div>
                <h2 class="text-h6 font-weight-bold">{{ title }}</h2>
                <div v-if="subtitle" class="text-body-2 text-medium-emphasis">{{ subtitle }}</div>
            </div>

            <!-- BLOBAL BUTTONS-->
            <div class="d-flex gap-2">
                <v-btn color="primary" @click="$emit('handleCreateButton')">
                    <v-icon start>mdi-plus</v-icon> Nuevo
                </v-btn>
                <v-btn color="primary" variant="outlined" @click="$emit('handleExportButton')">
                    <v-icon start>mdi-download</v-icon> Exportar
                </v-btn>
            </div>
        </div>

        <div class="d-flex align-center gap-4 mb-4 flex-wrap">
            <v-text-field v-model="search" label="Buscar..." prepend-inner-icon="mdi-magnify" hide-details dense
                clearable />

            <!-- FILTERS -->
            <template v-for="filter in filters" :key="filter.key">
                <v-select v-if="filter.type === 'select'" v-model="selectedFilters[filter.key]" :label="filter.label"
                    :items="filter.items" hide-details dense clearable />

                <v-select v-else-if="filter.type === 'multiselect'" v-model="selectedFilters[filter.key]"
                    :label="filter.label" :items="filter.items" multiple clearable hide-details dense />
            </template>
        </div>

        <!-- TABLE -->
        <v-data-table-server :headers="headers" :items="items" :items-length="totalItems" :loading="loading"
            :search="search" :items-per-page="props.itemsPerPage" :page="props.page" @update:options="handleOptionsUpdate">
            <!-- CUSTOM COLUMNS -->
            <template #item.actions="{ item }">
                <div class="d-flex align-center ga-1">
                    <v-btn v-for="rowOption in rowOptions" :key="rowOption.action" icon size="small" :color="rowOption.color" @click="$emit('handleRowActionButton', item, rowOption.action)">
                        <v-icon>{{ rowOption.icon }}</v-icon>
                    </v-btn>
                </div>
            </template>

            <!-- NO DATA -->
            <template #no-data>
                <v-alert type="info" variant="tonal">
                    No se encontraron registros
                </v-alert>
            </template>
        </v-data-table-server>
    </v-card>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { TableHeader, FilterOption, TableRowOption } from "~/interfaces/tableInterfaces";

// Props
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

// Emits
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

// State
const search = ref("");
const page = ref(1);
const itemsPerPage = ref(10);
const selectedFilters = ref<Record<string, any>>({})

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
