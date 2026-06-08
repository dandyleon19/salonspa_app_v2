<template>
  <v-container fluid class="pa-6" style="min-height: 100vh;">

    <v-container class="mx-auto" max-width="1200">

      <!-- Back -->
      <NuxtLink to="/app/clients" class="d-inline-flex align-center mb-4 text-primary">
        ← Volver a Clientes
      </NuxtLink>

      <!-- Header -->
      <div class="d-flex justify-space-between align-start mb-8">
        <div>
          <h4 class="text-h4 font-weight-bold mb-1">Historial Clínico</h4>
          <h2 class="text-h5 font-weight-bold mb-1">Paciente: {{ `${clienteSelected?.firstName} ${clienteSelected?.lastName}` }}</h2>
          <p class="mt-2">
            Correo: {{ clienteSelected?.email ?? "-" }}
          </p>
          <p class="mt-2">
            Teléfono: {{ clienteSelected?.phone ?? "-" }}
          </p>
        </div>

        <v-btn color="primary" @click="handleCreateButton">
          <v-icon start>mdi-plus</v-icon> Nuevo Historial
        </v-btn>
      </div>

      <div v-if="!clienteSelected" class="text-center py-12">
        Cliente no encontrado
      </div>

      <!-- Split layout -->
      <v-row v-else class="fill-height">

        <!-- LEFT -->
        <v-col cols="12" md="4" class="d-flex flex-column">
          <div class="mb-4">
            <h2 class="text-h6">Registros Clínicos ({{ clinicalRecords?.length }})</h2>
          </div>

          <v-card class="flex-grow-1 overflow-y-auto pa-3 bg-white">
            <ClinicalRecordList
                :records="clinicalRecords"
                :selectedClinicalRecordId="selectedClinicalRecordId"
                @select="selectedClinicalRecordId = $event"
                @delete="openClinicalRecordDialog"
            />
          </v-card>
        </v-col>

        <!-- RIGHT -->
        <v-col cols="12" md="8" class="d-flex flex-column">
          <h2 class="text-h6 mb-4">Detalles del Registro</h2>

          <v-card class="flex-grow-1 pa-4 bg-white">
            <ClinicalRecordDetail :record="selectedClinicalRecord" />
          </v-card>
        </v-col>

      </v-row>
    </v-container>
  </v-container>

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
      message="¿Deseas eliminar este historial clínico? Esta acción no se puede deshacer."
      :require-text="false"
      @confirm="handleDeleteClinicalRecord"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import type { ClinicalRecord, clinicalRecordDataModalForm } from "~/interfaces/clinicalRecordInterfaces";
import type { Client } from "~/interfaces/clientInterfaces";

definePageMeta({
  layout: 'app'
})

// Route param
const route = useRoute()
const clientId = Number(route.params.id)

// State
const loading = ref<boolean>(false);
const showDeleteDialog = ref<boolean>(false)
const clinicalRecordToRemove = ref<ClinicalRecord>()
const openClinicalRecordDrawer = ref(false)
const selectedClinicalRecordId = ref(null)

const clienteSelected = ref<Client>()
const clinicalRecords = ref<ClinicalRecord[]>([])

const dataModalForm = ref<clinicalRecordDataModalForm>({
  action: "create",
});

// Computed
const selectedClinicalRecord = computed(() =>
    clinicalRecords.value.find(r => r.id === selectedClinicalRecordId.value) || null
)

// Actions
const handleCreateButton = (): void => {
  dataModalForm.value.action = 'create'
  openClinicalRecordDrawer.value = true;
};

const handleCreateClinicalRecord = async (clinicalRecord: ClinicalRecord) => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api("/api/clinical-records", {
      method: "POST",
      body: { ...clinicalRecord, clientId: clientId },
    });
    await closeClinicalRecordDrawer();
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
    await closeClinicalRecordDrawer();
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
    await fetchSelectedClient()
  } catch (err) {
    console.error("=======> Error: ", err);
  } finally {
    loading.value = false;
  }
}

const openClinicalRecordDialog = (clinicalRecord: ClinicalRecord) => {
  showDeleteDialog.value = true
  clinicalRecordToRemove.value = clinicalRecord
}

const closeClinicalRecordDrawer = async () => {
  openClinicalRecordDrawer.value = false;
  await fetchSelectedClient()
};

const fetchSelectedClient = async () => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    const res: any = await $api(`/api/clients/${clientId}`, {
      method: "GET",
    });
    clienteSelected.value = res as Client
    clinicalRecords.value = res.clinicalRecords as ClinicalRecord[]
  } catch (err) {
    console.error('Error al obtener historiales clínicos:', err)
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await fetchSelectedClient()
});
</script>