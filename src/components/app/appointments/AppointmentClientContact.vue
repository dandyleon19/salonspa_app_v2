<template>
  <div class="appointment-client-contact">
    <div class="appointment-client-contact__item">
      <v-icon size="18" class="appointment-client-contact__icon">
        tabler:phone
      </v-icon>
      <div class="appointment-client-contact__content">
        <span class="appointment-client-contact__label">Teléfono</span>
        <span v-if="appointment?.clientPhone" class="appointment-client-contact__value">
          {{ appointment.clientPhone }}
        </span>
        <span v-else class="appointment-client-contact__value text-medium-emphasis">
          —
        </span>
      </div>
    </div>

    <div class="appointment-client-contact__item">
      <v-icon size="18" class="appointment-client-contact__icon">
        tabler:mail
      </v-icon>
      <div class="appointment-client-contact__content">
        <span class="appointment-client-contact__label">Correo</span>
        <a
          v-if="appointment?.clientEmail"
          :href="`mailto:${appointment.clientEmail}`"
          class="appointment-client-contact__value appointment-client-contact__link"
        >
          {{ appointment.clientEmail }}
        </a>
        <span v-else class="appointment-client-contact__value text-medium-emphasis">
          —
        </span>
      </div>
    </div>

    <div class="appointment-client-contact__item">
      <v-icon size="18" class="appointment-client-contact__icon">
        tabler:cake
      </v-icon>
      <div class="appointment-client-contact__content">
        <span class="appointment-client-contact__label">Cumpleaños</span>
        <span class="appointment-client-contact__value">
          {{ formatAppointmentClientBirthDate(appointment?.clientBirthDate) }}
        </span>
      </div>
    </div>

    <div class="appointment-client-contact__item">
      <v-icon size="18" class="appointment-client-contact__icon">
        tabler:gender-bigender
      </v-icon>
      <div class="appointment-client-contact__content">
        <span class="appointment-client-contact__label">Género</span>
        <span class="appointment-client-contact__value">
          {{ formatAppointmentClientGender(appointment?.clientGender) }}
        </span>
      </div>
    </div>

    <div v-if="appointment?.depositAmount" class="appointment-client-contact__item">
      <v-icon size="18" class="appointment-client-contact__icon">
        tabler:cash
      </v-icon>
      <div class="appointment-client-contact__content">
        <span class="appointment-client-contact__label">Adelanto</span>
        <span class="appointment-client-contact__value">
          {{ formatCurrency(appointment.depositAmount) }}
          <span v-if="appointment.depositPaymentMethod" class="text-medium-emphasis">
            ({{ getPaymentMethodLabel(appointment.depositPaymentMethod as PaymentMethod) }})
          </span>
        </span>
      </div>
    </div>

    <div v-if="timelineSteps.length" class="appointment-client-contact__timeline-section">
      <div class="appointment-client-contact__timeline">
        <div
          v-for="(step, index) in timelineSteps"
          :key="step.status"
          class="appointment-client-contact__timeline-step"
        >
          <div class="appointment-client-contact__timeline-track">
            <span
              v-if="index > 0"
              class="appointment-client-contact__timeline-line"
              :class="step.done ? `bg-${step.color}` : 'appointment-client-contact__timeline-line--pending'"
            />
            <span
              class="appointment-client-contact__timeline-dot"
              :class="step.done ? `bg-${step.color}` : 'appointment-client-contact__timeline-dot--pending'"
            >
              <v-icon size="14" :color="step.done ? 'white' : undefined">
                {{ step.icon }}
              </v-icon>
            </span>
          </div>
          <span
            class="appointment-client-contact__timeline-label"
            :class="{ 'text-medium-emphasis': !step.done }"
          >
            {{ step.label }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  formatAppointmentClientBirthDate,
  formatAppointmentClientGender,
} from "~/helpers/appointmentClientHelpers"
import {
  APPOINTMENT_STATUS_ACTION_ICONS,
  getAppointmentStatusColor,
  getAppointmentStatusLabel,
} from "~/interfaces/appointmentInterfaces"
import type { AppointmentClientContact, AppointmentStatus } from "~/interfaces/appointmentInterfaces"
import { getPaymentMethodLabel } from "~/interfaces/salesInterfaces"
import type { PaymentMethod } from "~/interfaces/salesInterfaces"
import { formatCurrency } from "~/helpers/salesHelpers"

const props = defineProps<{
  appointment?: AppointmentClientContact | null
}>()

const HAPPY_PATH: AppointmentStatus[] = ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED"]

const getStatusIcon = (status: AppointmentStatus) =>
  APPOINTMENT_STATUS_ACTION_ICONS[status] ?? "tabler:clock"

const timelineSteps = computed(() => {
  const status = props.appointment?.status
  if (!status) return []

  const statuses: AppointmentStatus[] =
    status === "CANCELLED" || status === "NO_SHOW" ? ["SCHEDULED", status] : HAPPY_PATH

  const currentIndex = statuses.indexOf(status)

  return statuses.map((stepStatus, index) => ({
    status: stepStatus,
    label: getAppointmentStatusLabel(stepStatus),
    color: getAppointmentStatusColor(stepStatus),
    icon: getStatusIcon(stepStatus),
    done: index <= currentIndex,
  }))
})
</script>

<style scoped>
.appointment-client-contact {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.appointment-client-contact__item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.appointment-client-contact__icon {
  margin-top: 2px;
  color: rgb(var(--v-theme-primary));
}

.appointment-client-contact__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.appointment-client-contact__label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.appointment-client-contact__value {
  font-size: 0.92rem;
  color: rgba(var(--v-theme-on-surface), 0.88);
  word-break: break-word;
}

.appointment-client-contact__link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.appointment-client-contact__link:hover {
  text-decoration: underline;
}

.appointment-client-contact__timeline-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 20px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.appointment-client-contact__timeline {
  display: flex;
  align-items: flex-start;
  overflow-x: auto;
  padding-bottom: 2px;
}

.appointment-client-contact__timeline-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1 0 64px;
  min-width: 64px;
  text-align: center;
}

.appointment-client-contact__timeline-track {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.appointment-client-contact__timeline-line {
  position: absolute;
  top: 50%;
  right: 50%;
  width: 100%;
  height: 2px;
  transform: translateY(-50%);
}

.appointment-client-contact__timeline-line--pending {
  background: rgba(var(--v-border-color), var(--v-border-opacity));
}

.appointment-client-contact__timeline-dot {
  position: relative;
  z-index: 1;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.appointment-client-contact__timeline-dot--pending {
  background: rgb(var(--v-theme-surface));
  border: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
  color: rgba(var(--v-theme-on-surface), 0.4);
}

.appointment-client-contact__timeline-label {
  font-size: 0.72rem;
  font-weight: 600;
  margin-top: 6px;
  color: rgba(var(--v-theme-on-surface), 0.88);
}
</style>
