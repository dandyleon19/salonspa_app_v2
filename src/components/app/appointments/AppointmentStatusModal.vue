<template>
  <v-dialog
    v-model="model"
    max-width="440"
    transition="dialog-transition"
  >
    <v-card class="appointment-status-modal" rounded="xl" elevation="0">
      <v-card-text class="appointment-status-modal__body pa-6 pa-sm-7">
        <div class="appointment-status-modal__icon-wrap mb-4">
          <v-avatar size="52" :color="confirmColor" variant="tonal">
            <v-icon size="26">{{ confirmIcon }}</v-icon>
          </v-avatar>
        </div>

        <h2 class="text-h6 font-weight-bold mb-2 text-center app-font-heading">
          {{ modalTitle }}
        </h2>

        <p class="text-body-2 text-medium-emphasis mb-0 text-center">
          {{ modalMessage }}
        </p>

        <v-textarea
          v-if="requiresCancellationReason"
          v-model="cancellationReason"
          class="mt-5"
          label="Motivo de cancelación"
          placeholder="Ej. Cliente solicitó reprogramar"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          rows="3"
          hide-details="auto"
          autofocus
        />
      </v-card-text>

      <v-divider />

      <v-card-actions class="appointment-status-modal__actions pa-4 pa-sm-5">
        <v-btn
          class="flex-grow-1"
          variant="tonal"
          color="primary"
          rounded="lg"
          size="large"
          @click="handleCancel"
        >
          Volver
        </v-btn>

        <v-btn
          class="flex-grow-1"
          variant="flat"
          :color="confirmColor"
          rounded="lg"
          size="large"
          :disabled="confirmDisabled"
          @click="handleConfirm"
        >
          {{ confirmLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { AppointmentStatus } from "~/interfaces/appointmentInterfaces"
import {
  APPOINTMENT_STATUS_ACTION_COLORS,
  APPOINTMENT_STATUS_ACTION_ICONS,
  APPOINTMENT_STATUS_ACTION_LABELS,
} from "~/interfaces/appointmentInterfaces"

const props = defineProps<{
  modelValue: boolean
  targetStatus?: AppointmentStatus | null
  appointmentSummary?: string
}>()

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void
  (e: "confirm", payload: { cancellationReason?: string }): void
}>()

const cancellationReason = ref("")

const model = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
})

const requiresCancellationReason = computed(
  () => props.targetStatus === "CANCELLED"
)

const confirmLabel = computed(() => {
  if (!props.targetStatus) return "Confirmar"
  return APPOINTMENT_STATUS_ACTION_LABELS[props.targetStatus] ?? "Confirmar"
})

const confirmColor = computed(() => {
  if (!props.targetStatus) return "primary"
  return APPOINTMENT_STATUS_ACTION_COLORS[props.targetStatus] ?? "primary"
})

const confirmIcon = computed(() => {
  if (!props.targetStatus) return "mdi-help-circle-outline"
  return APPOINTMENT_STATUS_ACTION_ICONS[props.targetStatus] ?? "mdi-help-circle-outline"
})

const statusConfirmTitles: Partial<Record<AppointmentStatus, string>> = {
  CONFIRMED: "Confirmar cita",
  IN_PROGRESS: "Iniciar cita",
  COMPLETED: "Finalizar cita",
  CANCELLED: "Cancelar cita",
  NO_SHOW: "Marcar no asistió",
}

const statusConfirmMessages: Partial<Record<AppointmentStatus, string>> = {
  CONFIRMED: "¿Deseas confirmar esta cita?",
  IN_PROGRESS: "¿Deseas iniciar esta cita?",
  COMPLETED: "¿Deseas marcar esta cita como completada?",
  CANCELLED: "Indica el motivo de la cancelación antes de continuar.",
  NO_SHOW: "¿Deseas marcar esta cita como no asistió?",
}

const modalTitle = computed(() => {
  if (!props.targetStatus) return "Confirmar cambio"
  return statusConfirmTitles[props.targetStatus] ?? "Confirmar cambio"
})

const modalMessage = computed(() => {
  const baseMessage = props.targetStatus
    ? statusConfirmMessages[props.targetStatus]
    : "¿Deseas continuar con este cambio?"

  if (!props.appointmentSummary) return baseMessage ?? ""
  return `${baseMessage} ${props.appointmentSummary}`
})

const confirmDisabled = computed(() => {
  if (!requiresCancellationReason.value) return false
  return !cancellationReason.value.trim()
})

const handleCancel = () => {
  model.value = false
}

const handleConfirm = () => {
  if (confirmDisabled.value) return

  emit("confirm", {
    cancellationReason: requiresCancellationReason.value
      ? cancellationReason.value.trim()
      : undefined,
  })
  model.value = false
}

watch(model, (value) => {
  if (!value) cancellationReason.value = ""
})
</script>

<style scoped>
.appointment-status-modal {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  overflow: hidden;
}

.appointment-status-modal__icon-wrap {
  display: flex;
  justify-content: center;
}

.appointment-status-modal__actions {
  gap: 10px;
}
</style>
