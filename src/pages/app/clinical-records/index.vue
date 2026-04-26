<template>
  <AppTable
      title="Historiales Clínicos"
      subtitle="Lista de historiales clínicos registrados"
      :headers="headers"
      :rowOptions="rowOptions"
      :filters="tableFilters"
      :items="clinicalRecordsList"
      :total-items="clinicalRecordsList.length"
      :loading="loadingClinicalRecordsList"
      @handle-create-button="handleCreateButton"
      @handle-row-action-button="handleRowActionButton"
  />

  <AppDrawer
      v-model="openClinicalRecordDrawer"
      title="Gestión de Historiales Clínicos"
      :loading="loading"
      size="large"
      location="end"
      :temporary="true"
      @close="closeClinicalRecordDrawer"
  >
    <ClinicalRecordForm
        :data-modal-form="dataModalForm"
        @create="handleCreateClinicalRecord"
        @update="handleUpdateClinicalRecord"
    />
  </AppDrawer>

  <ConfirmationModal
      v-model="showDeleteDialog"
      title="Eliminar usuario"
      message="¿Deseas eliminar este clinicalRecorde? Esta acción no se puede deshacer."
      :require-text="false"
      @confirm="handleDeleteClinicalRecord"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { FilterOption, TableHeader, TableRowOption } from "~/interfaces/tableInterfaces";
import type { ClinicalRecord, clinicalRecordDataModalForm } from "~/interfaces/clinicalRecordInterfaces";
import { useClinicalRecordsStore } from "~/store/modules/clinicalRecord";

definePageMeta({
  layout: 'app'
})

// Composables
const clinicalRecordsStore = useClinicalRecordsStore();

// Variables
const loading = ref<boolean>(false);
const openClinicalRecordDrawer = ref<boolean>(false);
const openBranchDrawer = ref<boolean>(false)
const showDeleteDialog = ref<boolean>(false)
const clinicalRecordToRemove = ref<ClinicalRecord>()

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
    action: 'delete',
    color: 'error',
    icon: 'mdi-delete',
  },
]);

const tableFilters = ref<FilterOption[]>([]);

const dataModalForm = ref<clinicalRecordDataModalForm>({
  action: "create",
});

// Computed
const clinicalRecordsList = computed(() => {
  return clinicalRecordsStore.list;
});

const loadingClinicalRecordsList = computed(() => {
  return clinicalRecordsStore.loading;
});

const handleCreateButton = (): void => {
  dataModalForm.value.action = 'create'
  openClinicalRecordDrawer.value = true;
};

const handleRowActionButton = (clinicalRecord: ClinicalRecord, action: string): void => {
  console.log("apply Action Button:", action);
  switch (action) {
    case 'update':
      dataModalForm.value.action = action
      dataModalForm.value.rowId = clinicalRecord.id
      openClinicalRecordDrawer.value = true;
      break;

    case 'delete':
      showDeleteDialog.value = true
      clinicalRecordToRemove.value = clinicalRecord
      break;

    default:
      break;
  }
};

const closeClinicalRecordDrawer = () => {
  openClinicalRecordDrawer.value = false;
  openBranchDrawer.value = false;
  clinicalRecordsStore.fetchClinicalRecords();
};

const handleCreateClinicalRecord = async (clinicalRecord: ClinicalRecord) => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api("/api/clinical-records", {
      method: "POST",
      body: { ...clinicalRecord },
    });
    closeClinicalRecordDrawer();
  } catch (err) {
    console.error("=======> Error: ", err);
  } finally {
    loading.value = false;

  }
};

const handleUpdateClinicalRecord = async (clinicalRecord: ClinicalRecord) => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api(`/api/clinical-records/${clinicalRecord.id}`, {
      method: "PUT",
      body: {

      },
    });
    closeClinicalRecordDrawer();
  } catch (err) {
    console.error("=======> Error: ", err);
  } finally {
    loading.value = false;
  }
};

const handleDeleteClinicalRecord = async () => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api(`/api/clinical-records/${clinicalRecordToRemove.value?.id}`, {
      method: "DELETE",
    });
    await clinicalRecordsStore.fetchClinicalRecords();
  } catch (err) {
    console.error("=======> Error: ", err);
  } finally {
    loading.value = false;
  }
}

// Mounted
onMounted(() => {
  clinicalRecordsStore.fetchClinicalRecords();
});
</script>