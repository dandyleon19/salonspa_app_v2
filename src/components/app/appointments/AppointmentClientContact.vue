<template>
  <div class="appointment-client-contact">
    <div class="appointment-client-contact__item">
      <v-icon size="18" class="appointment-client-contact__icon">
        mdi-phone-outline
      </v-icon>
      <div class="appointment-client-contact__content">
        <span class="appointment-client-contact__label">Teléfono</span>
        <a
          v-if="appointment?.clientPhone"
          :href="`tel:${appointment.clientPhone}`"
          class="appointment-client-contact__value appointment-client-contact__link"
        >
          {{ appointment.clientPhone }}
        </a>
        <span v-else class="appointment-client-contact__value text-medium-emphasis">
          —
        </span>
      </div>
    </div>

    <div class="appointment-client-contact__item">
      <v-icon size="18" class="appointment-client-contact__icon">
        mdi-email-outline
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
        mdi-cake-variant-outline
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
        mdi-human-male-female
      </v-icon>
      <div class="appointment-client-contact__content">
        <span class="appointment-client-contact__label">Género</span>
        <span class="appointment-client-contact__value">
          {{ formatAppointmentClientGender(appointment?.clientGender) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  formatAppointmentClientBirthDate,
  formatAppointmentClientGender,
} from "~/helpers/appointmentClientHelpers"
import type { AppointmentClientContact } from "~/interfaces/appointmentInterfaces"

defineProps<{
  appointment?: AppointmentClientContact | null
}>()
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
</style>
