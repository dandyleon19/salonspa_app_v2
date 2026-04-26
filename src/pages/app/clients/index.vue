<template>
  <AppTable
      title="Clientes"
      subtitle="Lista de clientes registrados"
      :headers="headers"
      :rowOptions="rowOptions"
      :filters="tableFilters"
      :items="clientsList"
      :total-items="clientsList.length"
      :loading="loadingClientsList"
      @handle-create-button="handleCreateButton"
      @handle-row-action-button="handleRowActionButton"
  />

  <AppDrawer
      v-model="openClientDrawer"
      title="Gestión de Clientes"
      :loading="loading"
      size="large"
      location="end"
      :temporary="true"
      @close="closeClientDrawer"
  >
    <ClientForm
        :data-modal-form="dataModalForm"
        @create="handleCreateClient"
        @update="handleUpdateClient"
    />
  </AppDrawer>

  <ConfirmationModal
      v-model="showDeleteDialog"
      title="Eliminar usuario"
      message="¿Deseas eliminar este cliente? Esta acción no se puede deshacer."
      :require-text="false"
      @confirm="handleDeleteClient"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { FilterOption, TableHeader, TableRowOption } from "~/interfaces/tableInterfaces";
import type { Client, clientDataModalForm } from "~/interfaces/clientInterfaces";
import { useClientsStore } from "~/store/modules/client";

definePageMeta({
  layout: 'app'
})

// Composables
const clientsStore = useClientsStore();

// Variables
const loading = ref<boolean>(false);
const openClientDrawer = ref<boolean>(false);
const openBranchDrawer = ref<boolean>(false)
const showDeleteDialog = ref<boolean>(false)
const clientToRemove = ref<Client>()

const headers = ref<Array<TableHeader>>([
  { title: "ID", key: "id" },
  { title: "Nombres", key: "firstName" },
  { title: "Apellidos", key: "lastName" },
  { title: "Nro Documento", key: "documentNumber" },
  { title: "Teléfono", key: "phone" },
  { title: "Email", key: "email" },
  { title: "Cumpleaños", key: "birthDate" },
  { title: "Acciones", key: "actions", sortable: false },
]);

const rowOptions = ref<Array<TableRowOption>>([
  {
    action: 'update',
    color: 'primary',
    icon: 'mdi-pencil',
  },
  {
    action: 'clinicalRecords',
    color: 'primary',
    icon: 'mdi-folder-heart-outline',
  },
  {
    action: 'delete',
    color: 'error',
    icon: 'mdi-delete',
  },
]);

const tableFilters = ref<FilterOption[]>([]);

const dataModalForm = ref<clientDataModalForm>({
  action: "create",
});

// Computed
const clientsList = computed(() => {
  return clientsStore.list;
});

const loadingClientsList = computed(() => {
  return clientsStore.loading;
});

const handleCreateButton = (): void => {
  dataModalForm.value.action = 'create'
  openClientDrawer.value = true;
};

const handleRowActionButton = (client: Client, action: string): void => {
  console.log("apply Action Button:", action);
  switch (action) {
    case 'update':
      dataModalForm.value.action = action
      dataModalForm.value.rowId = client.id
      openClientDrawer.value = true;
      break;

    case 'clinicalRecords':
      dataModalForm.value.action = action
      dataModalForm.value.rowId = client.id
      // dataModalForm.value.branches = client.branches
      openBranchDrawer.value = true
      break;

    case 'delete':
      showDeleteDialog.value = true
      clientToRemove.value = client
      break;

    default:
      break;
  }
};

const closeClientDrawer = () => {
  openClientDrawer.value = false;
  openBranchDrawer.value = false;
  clientsStore.fetchClients();
};

const handleCreateClient = async (client: Client) => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api("/api/clients", {
      method: "POST",
      body: { ...client, salonId: 1},
    });
    closeClientDrawer();
  } catch (err) {
    console.error("=======> Error: ", err);
  } finally {
    loading.value = false;

  }
};

const handleUpdateClient = async (client: Client) => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api(`/api/clients/${client.id}`, {
      method: "PUT",
      body: {
        firstName: client.firstName,
        lastName: client.lastName,
        documentNumber: client.documentNumber,
        phone: client.phone,
        birthDate: client.birthDate,
        gender: client.gender,
        email: client.email,
      },
    });
    closeClientDrawer();
  } catch (err) {
    console.error("=======> Error: ", err);
  } finally {
    loading.value = false;
  }
};

const handleDeleteClient = async () => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api(`/api/clients/${clientToRemove.value?.id}`, {
      method: "DELETE",
    });
    await clientsStore.fetchClients();
  } catch (err) {
    console.error("=======> Error: ", err);
  } finally {
    loading.value = false;
  }
}

// Mounted
onMounted(() => {
  clientsStore.fetchClients();
});
</script>