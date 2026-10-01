<template>
  <v-card
    class="dashboard-reminder-item pa-3"
    :class="{ 'dashboard-reminder-item--sent': sent }"
    variant="flat"
    rounded="lg"
  >
    <div class="d-flex align-start justify-space-between ga-3">
      <div class="min-width-0 flex-grow-1">
        <p class="text-body-2 text-medium-emphasis mb-1">
          {{ timeLabel }}
        </p>
        <span class="text-body-2 font-weight-medium d-block">
          {{ appointment.clientName || "Sin cliente" }}
        </span>
        <p
          v-if="appointment.serviceName"
          class="text-body-2 text-medium-emphasis mb-0 mt-1"
        >
          {{ appointment.serviceName }}
        </p>
      </div>

      <v-btn
        v-if="whatsAppLink"
        :color="sent ? 'success' : 'primary'"
        :variant="sent ? 'tonal' : 'flat'"
        size="small"
        rounded="lg"
        :prepend-icon="sent ? 'tabler:check' : 'tabler:brand-whatsapp'"
        @click="handleSend"
      >
        {{ sent ? "Enviado" : "Recordar" }}
      </v-btn>
      <span v-else class="text-caption text-medium-emphasis">
        Sin teléfono
      </span>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from "vue"
import type { Appointment } from "~/interfaces/appointmentInterfaces"
import { buildWhatsAppReminderLink } from "~/helpers/whatsappHelpers"

const props = defineProps<{
  appointment: Appointment
  timeLabel: string
  salonName?: string | null
  sent?: boolean
}>()

const emit = defineEmits<{
  (e: "sent", appointment: Appointment): void
}>()

const whatsAppLink = computed(() =>
  buildWhatsAppReminderLink(props.appointment, props.salonName)
)

const handleSend = () => {
  if (!whatsAppLink.value) return
  window.open(whatsAppLink.value, "_blank", "noopener")
  emit("sent", props.appointment)
}
</script>

<style scoped>
.dashboard-reminder-item {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.dashboard-reminder-item--sent {
  opacity: 0.65;
}
</style>
