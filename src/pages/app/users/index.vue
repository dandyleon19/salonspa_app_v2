<template>
  <pre>showDeleteDialog: {{ showDeleteDialog }}</pre>
  <AppTable
    title="Usuarios"
    subtitle="Lista de usuarios registrados"
    :headers="headers"
    :rowOptions="rowOptions"
    :filters="tableFilters"
    :items="usersList"
    :total-items="usersList.length"
    :loading="loadingUsersList"
    @handle-create-button="handleCreateButton"
    @handle-export-button="handleExportData"
    @handle-row-action-button="handleRowActionButton"
    @handle-update-filters="handleApplyFilters"
  />

  <AppDrawer
    v-model="openUserDrawer"
    title="Gestión de Usuarios"
    :loading="loading"
    size="large"
    location="end"
    :temporary="true"
    @close="closeUserDrawer"
  >
    <UserForm
      :data-modal-form="dataModalForm"
      @create="handleCreateUser"
      @update="handleUpdateUser"
      @change-password="handleChangePassword"
      @change-branch-offices="handleChangeBranchOffices"
    />

    <!-- FOOTER -->
    <!-- <template #footer>
      <v-btn color="secondary" @click="openUserDrawer = false">Cancelar</v-btn>
      <v-btn color="primary">Guardar</v-btn>
    </template> -->
  </AppDrawer>

  <ConfirmationModal
    v-model="showDeleteDialog"
    title="Eliminar usuario"
    message="¿Deseas eliminar este usuario? Esta acción no se puede deshacer."
    :require-text="false"
    @confirm="handleDeleteUser"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { ResponseInterface } from "~/interfaces/appInterfaces";
import type { FilterOption, TableHeader, TableRowOption } from "~/interfaces/tableInterfaces";
import type { User, userDataModalForm } from "~/interfaces/userInterfaces";
import { useUsersStore } from "~/store";

definePageMeta({
  layout: "app",
});

// Composables
const usersStore = useUsersStore();

// Variables
const loading = ref<boolean>(false);
const openUserDrawer = ref<boolean>(false);
const showDeleteDialog = ref<boolean>(false)
const userToRemove = ref<User>()

const headers = ref<Array<TableHeader>>([
  { title: "ID", key: "id" },
  { title: "Nombre", key: "first_name" },
  { title: "Email", key: "email" },
  { title: "Estado", key: "is_active" },
  { title: "Acciones", key: "actions", sortable: false },
]);

const rowOptions = ref<Array<TableRowOption>>([
  {
    action: 'update',
    color: 'primary',
    icon: 'mdi-pencil',
  },
  {
    action: 'changePassword',
    color: 'error',
    icon: 'mdi-lock-reset',
  },
  {
    action: 'changeBranchOffices',
    color: 'primary',
    icon: 'mdi-format-list-bulleted',
  },
  {
    action: 'delete',
    color: 'error',
    icon: 'mdi-delete',
  },
]);

const tableFilters = ref<FilterOption[]>([
  {
    type: "select",
    label: "Estado",
    key: "status",
    items: ["Activo", "Inactivo"],
  },
  {
    type: "multiselect",
    label: "Roles",
    key: "roles",
    items: ["Admin", "Editor", "Viewer"],
  },
]);

const dataModalForm = ref<userDataModalForm>({
  action: "create",
});

// Computed
const usersList = computed(() => {
  return usersStore.list;
});

const loadingUsersList = computed(() => {
  return usersStore.loading;
});

// Methods
const handleCreateButton = (): void => {
  dataModalForm.value.action = 'create'
  openUserDrawer.value = true;
};

const handleExportData = (): void => {
  console.log("Exportar");
};

const handleRowActionButton = (user: User, action: string): void => {
  console.log("apply Action Button:", action);
  switch (action) {
    case 'update':
    case 'changePassword':
    case 'changeBranchOffices':
      dataModalForm.value.action = action
      dataModalForm.value.rowId = user.id
      openUserDrawer.value = true;
      break;

    case 'delete':
      showDeleteDialog.value = true
      userToRemove.value = user
      break;
  
    default:
      break;
  }
};

const handleApplyFilters = (user: any): void => {
  console.log("apply Filters:", user);
};

const closeUserDrawer = () => {
  openUserDrawer.value = false;
  usersStore.fetchUsers();
};

const handleCreateUser = async (user: User) => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api("/api/users", {
      method: "POST",
      body: { ...user },
    });
  } catch (err) {
    console.error("Error: ", err);
  } finally {
    loading.value = false;
    closeUserDrawer();
  }
};

const handleUpdateUser = async (user: User) => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api(`/api/users/${user.id}`, {
      method: "PUT",
      body: { 
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        commission_percentage: user.commission_percentage,
      },
    });
  } catch (err) {
    console.error("Error: ", err);
  } finally {
    loading.value = false;
    closeUserDrawer();
  }
};

const handleDeleteUser = async () => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api(`/api/users/${userToRemove.value?.id}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.error("Error: ", err);
  } finally {
    loading.value = false;
    usersStore.fetchUsers();
  }  
}

const handleChangePassword = () => {};

const handleChangeBranchOffices = () => {};

// Mounted
onMounted(() => {
  usersStore.fetchUsers();
});
</script>
