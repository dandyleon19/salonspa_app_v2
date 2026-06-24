<template>
  <v-card
    class="dashboard-appointment-item pa-3"
    variant="flat"
    rounded="lg"
  >
    <div class="d-flex align-start justify-space-between ga-3">
      <div class="min-width-0 flex-grow-1">
        <p class="text-caption text-medium-emphasis mb-1">
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
            class="text-caption text-medium-emphasis d-block"
          >
            {{ appointment.clientPhone }}
          </span>
        </button>
        <p
          v-if="appointment.serviceName"
          class="text-caption text-medium-emphasis mb-0 mt-1"
        >
          {{ appointment.serviceName }}
        </p>
      </div>

      <v-chip
        v-if="appointment.status"
        size="x-small"
        variant="tonal"
        rounded="pill"
        :color="getAppointmentStatusColor(appointment.status)"
      >
        {{ getAppointmentStatusLabel(appointment.status) }}
      </v-chip>
    </div>

    <div class="d-flex flex-wrap ga-2 mt-2">
      <v-chip
        v-if="appointment.userName"
        size="x-small"
        variant="tonal"
        prepend-icon="mdi-account-outline"
      >
        {{ appointment.userName }}
      </v-chip>
      <v-chip
        v-if="appointment.branchName"
        size="x-small"
        variant="tonal"
        prepend-icon="mdi-store-outline"
      >
        {{ appointment.branchName }}
      </v-chip>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import type { Appointment } from "~/interfaces/appointmentInterfaces"
import {
  getAppointmentStatusColor,
  getAppointmentStatusLabel,
} from "~/interfaces/appointmentInterfaces"

defineProps<{
  appointment: Appointment
  timeLabel: string
}>()

defineEmits<{
  (e: "openClientContact", appointment: Appointment): void
}>()
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
