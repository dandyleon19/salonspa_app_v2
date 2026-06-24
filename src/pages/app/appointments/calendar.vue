<template>
  <AppointmentCalendar ref="calendarRef" @select="handleSelectAppointment" />

  <AppointmentQuickActionsModal
    v-model="showQuickActions"
    :appointment="selectedAppointment"
    @edit="handleEditAppointment"
    @status-change="handleStatusChange"
    @delete="handleDeleteAppointment"
  />
</template>

<script setup lang="ts">
import type { Appointment, AppointmentStatus } from "~/interfaces/appointmentInterfaces"
import { useAppointmentManagement } from "~/composables/useAppointmentManagement"

const management = useAppointmentManagement()
const calendarRef = ref<{ refresh: () => Promise<void> } | null>(null)

const showQuickActions = ref(false)
const selectedAppointment = ref<Appointment | null>(null)

const handleSelectAppointment = (appointment: Appointment) => {
  selectedAppointment.value = appointment
  showQuickActions.value = true
}

const handleEditAppointment = (appointment: Appointment) => {
  if (appointment.id == null) return
  management.openEdit(appointment.id)
}

const handleStatusChange = ({
  appointment,
  status,
}: {
  appointment: Appointment
  status: AppointmentStatus
}) => {
  management.openStatusChange(appointment, status)
}

const handleDeleteAppointment = (appointment: Appointment) => {
  management.openDelete(appointment)
}

const refreshCalendar = async () => {
  await calendarRef.value?.refresh()
}

watch(showQuickActions, (open) => {
  if (!open) selectedAppointment.value = null
})

onMounted(() => {
  management.registerRefresh(refreshCalendar)
})
</script>
