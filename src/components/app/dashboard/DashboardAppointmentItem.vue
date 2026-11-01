<template>
  <v-card
    class="dashboard-appointment-item pa-3"
    variant="flat"
    rounded="lg"
  >
    <div class="d-flex align-start justify-space-between ga-3">
      <div class="min-width-0 flex-grow-1">
        <p class="text-body-2 text-medium-emphasis mb-1">
          {{ timeLabel }}
        </p>
        <button
          type="button"
          class="dashboard-appointment-item__client"
          :disabled="!appointment.clientName"
          @click="$emit('openClientContact', appointment)"
        >
          <span class="text-body-2 font-weight-medium">
            {{ appointment.clientName || "Sin cliente" }}
          </span>
          <span
            v-if="appointment.clientPhone"
            class="text-body-2 text-medium-emphasis d-block"
          >
            {{ appointment.clientPhone }}
          </span>
        </button>
        <p
          v-if="appointment.serviceName"
          class="text-body-2 text-medium-emphasis mb-0 mt-1"
        >
          {{ appointment.serviceName }}
        </p>
      </div>

      <div class="d-flex flex-column align-end ga-2">
        <v-chip
          v-if="appointment.status"
          size="small"
          variant="tonal"
          :color="getAppointmentStatusColor(appointment.status)"
        >
          {{ getAppointmentStatusLabel(appointment.status) }}
        </v-chip>

        <template v-if="showReminderAction && whatsAppLink">
          <v-btn
            :color="sent ? 'success' : 'primary'"
            :variant="sent ? 'tonal' : 'flat'"
            size="small"
            rounded="lg"
            :loading="sending"
            :prepend-icon="sent ? 'tabler:rotate-clockwise' : 'tabler:brand-whatsapp'"
            @click="handleSend"
          >
            {{ sent ? "Reenviar" : "Recordar" }}
          </v-btn>
          <span v-if="sent" class="text-caption text-medium-emphasis">
            Enviado {{ sentAtLabel }}
          </span>
        </template>
        <span
          v-else-if="showReminderAction"
          class="text-caption text-medium-emphasis"
        >
          Sin número
        </span>
      </div>
    </div>

    <div class="d-flex flex-wrap ga-2 mt-2">
      <v-chip
        v-if="appointment.userName"
        size="small"
        variant="tonal"
        prepend-icon="tabler:user"
      >
        {{ appointment.userName }}
      </v-chip>
      <v-chip
        v-if="appointment.branchName"
        size="small"
        variant="tonal"
        prepend-icon="tabler:building-store"
      >
        {{ appointment.branchName }}
      </v-chip>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import type { Appointment } from "~/interfaces/appointmentInterfaces"
import {
  getAppointmentStatusColor,
  getAppointmentStatusLabel,
} from "~/interfaces/appointmentInterfaces"
import { buildWhatsAppReminderLink } from "~/helpers/whatsappHelpers"
import { formatDateDisplay, formatTimeDisplay, splitIsoDateTime } from "~/helpers/dateTimeHelpers"
import { useAppointmentsStore } from "~/store"

const props = defineProps<{
  appointment: Appointment
  timeLabel: string
  salonName?: string | null
  showReminderAction?: boolean
}>()

const emit = defineEmits<{
  (e: "openClientContact", appointment: Appointment): void
  (e: "sent", appointment: Appointment): void
}>()

const appointmentsStore = useAppointmentsStore()
const sending = ref(false)

const sent = computed(() => !!props.appointment.reminderSentAt)

const sentAtLabel = computed(() => {
  if (!props.appointment.reminderSentAt) return ""
  const { date, time } = splitIsoDateTime(props.appointment.reminderSentAt)
  return `${formatDateDisplay(date)} ${formatTimeDisplay(time)}`.trim()
})

const whatsAppLink = computed(() =>
  buildWhatsAppReminderLink(props.appointment, props.salonName)
)

const handleSend = async () => {
  if (!whatsAppLink.value || sending.value || props.appointment.id == null) return
  window.open(whatsAppLink.value, "_blank", "noopener")

  sending.value = true
  try {
    const updated = await appointmentsStore.markReminderSent(props.appointment.id)
    emit("sent", updated)
  } catch (err) {
    console.error("Error al registrar el recordatorio enviado:", err)
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.dashboard-appointment-item {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.dashboard-appointment-item__client {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: inherit;
}

.dashboard-appointment-item__client:disabled {
  cursor: default;
}

.dashboard-appointment-item__client:not(:disabled):hover .text-body-2 {
  color: rgb(var(--v-theme-primary));
}
</style>
