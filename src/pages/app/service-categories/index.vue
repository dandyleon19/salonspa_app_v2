<template>
  <AppTable
      title="Categorías de Servicio"
      subtitle="Lista de Categorías de Servicio registrados"
      :headers="headers"
      :rowOptions="rowOptions"
      :filters="tableFilters"
      :items="serviceCategoriesList"
      :loading="loadingServiceCategoriesList"
      :page="currentPage"
      :items-per-page="itemsPerPage"
      :total-items="totalItems"
      @update:pagination="handlePagination"
      @handle-create-button="handleCreateButton"
      @handle-row-action-button="handleRowActionButton"
  />

  <AppDrawer
      v-model="openServiceCategoryDrawer"
      title="Gestión de Categorías de Servicio"
      :loading="loading"
      size="large"
      location="end"
      :temporary="true"
      @close="closeServiceCategoryDrawer"
  >
    <ServiceCategoryForm
        :data-modal-form="dataModalForm"
        @create="handleCreateServiceCategory"
        @update="handleUpdateServiceCategory"
    />
  </AppDrawer>

  <AppDrawer
      v-model="openServiceDrawer"
      title="Gestión de Servicios"
      :loading="loading"
      size="large"
      location="end"
      :temporary="true"
      @close="closeServiceCategoryDrawer"
  >
    <ManageServices
        :data-modal-form="dataModalForm"
    />
  </AppDrawer>

  <ConfirmationModal
      v-model="showDeleteDialog"
      title="Eliminar usuario"
      message="¿Deseas eliminar esta categoría de servicio? Esta acción no se puede deshacer."
      :require-text="false"
      @confirm="handleDeleteServiceCategory"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { FilterOption, TableHeader, TableRowOption } from "~/interfaces/tableInterfaces";
import type { ServiceCategory, serviceCategoryDataModalForm } from "~/interfaces/serviceCategoryInterfaces";
import { useServiceCategoriesStore } from "~/store";
import ManageServices from "~/components/app/service-categories/ManageServices.vue";

definePageMeta({
  layout: 'app'
})

// Composables
const serviceCategoriesStore = useServiceCategoriesStore();

// Variables
const loading = ref<boolean>(false);
const openServiceCategoryDrawer = ref<boolean>(false);
const openServiceDrawer = ref<boolean>(false)
const showDeleteDialog = ref<boolean>(false)
const serviceCategoryToRemove = ref<ServiceCategory>()
const currentPage = ref(1)
const itemsPerPage = ref(10)

const headers = ref<Array<TableHeader>>([
  { title: "ID", key: "id" },
  { title: "Nombre", key: "name" },
  { title: "Descripción", key: "description" },
  { title: "Descripción Larga", key: "longDescription" },
  { title: "Acciones", key: "actions", sortable: false },
]);

const rowOptions = ref<Array<TableRowOption>>([
  {
    action: 'update',
    color: 'primary',
    icon: 'mdi-pencil',
  },
  {
    action: 'services',
    color: 'primary',
    icon: 'mdi-source-branch',
  },
  {
    action: 'delete',
    color: 'error',
    icon: 'mdi-delete',
  },
]);

const tableFilters = ref<FilterOption[]>([]);

const dataModalForm = ref<serviceCategoryDataModalForm>({
  action: "create",
});

// Computed
const serviceCategoriesList = computed(() => {
  return serviceCategoriesStore.data?.content ?? [];
});

const totalItems = computed(() => {
  return serviceCategoriesStore.data?.totalElements ?? 0
})

const loadingServiceCategoriesList = computed(() => {
  return serviceCategoriesStore.loading;
});

// Methods
const handleCreateButton = (): void => {
  dataModalForm.value.action = 'create'
  openServiceCategoryDrawer.value = true;
};

const handleRowActionButton = (serviceCategory: ServiceCategory, action: string): void => {
  console.log("apply Action Button:", action);
  switch (action) {
    case 'update':
      dataModalForm.value.action = action
      dataModalForm.value.rowId = serviceCategory.id
      openServiceCategoryDrawer.value = true;
      break;

    case 'services':
      dataModalForm.value.action = action
      dataModalForm.value.rowId = serviceCategory.id
      dataModalForm.value.services = serviceCategory.services
      openServiceDrawer.value = true
      break;

    case 'delete':
      showDeleteDialog.value = true
      serviceCategoryToRemove.value = serviceCategory
      break;

    default:
      break;
  }
};

const closeServiceCategoryDrawer = () => {
  openServiceCategoryDrawer.value = false;
  openServiceDrawer.value = false;
  serviceCategoriesStore.fetchServiceCategories(
    currentPage.value - 1,
    itemsPerPage.value
  );
};

const { notifyCreated, notifyUpdated, notifyDeleted, notifyError } = useApiNotification()

const handleCreateServiceCategory = async (serviceCategory: ServiceCategory) => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api("/api/service-categories", {
      method: "POST",
      body: { ...serviceCategory },
    });
    notifyCreated("categoría de servicio");
    closeServiceCategoryDrawer();
  } catch (err) {
    notifyError(err, "crear la categoría de servicio");
  } finally {
    loading.value = false;
  }
};

const handleUpdateServiceCategory = async (serviceCategory: ServiceCategory) => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api(`/api/service-categories/${serviceCategory.id}`, {
      method: "PUT",
      body: {
        name: serviceCategory.name,
        description: serviceCategory.description,
        longDescription: serviceCategory.longDescription,
      },
    });
    notifyUpdated("categoría de servicio");
    closeServiceCategoryDrawer();
  } catch (err) {
    notifyError(err, "actualizar la categoría de servicio");
  } finally {
    loading.value = false;
  }
};

const handleDeleteServiceCategory = async () => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api(`/api/service-categories/${serviceCategoryToRemove.value?.id}`, {
      method: "DELETE",
    });
    notifyDeleted("categoría de servicio");
    await serviceCategoriesStore.fetchServiceCategories(
      currentPage.value - 1,
      itemsPerPage.value
    );
  } catch (err) {
    notifyError(err, "eliminar la categoría de servicio");
  } finally {
    loading.value = false;
  }
}

const handlePagination = async ({
  page,
  itemsPerPage: newItemsPerPage,
}: {
  page: number
  itemsPerPage: number
}) => {
  currentPage.value = page
  itemsPerPage.value = newItemsPerPage

  await serviceCategoriesStore.fetchServiceCategories(
    page - 1,
    newItemsPerPage
  )
}

// Mounted
onMounted(() => {
  serviceCategoriesStore.fetchServiceCategories(0, itemsPerPage.value);
});
</script>