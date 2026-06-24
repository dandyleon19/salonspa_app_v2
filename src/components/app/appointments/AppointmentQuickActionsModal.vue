<template>
  <v-dialog
    v-model="model"
    max-width="480"
    transition="dialog-transition"
  >
    <v-card class="appointment-quick-actions" rounded="xl" elevation="0">
      <v-card-text class="pa-6 pa-sm-7">
        <div class="appointment-quick-actions__header mb-4">
          <v-avatar size="52" color="primary" variant="tonal">
            <v-icon size="26">mdi-calendar-clock</v-icon>
          </v-avatar>
          <div class="appointment-quick-actions__summary">
            <h2 class="text-h6 font-weight-bold app-font-heading mb-1">
              {{ appointment?.clientName || "Cita" }}
            </h2>
            <p class="text-body-2 text-medium-emphasis mb-0">
              {{ appointmentSummary }}
            </p>
          </div>
        </div>

        <v-chip
          v-if="appointment?.status"
          size="small"
          variant="tonal"
          rounded="pill"
          :color="getAppointmentStatusColor(appointment.status)"
          class="mb-4"
        >
          {{ getAppointmentStatusLabel(appointment.status) }}
        </v-chip>

        <div class="appointment-quick-actions__details">
          <div v-if="appointment?.serviceName" class="appointment-quick-actions__detail">
            <v-icon size="18" class="mr-2">mdi-spa-outline</v-icon>
            <span>{{ appointment.serviceName }}</span>
          </div>
          <div v-if="appointment?.userName" class="appointment-quick-actions__detail">
            <v-icon size="18" class="mr-2">mdi-account-outline</v-icon>
            <span>{{ appointment.userName }}</span>
          </div>
          <div v-if="appointment?.branchName" class="appointment-quick-actions__detail">
            <v-icon size="18" class="mr-2">mdi-store-outline</v-icon>
            <span>{{ appointment.branchName }}</span>
          </div>
        </div>

        <v-divider class="my-4" />

        <div class="appointment-quick-actions__section-label text-overline text-medium-emphasis mb-3">
          Contacto del cliente
        </div>

        <AppointmentClientContact :appointment="appointment" />

        <template v-if="canManage && appointment">
          <v-divider class="my-4" />

          <div class="appointment-quick-actions__section-label text-overline text-medium-emphasis mb-2">
            Acciones
          </div>

          <div class="appointment-quick-actions__buttons">
            <v-btn
              variant="tonal"
              color="primary"
              rounded="lg"
              block
              @click="handleEdit"
            >
              <v-icon start>mdi-pencil</v-icon>
              Editar cita
            </v-btn>

            <v-btn
              v-for="action in statusActions"
              :key="action.status"
              variant="tonal"
              :color="action.color"
              rounded="lg"
              block
              @click="handleStatusChange(action.status)"
            >
              <v-icon start>{{ action.icon }}</v-icon>
              {{ action.label }}
            </v-btn>

            <v-btn
              variant="tonal"
              color="error"
              rounded="lg"
              block
              @click="handleDelete"
            >
              <v-icon start>mdi-delete</v-icon>
              Eliminar cita
            </v-btn>
          </div>
        </template>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4 pa-sm-5">
        <v-btn
          class="flex-grow-1"
          variant="text"
          color="primary"
          rounded="lg"
          size="large"
          @click="handleClose"
        >
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { formatDateDisplay, formatTimeDisplay, splitIsoDateTime } from "~/helpers/dateTimeHelpers"
import type { Appointment, AppointmentStatus } from "~/interfaces/appointmentInterfaces"
import {
  APPOINTMENT_STATUS_ACTION_COLORS,
  APPOINTMENT_STATUS_ACTION_ICONS,
  APPOINTMENT_STATUS_ACTION_LABELS,
  getAppointmentStatusActions,
  getAppointmentStatusColor,
  getAppointmentStatusLabel,
} from "~/interfaces/appointmentInterfaces"
import { useAuthStore } from "~/store/modules/auth"

const props = defineProps<{
  modelValue: boolean
  appointment?: Appointment | null
}>()

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void
  (e: "edit", appointment: Appointment): void
  (e: "status-change", payload: { appointment: Appointment; status: AppointmentStatus }): void
  (e: "delete", appointment: Appointment): void
}>()

const authStore = useAuthStore()

const model = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
})

const canManage = computed(() => authStore.canManageAppointments)

const appointmentSummary = computed(() => {
  if (!props.appointment?.startAt) return "—"

  const { date, time } = splitIsoDateTime(props.appointment.startAt)
  const endTime = props.appointment.endAt
    ? formatTimeDisplay(splitIsoDateTime(props.appointment.endAt).time)
    : ""

  const startLabel = `${formatDateDisplay(date)} · ${formatTimeDisplay(time)}`
  return endTime ? `${startLabel} – ${endTime}` : startLabel
})

const statusActions = computed(() => {
  if (!props.appointment?.status) return []

  return getAppointmentStatusActions(props.appointment.status).map((status) => ({
    status,
    label:
      APPOINTMENT_STATUS_ACTION_LABELS[status] ?? getAppointmentStatusLabel(status),
    icon: APPOINTMENT_STATUS_ACTION_ICONS[status] ?? "mdi-circle-outline",
    color: APPOINTMENT_STATUS_ACTION_COLORS[status] ?? "primary",
  }))
})

const handleClose = () => {
  model.value = false
}

const handleEdit = () => {
  if (!props.appointment) return
  emit("edit", props.appointment)
  model.value = false
}

const handleStatusChange = (status: AppointmentStatus) => {
  if (!props.appointment) return
  emit("status-change", { appointment: props.appointment, status })
  model.value = false
}

const handleDelete = () => {
  if (!props.appointment) return
  emit("delete", props.appointment)
  model.value = false
}
</script>

<style scoped>
.appointment-quick-actions {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  overflow: hidden;
}

.appointment-quick-actions__header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.appointment-quick-actions__summary {
  min-width: 0;
}

.appointment-quick-actions__details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.appointment-quick-actions__detail {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: rgba(var(--v-theme-on-surface), 0.82);
}

.appointment-quick-actions__buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
