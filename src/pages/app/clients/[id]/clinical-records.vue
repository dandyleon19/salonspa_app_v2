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

    <AppSkeletonTransition>
      <v-skeleton-loader
        v-if="loadingClient && !clienteSelected"
        key="clinical-patient-skeleton"
        type="article"
        class="clinical-records-page__patient-skeleton mb-6"
      />

      <v-alert
        v-else-if="!loadingClient && !clienteSelected"
        key="clinical-patient-not-found"
        type="warning"
        variant="tonal"
        rounded="lg"
        class="mb-6"
      >
        Cliente no encontrado
      </v-alert>
    </AppSkeletonTransition>

    <template v-if="clienteSelected">
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
                    {{ totalClinicalRecords }} historial{{ totalClinicalRecords === 1 ? "" : "es" }}
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
                {{ totalClinicalRecords }}
              </v-chip>
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-4 clinical-records-page__list">
              <AppSkeletonTransition>
                <AppListSkeleton v-if="loadingRecords" key="clinical-list-skeleton" :items="4" />
                <div v-else key="clinical-list-content">
                  <ClinicalRecordList
                    :records="clinicalRecords"
                    :selected-record-id="selectedClinicalRecordId"
                    @select="selectedClinicalRecordId = $event ?? null"
                    @delete="openClinicalRecordDialog"
                  />

                  <div
                    v-if="totalPages > 1"
                    class="d-flex justify-center mt-4 clinical-records-page__pagination"
                  >
                    <v-pagination
                      v-model="currentPage"
                      :length="totalPages"
                      :total-visible="5"
                      density="compact"
                      rounded="lg"
                      @update:model-value="handlePageChange"
                    />
                  </div>
                </div>
              </AppSkeletonTransition>
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
              <AppSkeletonTransition>
                <AppDetailSkeleton v-if="loadingRecords" key="clinical-detail-skeleton" />
                <ClinicalRecordDetail v-else key="clinical-detail-content" :record="selectedClinicalRecord" />
              </AppSkeletonTransition>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>

  <AppDrawer
    v-model="openClinicalRecordDrawer"
    title="Gestión de Historiales Clínicos"
    :loading="loadingDrawerSubmit"
    size="large"
    location="end"
    :temporary="true"
    @close="closeClinicalRecordDrawer"
  >
    <ClinicalRecordForm
      :data-modal-form="dataModalForm"
      :client-id="clientId"
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
import type { PageResponse } from "~/interfaces/PageResponse"

definePageMeta({
  layout: "app",
})

const route = useRoute()
const clientId = Number(route.params.id)

const loadingClient = ref(false)
const loadingRecords = ref(false)
const loadingDrawerSubmit = ref(false)
const showDeleteDialog = ref(false)
const clinicalRecordToRemove = ref<ClinicalRecord>()
const openClinicalRecordDrawer = ref(false)
const selectedClinicalRecordId = ref<string | number | null>(null)

const currentPage = ref(1)
const itemsPerPage = ref(5)

const clienteSelected = ref<Client>()
const clinicalRecordsPage = ref<PageResponse<ClinicalRecord> | null>(null)

const clinicalRecords = computed(() => clinicalRecordsPage.value?.content ?? [])
const totalClinicalRecords = computed(() => clinicalRecordsPage.value?.totalElements ?? 0)
const totalPages = computed(() => clinicalRecordsPage.value?.totalPages ?? 0)

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

const { notifyCreated, notifyUpdated, notifyDeleted, notifyError } = useApiNotification()

const syncSelectedRecord = () => {
  const hasSelected = clinicalRecords.value.some(
    (record) => String(record.id) === String(selectedClinicalRecordId.value)
  )

  if (!hasSelected) {
    selectedClinicalRecordId.value = clinicalRecords.value[0]?.id ?? null
  }
}

const fetchClient = async () => {
  try {
    loadingClient.value = true
    const { $api } = useNuxtApp()
    clienteSelected.value = await $api<Client>(`/api/clients/${clientId}`, {
      method: "GET",
    })
  } catch (err) {
    notifyError(err, "cargar el cliente")
  } finally {
    loadingClient.value = false
  }
}

const fetchClinicalRecords = async (
  page = currentPage.value - 1,
  size = itemsPerPage.value
) => {
  try {
    loadingRecords.value = true
    const { $api } = useNuxtApp()
    clinicalRecordsPage.value = await $api<PageResponse<ClinicalRecord>>(
      `/api/clients/${clientId}/clinical-records`,
      {
        method: "GET",
        query: { page, size },
      }
    )
    syncSelectedRecord()
  } catch (err) {
    notifyError(err, "cargar los historiales clínicos")
  } finally {
    loadingRecords.value = false
  }
}

const handlePageChange = async (page: number) => {
  currentPage.value = page
  await fetchClinicalRecords(page - 1, itemsPerPage.value)
}

const refreshClinicalRecords = async (page = currentPage.value) => {
  if (page < 1) page = 1
  currentPage.value = page
  await fetchClinicalRecords(page - 1, itemsPerPage.value)

  if (!clinicalRecords.value.length && currentPage.value > 1) {
    currentPage.value--
    await fetchClinicalRecords(currentPage.value - 1, itemsPerPage.value)
  }
}

const handleCreateClinicalRecord = async (clinicalRecord: ClinicalRecord) => {
  try {
    loadingDrawerSubmit.value = true
    const { $api } = useNuxtApp()
    await $api("/api/clinical-records", {
      method: "POST",
      body: { ...clinicalRecord, clientId },
    })
    notifyCreated("historial clínico")
    await closeClinicalRecordDrawer()
  } catch (err) {
    notifyError(err, "crear el historial clínico")
  } finally {
    loadingDrawerSubmit.value = false
  }
}

const handleUpdateClinicalRecord = async (clinicalRecord: ClinicalRecord) => {
  try {
    loadingDrawerSubmit.value = true
    const { $api } = useNuxtApp()
    await $api(`/api/clinical-records/${clinicalRecord.id}`, {
      method: "PUT",
      body: clinicalRecord,
    })
    notifyUpdated("historial clínico")
    await closeClinicalRecordDrawer()
  } catch (err) {
    notifyError(err, "actualizar el historial clínico")
  } finally {
    loadingDrawerSubmit.value = false
  }
}

const handleDeleteClinicalRecord = async () => {
  try {
    loadingRecords.value = true
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

    notifyDeleted("historial clínico")
    await refreshClinicalRecords()
  } catch (err) {
    notifyError(err, "eliminar el historial clínico")
  } finally {
    loadingRecords.value = false
  }
}

const openClinicalRecordDialog = (clinicalRecord: ClinicalRecord) => {
  showDeleteDialog.value = true
  clinicalRecordToRemove.value = clinicalRecord
}

const closeClinicalRecordDrawer = async () => {
  openClinicalRecordDrawer.value = false
  currentPage.value = 1
  await refreshClinicalRecords(1)
}

onMounted(async () => {
  await Promise.all([
    fetchClient(),
    fetchClinicalRecords(0, itemsPerPage.value),
  ])
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

.clinical-records-page__pagination :deep(.v-pagination__item--is-active .v-btn) {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
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
