<template>
  <v-dialog
    v-model="model"
    max-width="440"
    transition="dialog-transition"
  >
    <v-card class="appointment-client-contact-modal" rounded="xl" elevation="0">
      <v-card-text class="pa-6 pa-sm-7">
        <div class="appointment-client-contact-modal__header mb-5">
          <v-avatar size="52" color="primary" variant="tonal">
            <v-icon size="26">mdi-account-circle-outline</v-icon>
          </v-avatar>
          <div>
            <h2 class="text-h6 font-weight-bold app-font-heading mb-1">
              {{ clientName }}
            </h2>
            <p class="text-body-2 text-medium-emphasis mb-0">
              Datos de contacto del cliente
            </p>
          </div>
        </div>

        <AppointmentClientContact :appointment="appointment" />
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4 pa-sm-5">
        <v-btn
          class="flex-grow-1"
          variant="text"
          color="primary"
          rounded="lg"
          size="large"
          @click="model = false"
        >
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { AppointmentClientContact } from "~/interfaces/appointmentInterfaces"

const props = defineProps<{
  modelValue: boolean
  appointment?: AppointmentClientContact | null
}>()

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
})

const clientName = computed(
  () => props.appointment?.clientName?.trim() || "Cliente"
)
</script>

<style scoped>
.appointment-client-contact-modal {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  overflow: hidden;
}

.appointment-client-contact-modal__header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
</style>
