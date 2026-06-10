<template>
    <AppTable
    title="Salones"
    subtitle="Lista de salones registrados"
    :headers="headers"
    :rowOptions="rowOptions"
    :filters="tableFilters"
    :items="salonsList"
    :loading="loadingSalonsList"
    :page="currentPage"
    :items-per-page="itemsPerPage"
    :total-items="totalItems"
    @update:pagination="handlePagination"
    @handle-create-button="handleCreateButton"
    @handle-row-action-button="handleRowActionButton"
  />

  <AppDrawer
    v-model="openSalonDrawer"
    title="Gestión de Salones"
    :loading="loading"
    size="large"
    location="end"
    :temporary="true"
    @close="closeSalonDrawer"
  >
    <SalonForm
      :data-modal-form="dataModalForm"
      @create="handleCreateSalon"
      @update="handleUpdateSalon"
    />    
  </AppDrawer>

  <AppDrawer
    v-model="openBranchDrawer"
    title="Gestión de Sucursales"
    :loading="loading"
    size="large"
    location="end"
    :temporary="true"
    @close="closeSalonDrawer"
  >
    <ManageBranches
      :data-modal-form="dataModalForm"
    />
  </AppDrawer>

  <ConfirmationModal
    v-model="showDeleteDialog"
    title="Eliminar usuario"
    message="¿Deseas eliminar este salón? Esta acción no se puede deshacer."
    :require-text="false"
    @confirm="handleDeleteSalon"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { ResponseInterface } from "~/interfaces/appInterfaces";
import type { FilterOption, TableHeader, TableRowOption } from "~/interfaces/tableInterfaces";
import type { Salon, salonDataModalForm } from "~/interfaces/salonInterfaces";
import { useSalonsStore } from "~/store";

definePageMeta({
  layout: 'app'
})

// Composables
const salonsStore = useSalonsStore();

// Variables
const loading = ref<boolean>(false);
const openSalonDrawer = ref<boolean>(false);
const openBranchDrawer = ref<boolean>(false)
const showDeleteDialog = ref<boolean>(false)
const salonToRemove = ref<Salon>()
const currentPage = ref(1)
const itemsPerPage = ref(10)

const headers = ref<Array<TableHeader>>([
  { title: "ID", key: "id" },
  { title: "Nombre", key: "name" },
  { title: "Razón Social", key: "socialReason" },
  { title: "Dirección", key: "fiscalAddress" },
  { title: "Ruc", key: "rucNumber" },
  { title: "Teléfono", key: "phone" },
  { title: "Acciones", key: "actions", sortable: false },
]);

const rowOptions = ref<Array<TableRowOption>>([
  {
    action: 'update',
    color: 'primary',
    icon: 'mdi-pencil',
  },
  {
    action: 'branches',
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

const dataModalForm = ref<salonDataModalForm>({
  action: "create",
});

// Computed
const salonsList = computed(() => {
  return salonsStore.data?.content ?? [];
});

const totalItems = computed(() => {
  return salonsStore.data?.totalElements ?? 0
})

const loadingSalonsList = computed(() => {
  return salonsStore.loading;
});

// Methods
const handleCreateButton = (): void => {
  dataModalForm.value.action = 'create'
  openSalonDrawer.value = true;
};

const handleRowActionButton = (salon: Salon, action: string): void => {
  console.log("apply Action Button:", action);
  switch (action) {
    case 'update':
      dataModalForm.value.action = action
      dataModalForm.value.rowId = salon.id
      openSalonDrawer.value = true;
      break;

    case 'branches':
      dataModalForm.value.action = action
      dataModalForm.value.rowId = salon.id
      dataModalForm.value.branches = salon.branches
      openBranchDrawer.value = true
      break;

    case 'delete':
      showDeleteDialog.value = true
      salonToRemove.value = salon
      break;
  
    default:
      break;
  }
};

const closeSalonDrawer = () => {
  openSalonDrawer.value = false;
  openBranchDrawer.value = false;
  salonsStore.fetchSalons();
};

const { notifyCreated, notifyUpdated, notifyDeleted, notifyError } = useApiNotification()

const handleCreateSalon = async (salon: Salon) => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api("/api/salons", {
      method: "POST",
      body: { ...salon },
    });
    notifyCreated("salón");
    closeSalonDrawer();
  } catch (err) {
    notifyError(err, "crear el salón");
  } finally {
    loading.value = false;
  }
};

const handleUpdateSalon = async (salon: Salon) => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api(`/api/salons/${salon.id}`, {
      method: "PUT",
      body: { 
        name: salon.name,
        rucNumber: salon.rucNumber,
        socialReason: salon.socialReason,
        fiscalAddress: salon.fiscalAddress,
        phone: salon.phone,
      },
    });
    notifyUpdated("salón");
    closeSalonDrawer();
  } catch (err) {
    notifyError(err, "actualizar el salón");
  } finally {
    loading.value = false;
  }
};

const handleDeleteSalon = async () => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api(`/api/salons/${salonToRemove.value?.id}`, {
      method: "DELETE",
    });
    notifyDeleted("salón");
    await salonsStore.fetchSalons();
  } catch (err) {
    notifyError(err, "eliminar el salón");
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

  await salonsStore.fetchSalons(
      page - 1,
      newItemsPerPage
  )
}

// Mounted
onMounted(() => {
  salonsStore.fetchSalons(0, itemsPerPage.value);
});
</script>