<template>
  <div class="clinical-records-page">
    <v-btn
      to="/app/clients"
      variant="text"
      color="primary"
      prepend-icon="mdi-arrow-left"
      class="mb-4 px-0"
    >
      Volver a Clientes
    </v-btn>

    <v-skeleton-loader
      v-if="loading && !clienteSelected"
      type="article, paragraph, card"
      class="mb-6"
    />

    <v-alert
      v-else-if="!loading && !clienteSelected"
      type="warning"
      variant="tonal"
      rounded="lg"
      class="mb-6"
    >
      Cliente no encontrado
    </v-alert>

    <template v-else-if="clienteSelected">
      <v-card class="clinical-records-page__patient-card mb-6" rounded="xl" elevation="0">
        <v-card-text class="pa-5 pa-md-6">
          <div class="d-flex align-center justify-space-between flex-wrap ga-4">
            <div class="d-flex align-center ga-4">
              <v-avatar size="64" color="primary" class="clinical-records-page__avatar">
                <span class="text-h6 font-weight-bold text-white">
                  {{ patientInitials }}
                </span>
              </v-avatar>

              <div>
                <p class="text-overline text-medium-emphasis mb-1">Paciente</p>
                <h1 class="text-h5 text-md-h4 font-weight-bold mb-2">
                  {{ patientFullName }}
                </h1>
                <div class="d-flex flex-wrap ga-2">
                  <v-chip
                    v-if="clienteSelected.email"
                    size="small"
                    variant="tonal"
                    prepend-icon="mdi-email-outline"
                  >
                    {{ clienteSelected.email }}
                  </v-chip>
                  <v-chip
                    v-if="clienteSelected.phone"
                    size="small"
                    variant="tonal"
                    prepend-icon="mdi-phone-outline"
                  >
                    {{ clienteSelected.phone }}
                  </v-chip>
                  <v-chip
                    size="small"
                    color="primary"
                    variant="tonal"
                    prepend-icon="mdi-clipboard-text-outline"
                  >
                    {{ clinicalRecords.length }} historial{{ clinicalRecords.length === 1 ? "" : "es" }}
                  </v-chip>
                </div>
              </div>
            </div>

            <v-btn
              color="primary"
              size="large"
              rounded="lg"
              prepend-icon="mdi-plus"
              @click="handleCreateButton"
            >
              Nuevo Historial
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <v-row class="clinical-records-page__layout">
        <v-col cols="12" lg="4">
          <v-card class="clinical-records-page__panel" rounded="xl" elevation="0">
            <v-card-title class="d-flex align-center justify-space-between py-4 px-5">
              <div>
                <p class="text-subtitle-1 font-weight-bold mb-0">Historiales</p>
                <p class="text-caption text-medium-emphasis mb-0">
                  Selecciona un registro para ver el detalle
                </p>
              </div>
              <v-chip size="small" color="primary" variant="tonal">
                {{ clinicalRecords.length }}
              </v-chip>
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-4 clinical-records-page__list">
              <v-skeleton-loader
                v-if="loading"
                type="list-item-three-line@3"
              />
              <ClinicalRecordList
                v-else
                :records="clinicalRecords"
                :selected-record-id="selectedClinicalRecordId"
                @select="selectedClinicalRecordId = $event ?? null"
                @delete="openClinicalRecordDialog"
              />
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" lg="8">
          <v-card class="clinical-records-page__panel clinical-records-page__detail" rounded="xl" elevation="0">
            <v-card-title class="py-4 px-5">
              <p class="text-subtitle-1 font-weight-bold mb-0">Detalle del registro</p>
              <p class="text-caption text-medium-emphasis mb-0">
                Información clínica de la sesión seleccionada
              </p>
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-5 clinical-records-page__detail-body">
              <ClinicalRecordDetail :record="selectedClinicalRecord" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>

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
    title="Eliminar historial clínico"
    message="¿Deseas eliminar este historial clínico? Esta acción no se puede deshacer."
    :require-text="false"
    @confirm="handleDeleteClinicalRecord"
  />
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { useRoute } from "vue-router"
import type { ClinicalRecord, clinicalRecordDataModalForm } from "~/interfaces/clinicalRecordInterfaces"
import type { Client } from "~/interfaces/clientInterfaces"

definePageMeta({
  layout: "app",
})

const route = useRoute()
const clientId = Number(route.params.id)

const loading = ref(false)
const showDeleteDialog = ref(false)
const clinicalRecordToRemove = ref<ClinicalRecord>()
const openClinicalRecordDrawer = ref(false)
const selectedClinicalRecordId = ref<string | number | null>(null)

const clienteSelected = ref<Client>()
const clinicalRecords = ref<ClinicalRecord[]>([])

const dataModalForm = ref<clinicalRecordDataModalForm>({
  action: "create",
})

const patientFullName = computed(() => {
  if (!clienteSelected.value) return ""
  return `${clienteSelected.value.firstName} ${clienteSelected.value.lastName}`.trim()
})

const patientInitials = computed(() => {
  if (!clienteSelected.value) return "?"
  const first = clienteSelected.value.firstName?.charAt(0) ?? ""
  const last = clienteSelected.value.lastName?.charAt(0) ?? ""
  return `${first}${last}`.toUpperCase() || "?"
})

const selectedClinicalRecord = computed(() =>
  clinicalRecords.value.find(
    (record) => String(record.id) === String(selectedClinicalRecordId.value)
  ) || null
)

const handleCreateButton = (): void => {
  dataModalForm.value.action = "create"
  openClinicalRecordDrawer.value = true
}

const handleCreateClinicalRecord = async (clinicalRecord: ClinicalRecord) => {
  try {
    loading.value = true
    const { $api } = useNuxtApp()
    await $api("/api/clinical-records", {
      method: "POST",
      body: { ...clinicalRecord, clientId },
    })
    await closeClinicalRecordDrawer()
  } catch (err) {
    console.error("=======> Error: ", err)
  } finally {
    loading.value = false
  }
}

const handleUpdateClinicalRecord = async (clinicalRecord: ClinicalRecord) => {
  try {
    loading.value = true
    const { $api } = useNuxtApp()
    await $api(`/api/clinical-records/${clinicalRecord.id}`, {
      method: "PUT",
      body: {},
    })
    await closeClinicalRecordDrawer()
  } catch (err) {
    console.error("=======> Error: ", err)
  } finally {
    loading.value = false
  }
}

const handleDeleteClinicalRecord = async () => {
  try {
    loading.value = true
    const { $api } = useNuxtApp()
    await $api(`/api/clinical-records/${clinicalRecordToRemove.value?.id}`, {
      method: "DELETE",
    })

    if (
      String(clinicalRecordToRemove.value?.id) ===
      String(selectedClinicalRecordId.value)
    ) {
      selectedClinicalRecordId.value = null
    }

    await fetchSelectedClient()
  } catch (err) {
    console.error("=======> Error: ", err)
  } finally {
    loading.value = false
  }
}

const openClinicalRecordDialog = (clinicalRecord: ClinicalRecord) => {
  showDeleteDialog.value = true
  clinicalRecordToRemove.value = clinicalRecord
}

const closeClinicalRecordDrawer = async () => {
  openClinicalRecordDrawer.value = false
  await fetchSelectedClient()
}

const fetchSelectedClient = async () => {
  try {
    loading.value = true
    const { $api } = useNuxtApp()
    const res: any = await $api(`/api/clients/${clientId}`, {
      method: "GET",
    })

    clienteSelected.value = res as Client
    clinicalRecords.value = (res.clinicalRecords as ClinicalRecord[]) ?? []

    const hasSelected = clinicalRecords.value.some(
      (record) => String(record.id) === String(selectedClinicalRecordId.value)
    )

    if (!hasSelected) {
      selectedClinicalRecordId.value = clinicalRecords.value[0]?.id ?? null
    }
  } catch (err) {
    console.error("Error al obtener historiales clínicos:", err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchSelectedClient()
})
</script>

<style scoped>
.clinical-records-page {
  max-width: 1280px;
  margin: 0 auto;
}

.clinical-records-page__patient-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.08) 0%,
    rgba(var(--v-theme-surface), 1) 55%
  );
}

.clinical-records-page__avatar {
  box-shadow: 0 8px 20px rgba(235, 88, 137, 0.25);
}

.clinical-records-page__panel {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  min-height: 100%;
}

.clinical-records-page__list {
  max-height: 620px;
  overflow-y: auto;
}

.clinical-records-page__detail {
  min-height: 620px;
}

.clinical-records-page__detail-body {
  min-height: 520px;
}

@media (max-width: 1279px) {
  .clinical-records-page__detail,
  .clinical-records-page__list {
    min-height: auto;
    max-height: none;
  }

  .clinical-records-page__detail-body {
    min-height: 360px;
  }
}
</style>
