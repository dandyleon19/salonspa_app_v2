<template>
  <AppTable
      title="Sucursales"
      subtitle="Lista de sucursales registradas"
      :headers="headers"
      :rowOptions="rowOptions"
      :filters="tableFilters"
      :items="branchesList"
      :loading="loadingBranchesList"
      :page="currentPage"
      :items-per-page="itemsPerPage"
      :total-items="totalItems"
      server-search
      @update:pagination="handlePagination"
      @handle-create-button="handleCreateButton"
      @handle-row-action-button="handleRowActionButton"
      @handle-update-search="handleApplySearch"
  />

  <AppDrawer
      v-model="openBranchDrawer"
      title="Gestión de Sucursales"
      :loading="loading"
      size="large"
      location="end"
      :temporary="true"
      @close="closeBranchDrawer"
  >
    <BranchForm
        :data-modal-form="dataModalForm"
        @create="handleCreateBranch"
        @update="handleUpdateBranch"
    />
  </AppDrawer>

  <ConfirmationModal
      v-model="showDeleteDialog"
      title="Eliminar usuario"
      message="¿Deseas eliminar este branche? Esta acción no se puede deshacer."
      :require-text="false"
      @confirm="handleDeleteBranch"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { FilterOption, TableHeader, TableRowOption } from "~/interfaces/tableInterfaces";
import type { Branch, branchDataModalForm } from "~/interfaces/salonInterfaces";
import { useBranchesStore } from "~/store/modules/branch";
import {
  areTableSearchEqual,
  normalizeTableSearch,
} from "~/helpers/tableSearchHelpers";

definePageMeta({
  layout: 'app'
})

// Composables
const branchesStore = useBranchesStore();

// Variables
const loading = ref<boolean>(false);
const openBranchDrawer = ref<boolean>(false);
const showDeleteDialog = ref<boolean>(false)
const branchToRemove = ref<Branch>()
const currentPage = ref(1)
const itemsPerPage = ref(10)
const activeSearch = ref("")

const headers = ref<Array<TableHeader>>([
  { title: "ID", key: "id" },
  { title: "Nombre", key: "name" },
  { title: "Dirección", key: "address" },
  { title: "Ciudad", key: "city" },
  { title: "Acciones", key: "actions", sortable: false },
]);

const rowOptions = ref<Array<TableRowOption>>([
  {
    action: 'update',
    color: 'primary',
    icon: 'mdi-pencil',
  },
  {
    action: 'delete',
    color: 'error',
    icon: 'mdi-delete',
  },
]);

const tableFilters = ref<FilterOption[]>([]);

const dataModalForm = ref<branchDataModalForm>({
  action: "create",
});

// Computed
const branchesList = computed(() => {
  return branchesStore.data?.content ?? [];
});

const totalItems = computed(() => {
  return branchesStore.data?.totalElements ?? 0
})

const loadingBranchesList = computed(() => {
  return branchesStore.loading;
});

const fetchBranches = async () => {
  await branchesStore.fetchBranches(
    currentPage.value - 1,
    itemsPerPage.value,
    activeSearch.value
  )
}

const handleApplySearch = (value: string) => {
  const nextSearch = normalizeTableSearch(value)

  if (areTableSearchEqual(activeSearch.value, nextSearch)) {
    return
  }

  activeSearch.value = nextSearch
  currentPage.value = 1
  fetchBranches()
}

const handleCreateButton = (): void => {
  dataModalForm.value.action = 'create'
  openBranchDrawer.value = true;
};

const handleRowActionButton = (branch: Branch, action: string): void => {
  console.log("apply Action Button:", action);
  switch (action) {
    case 'update':
      dataModalForm.value.action = action
      dataModalForm.value.rowId = branch.id
      openBranchDrawer.value = true;
      break;

    case 'delete':
      showDeleteDialog.value = true
      branchToRemove.value = branch
      break;

    default:
      break;
  }
};

const closeBranchDrawer = () => {
  openBranchDrawer.value = false;
  openBranchDrawer.value = false;
  fetchBranches();
};

const { notifyCreated, notifyUpdated, notifyDeleted, notifyError } = useApiNotification()

const handleCreateBranch = async (branch: Branch) => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api("/api/branches", {
      method: "POST",
      body: { ...branch },
    });
    notifyCreated("sucursal");
    closeBranchDrawer();
  } catch (err) {
    notifyError(err, "crear la sucursal");
  } finally {
    loading.value = false;
  }
};

const handleUpdateBranch = async (branch: Branch) => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api(`/api/branches/${branch.id}`, {
      method: "PUT",
      body: {
        name: branch.name,
        address: branch.address,
        city: branch.city
      },
    });
    notifyUpdated("sucursal");
    closeBranchDrawer();
  } catch (err) {
    notifyError(err, "actualizar la sucursal");
  } finally {
    loading.value = false;
  }
};

const handleDeleteBranch = async () => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api(`/api/branches/${branchToRemove.value?.id}`, {
      method: "DELETE",
    });
    notifyDeleted("sucursal");
    await fetchBranches();
  } catch (err) {
    notifyError(err, "eliminar la sucursal");
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

  await fetchBranches()
}

// Mounted
onMounted(() => {
  fetchBranches();
});
</script>