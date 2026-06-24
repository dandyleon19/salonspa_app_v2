<template>
  <div class="appointment-calendar">
    <v-card class="appointment-calendar__toolbar" rounded="xl" elevation="0">
      <v-card-text class="pa-4 pa-md-5">
        <div class="appointment-calendar__toolbar-row">
          <div class="appointment-calendar__nav">
            <v-btn
              icon="mdi-chevron-left"
              variant="tonal"
              color="primary"
              rounded="lg"
              :disabled="loading"
              @click="goToPreviousMonth"
            />
            <AppMonthYearPicker
              v-model:year="currentYear"
              v-model:month="currentMonth"
              :disabled="loading"
              @change="fetchCalendar"
            />
            <v-btn
              icon="mdi-chevron-right"
              variant="tonal"
              color="primary"
              rounded="lg"
              :disabled="loading"
              @click="goToNextMonth"
            />
            <v-btn
              variant="tonal"
              color="primary"
              rounded="lg"
              size="small"
              :disabled="loading"
              @click="goToCurrentMonth"
            >
              Hoy
            </v-btn>
          </div>

          <v-chip
            v-if="totalAppointments !== null"
            color="primary"
            variant="tonal"
            prepend-icon="mdi-calendar-check"
          >
            {{ totalAppointments }} cita{{ totalAppointments === 1 ? "" : "s" }}
          </v-chip>
        </div>

        <div class="appointment-calendar__filters">
          <v-select
            v-model="selectedFilters.userId"
            label="Profesional"
            :items="userFilterItems"
            item-title="title"
            item-value="value"
            hide-details
            density="comfortable"
            variant="solo-filled"
            flat
            rounded="lg"
            clearable
            class="appointment-calendar__filter"
          />
          <v-select
            v-model="selectedFilters.branchId"
            label="Sucursal"
            :items="branchFilterItems"
            item-title="title"
            item-value="value"
            hide-details
            density="comfortable"
            variant="solo-filled"
            flat
            rounded="lg"
            clearable
            class="appointment-calendar__filter"
          />
          <v-select
            v-model="selectedFilters.status"
            label="Estado"
            :items="statusFilterItems"
            item-title="title"
            item-value="value"
            hide-details
            density="comfortable"
            variant="solo-filled"
            flat
            rounded="lg"
            clearable
            class="appointment-calendar__filter"
          />
        </div>
      </v-card-text>
    </v-card>

    <v-alert
      v-if="loadError"
      type="warning"
      variant="tonal"
      rounded="lg"
      class="mt-4"
    >
      {{ loadError }}
    </v-alert>

    <v-card class="appointment-calendar__grid-card mt-4" rounded="xl" elevation="0">
      <div class="appointment-calendar__weekdays">
        <div
          v-for="weekday in CALENDAR_WEEKDAY_LABELS"
          :key="weekday"
          class="appointment-calendar__weekday"
        >
          {{ weekday }}
        </div>
      </div>

      <div v-if="loading" class="appointment-calendar__loading pa-6">
        <v-skeleton-loader type="image" class="rounded-xl" />
      </div>

      <div v-else class="appointment-calendar__grid">
        <div
          v-for="cell in calendarCells"
          :key="cell.date"
          class="appointment-calendar__day"
          :class="{
            'appointment-calendar__day--muted': !cell.isCurrentMonth,
            'appointment-calendar__day--today': cell.isToday,
          }"
        >
          <div class="appointment-calendar__day-header">
            <span class="appointment-calendar__day-number">{{ cell.day }}</span>
            <v-chip
              v-if="getDayAppointments(cell.date).length"
              size="x-small"
              variant="tonal"
              color="primary"
            >
              {{ getDayAppointments(cell.date).length }}
            </v-chip>
          </div>

          <div class="appointment-calendar__day-events">
            <button
              v-for="appointment in getVisibleAppointments(cell.date)"
              :key="appointment.id"
              type="button"
              class="appointment-calendar__event"
              :class="{
                'appointment-calendar__event--inactive': isInactiveAppointmentStatus(
                  appointment.status
                ),
              }"
              @click="emit('select', appointment)"
            >
              <span class="appointment-calendar__event-time">
                {{ formatAppointmentTime(appointment.startAt) }}
              </span>
              <span class="appointment-calendar__event-title">
                {{ appointment.clientName || "Cliente" }}
              </span>
              <v-chip
                size="x-small"
                variant="tonal"
                rounded="pill"
                :color="getAppointmentStatusColor(appointment.status)"
                class="appointment-calendar__event-status"
              >
                {{ getAppointmentStatusLabel(appointment.status) }}
              </v-chip>
            </button>

            <button
              v-if="getHiddenCount(cell.date) > 0"
              type="button"
              class="appointment-calendar__more"
              @click="openDayDialog(cell.date)"
            >
              +{{ getHiddenCount(cell.date) }} más
            </button>
          </div>
        </div>
      </div>
    </v-card>

    <v-dialog v-model="dayDialogOpen" max-width="480">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-2 app-font-heading">
          {{ selectedDayLabel }}
        </v-card-title>
        <v-card-text class="pa-5 pt-2">
          <div
            v-if="!selectedDayAppointments.length"
            class="text-body-2 text-medium-emphasis"
          >
            No hay citas este día.
          </div>
          <div v-else class="appointment-calendar__dialog-list">
            <button
              v-for="appointment in selectedDayAppointments"
              :key="appointment.id"
              type="button"
              class="appointment-calendar__dialog-item"
              @click="handleDialogSelect(appointment)"
            >
              <div class="appointment-calendar__dialog-item-main">
                <span class="font-weight-medium">
                  {{ formatAppointmentTime(appointment.startAt) }}
                  ·
                  {{ appointment.clientName || "Cliente" }}
                </span>
                <span class="text-caption text-medium-emphasis">
                  {{ appointment.serviceName || "Servicio" }}
                  ·
                  {{ appointment.userName || "Profesional" }}
                </span>
              </div>
              <v-chip
                size="x-small"
                variant="tonal"
                rounded="pill"
                :color="getAppointmentStatusColor(appointment.status)"
              >
                {{ getAppointmentStatusLabel(appointment.status) }}
              </v-chip>
            </button>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-btn variant="text" rounded="lg" @click="dayDialogOpen = false">
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  areAppointmentCalendarFiltersEqual,
  buildCalendarMonthCells,
  CALENDAR_WEEKDAY_LABELS,
  groupAppointmentsByDay,
  normalizeAppointmentCalendarFilters,
} from "~/helpers/appointmentHelpers"
import { formatDateDisplay, formatTimeDisplay, splitIsoDateTime } from "~/helpers/dateTimeHelpers"
import type { Appointment, AppointmentCalendarFilters } from "~/interfaces/appointmentInterfaces"
import {
  APPOINTMENT_STATUS_OPTIONS,
  getAppointmentStatusColor,
  getAppointmentStatusLabel,
  isInactiveAppointmentStatus,
} from "~/interfaces/appointmentInterfaces"
import { useAppointmentsStore, useBranchesStore, useUsersStore } from "~/store"

const MAX_VISIBLE_EVENTS = 3

const emit = defineEmits<{
  (e: "select", appointment: Appointment): void
}>()

const appointmentsStore = useAppointmentsStore()
const branchesStore = useBranchesStore()
const usersStore = useUsersStore()
const { notifyError } = useApiNotification()

const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth() + 1)
const selectedFilters = ref<Record<string, unknown>>({})
const activeFilters = ref<AppointmentCalendarFilters>({})
const loadError = ref("")
const dayDialogOpen = ref(false)
const selectedDay = ref("")

const loading = computed(() => appointmentsStore.calendarLoading)
const totalAppointments = computed(
  () => appointmentsStore.calendarData?.total ?? null
)
const calendarCells = computed(() =>
  buildCalendarMonthCells(currentYear.value, currentMonth.value)
)
const appointmentsByDay = computed(() =>
  groupAppointmentsByDay(appointmentsStore.calendarData?.appointments ?? [])
)

const userFilterItems = computed(() =>
  (usersStore.data?.content ?? []).map((user) => ({
    title: user.fullName || `${user.firstName} ${user.lastName}`.trim(),
    value: Number(user.id),
  }))
)

const branchFilterItems = computed(() =>
  (branchesStore.data?.content ?? []).map((branch) => ({
    title: branch.name,
    value: Number(branch.id),
  }))
)

const statusFilterItems = computed(() =>
  APPOINTMENT_STATUS_OPTIONS.map((option) => ({
    title: option.label,
    value: option.value,
  }))
)

const selectedDayAppointments = computed(() =>
  selectedDay.value ? getDayAppointments(selectedDay.value) : []
)

const selectedDayLabel = computed(() =>
  selectedDay.value ? formatDateDisplay(selectedDay.value) : ""
)

const getDayAppointments = (date: string) => appointmentsByDay.value[date] ?? []

const getVisibleAppointments = (date: string) =>
  getDayAppointments(date).slice(0, MAX_VISIBLE_EVENTS)

const getHiddenCount = (date: string) =>
  Math.max(0, getDayAppointments(date).length - MAX_VISIBLE_EVENTS)

const formatAppointmentTime = (startAt: string) => {
  const { time } = splitIsoDateTime(startAt)
  return formatTimeDisplay(time)
}

const fetchCalendar = async () => {
  loadError.value = ""
  try {
    await appointmentsStore.fetchAppointmentsCalendar(
      currentYear.value,
      currentMonth.value,
      activeFilters.value
    )
  } catch (err) {
    loadError.value =
      "No se pudo cargar el calendario. Si el mes tiene muchas citas, filtra por sucursal o profesional."
    notifyError(err, "cargar el calendario de citas")
  }
}

const applyFilters = () => {
  const nextFilters = normalizeAppointmentCalendarFilters(selectedFilters.value)
  if (areAppointmentCalendarFiltersEqual(activeFilters.value, nextFilters)) {
    return
  }
  activeFilters.value = nextFilters
  fetchCalendar()
}

const goToPreviousMonth = () => {
  if (currentMonth.value === 1) {
    currentYear.value -= 1
    currentMonth.value = 12
  } else {
    currentMonth.value -= 1
  }
  fetchCalendar()
}

const goToNextMonth = () => {
  if (currentMonth.value === 12) {
    currentYear.value += 1
    currentMonth.value = 1
  } else {
    currentMonth.value += 1
  }
  fetchCalendar()
}

const goToCurrentMonth = () => {
  const today = new Date()
  currentYear.value = today.getFullYear()
  currentMonth.value = today.getMonth() + 1
  fetchCalendar()
}

const openDayDialog = (date: string) => {
  selectedDay.value = date
  dayDialogOpen.value = true
}

const handleDialogSelect = (appointment: Appointment) => {
  dayDialogOpen.value = false
  emit("select", appointment)
}

watch(selectedFilters, applyFilters, { deep: true })

onMounted(async () => {
  await Promise.all([
    branchesStore.fetchBranches(0, 100),
    usersStore.fetchUsers(0, 100),
    fetchCalendar(),
  ])
})

defineExpose({
  refresh: fetchCalendar,
})
</script>

<style scoped>
.appointment-calendar__toolbar,
.appointment-calendar__grid-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.appointment-calendar__toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.appointment-calendar__nav {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.appointment-calendar__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.appointment-calendar__filter {
  min-width: 180px;
  max-width: 240px;
  flex: 1 1 180px;
}

.appointment-calendar__weekdays,
.appointment-calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.appointment-calendar__weekday {
  padding: 12px 8px;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(var(--v-theme-on-surface), 0.62);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.appointment-calendar__day {
  min-height: 132px;
  padding: 8px;
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
}

.appointment-calendar__day:nth-child(7n) {
  border-right: none;
}

.appointment-calendar__day--muted {
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.appointment-calendar__day--today {
  background: rgba(var(--v-theme-primary), 0.06);
}

.appointment-calendar__day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 8px;
}

.appointment-calendar__day-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.75rem;
  height: 1.75rem;
  font-size: 0.875rem;
  font-weight: 700;
}

.appointment-calendar__day--today .appointment-calendar__day-number {
  border-radius: 999px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.appointment-calendar__day-events {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.appointment-calendar__event {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  padding: 6px 8px;
  border: 0;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.08);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.appointment-calendar__event:hover {
  background: rgba(var(--v-theme-primary), 0.14);
  transform: translateY(-1px);
}

.appointment-calendar__event--inactive {
  opacity: 0.72;
  background: rgba(var(--v-theme-on-surface), 0.06);
}

.appointment-calendar__event-time {
  font-size: 0.72rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
}

.appointment-calendar__event-title {
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.2;
}

.appointment-calendar__event-status {
  margin-top: 2px;
}

.appointment-calendar__more {
  border: 0;
  background: transparent;
  color: rgb(var(--v-theme-primary));
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 4px;
  cursor: pointer;
  text-align: left;
}

.appointment-calendar__dialog-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.appointment-calendar__dialog-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
  text-align: left;
}

.appointment-calendar__dialog-item:hover {
  background: rgba(var(--v-theme-primary), 0.05);
}

.appointment-calendar__dialog-item-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

@media (max-width: 960px) {
  .appointment-calendar__day {
    min-height: 108px;
    padding: 6px;
  }

  .appointment-calendar__event-title,
  .appointment-calendar__event-status {
    display: none;
  }
}
</style>
