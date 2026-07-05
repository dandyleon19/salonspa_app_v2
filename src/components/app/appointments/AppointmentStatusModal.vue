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

        <p
          v-if="showCompleteOptions"
          class="text-caption text-medium-emphasis mt-3 mb-0 text-center"
        >
          Puedes registrar la venta ahora o solo marcar la cita como completada.
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

      <v-card-actions
        class="appointment-status-modal__actions pa-4 pa-sm-5"
        :class="{ 'appointment-status-modal__actions--stacked': showCompleteOptions }"
      >
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

        <template v-if="showCompleteOptions">
          <v-btn
            class="flex-grow-1"
            variant="tonal"
            color="success"
            rounded="lg"
            size="large"
            @click="handleConfirmComplete(false)"
          >
            Solo completar
          </v-btn>
          <v-btn
            class="flex-grow-1"
            variant="flat"
            color="primary"
            rounded="lg"
            size="large"
            @click="handleConfirmComplete(true)"
          >
            <v-icon start>tabler:cash-register</v-icon>
            Completar y crear venta
          </v-btn>
        </template>

        <v-btn
          v-else
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
import { useAuthStore } from "~/store/modules/auth"

const props = defineProps<{
  modelValue: boolean
  targetStatus?: AppointmentStatus | null
  appointmentSummary?: string
  canCreateSale?: boolean
}>()

const authStore = useAuthStore()

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void
  (e: "confirm", payload: { cancellationReason?: string; createSale?: boolean }): void
}>()

const cancellationReason = ref("")

const model = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
})

const requiresCancellationReason = computed(
  () => props.targetStatus === "CANCELLED"
)

const canCreateSale = computed(
  () => props.canCreateSale ?? authStore.canManageSales
)

const showCompleteOptions = computed(
  () => props.targetStatus === "COMPLETED" && canCreateSale.value
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
  if (!props.targetStatus) return "tabler:help-circle"
  return APPOINTMENT_STATUS_ACTION_ICONS[props.targetStatus] ?? "tabler:help-circle"
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
  COMPLETED: "¿Cómo deseas finalizar esta cita?",
  CANCELLED: "Indica el motivo de la cancelación antes de continuar.",
  NO_SHOW: "¿Deseas marcar esta cita como no asistió?",
}

const modalTitle = computed(() => {
  if (!props.targetStatus) return "Confirmar cambio"
  return statusConfirmTitles[props.targetStatus] ?? "Confirmar cambio"
})

const modalMessage = computed(() => {
  let baseMessage = props.targetStatus
    ? statusConfirmMessages[props.targetStatus]
    : "¿Deseas continuar con este cambio?"

  if (props.targetStatus === "COMPLETED" && !canCreateSale.value) {
    baseMessage = "¿Deseas marcar esta cita como completada?"
  }

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

const handleConfirmComplete = (createSale: boolean) => {
  emit("confirm", { createSale })
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

.appointment-status-modal__actions--stacked {
  flex-wrap: wrap;
}
</style>
