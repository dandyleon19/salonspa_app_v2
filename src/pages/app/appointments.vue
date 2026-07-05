<template>
  <AppTableWrapper class="appointments-layout">
    <AppPageTitle
      title="Citas"
      :subtitle="pageSubtitle"
      :total-items="pageTotalItems"
    >
      <template #actions>
        <div class="appointments-layout__actions d-flex ga-2 flex-wrap">
          <AppointmentViewToggle />
          <v-btn
            v-if="canManageAppointments && showCreateButton"
            color="primary"
            variant="flat"
            size="large"
            rounded="lg"
            @click="openCreate"
          >
            <v-icon start>tabler:plus</v-icon>
            Nuevo
          </v-btn>
        </div>
      </template>
    </AppPageTitle>

    <NuxtPage />

    <AppDrawer
      v-if="canManageAppointments"
      v-model="openAppointmentDrawer"
      title="Gestión de Citas"
      :loading="loading"
      size="large"
      location="end"
      :temporary="true"
      @close="closeAppointmentDrawer"
    >
      <AppointmentForm
        :data-modal-form="dataModalForm"
        @create="handleCreateAppointment"
        @update="handleUpdateAppointment"
      />
    </AppDrawer>

    <AppointmentStatusModal
      v-if="canManageAppointments"
      v-model="showStatusDialog"
      :target-status="pendingTargetStatus"
      :appointment-summary="pendingStatusSummary"
      :can-create-sale="canManageSales"
      @confirm="handleConfirmStatusChange"
    />

    <ConfirmationModal
      v-if="canManageAppointments"
      v-model="showDeleteDialog"
      title="Eliminar cita"
      message="¿Deseas eliminar esta cita? Esta acción no se puede deshacer."
      :require-text="false"
      @confirm="handleDeleteAppointment"
    />
  </AppTableWrapper>
</template>

<script setup lang="ts">
import { provideAppointmentManagement } from "~/composables/useAppointmentManagement"
import { useAppointmentsStore } from "~/store"

definePageMeta({
  layout: "app",
})

const route = useRoute()
const appointmentsStore = useAppointmentsStore()

const {
  canManageAppointments,
  canManageSales,
  loading,
  openCreate,
  openAppointmentDrawer,
  showDeleteDialog,
  showStatusDialog,
  dataModalForm,
  pendingTargetStatus,
  pendingStatusSummary,
  closeAppointmentDrawer,
  handleConfirmStatusChange,
  handleCreateAppointment,
  handleUpdateAppointment,
  handleDeleteAppointment,
} = provideAppointmentManagement()

const isCalendarView = computed(() => route.path.endsWith("/calendar"))

const pageSubtitle = computed(() =>
  isCalendarView.value ? "Vista mensual de citas" : "Lista de citas registradas"
)

const pageTotalItems = computed(() => {
  if (isCalendarView.value) {
    return appointmentsStore.calendarData?.total
  }
  return appointmentsStore.data?.totalElements
})

const showCreateButton = computed(() => true)
</script>

<style scoped>
.appointments-layout__actions {
  align-items: center;
}
</style>
