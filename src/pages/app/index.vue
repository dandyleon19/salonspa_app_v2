<template>
  <div class="dashboard">
    <v-card class="dashboard__welcome mb-4" rounded="xl" elevation="0">
      <v-card-text class="pa-5 pa-md-6">
        <div class="d-flex align-center justify-space-between flex-wrap ga-4">
          <div class="d-flex align-center ga-4">
            <v-avatar size="64" color="primary" class="dashboard__avatar">
              <span class="text-h6 font-weight-bold text-white">
                {{ userInitials }}
              </span>
            </v-avatar>

            <div>
              <p class="text-overline text-medium-emphasis mb-1">
                {{ roleLabel }}
              </p>
              <h1 class="text-h5 text-md-h4 font-weight-bold mb-1">
                Bienvenida, {{ userName }}
              </h1>
              <p v-if="salonName" class="text-body-2 text-medium-emphasis mb-0">
                {{ salonName }}
              </p>
              <p class="text-caption text-medium-emphasis mt-2 mb-0">
                {{ selectedDateLabel }}
              </p>
            </div>
          </div>

          <v-btn
            to="/app/appointments"
            variant="tonal"
            color="primary"
            rounded="lg"
            prepend-icon="mdi-calendar-month-outline"
          >
            Ver citas
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="dashboard__filters mb-4" rounded="xl" elevation="0">
      <v-card-text class="pa-4">
        <div class="dashboard__filters-inner">
          <v-text-field
            v-model="filterDate"
            label="Fecha"
            type="date"
            hide-details
            density="comfortable"
            variant="solo-filled"
            flat
            rounded="lg"
            class="dashboard__filter"
          />

          <v-select
            v-if="showAdvancedFilters"
            v-model="filterBranchId"
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
            class="dashboard__filter"
          />

          <v-select
            v-if="showAdvancedFilters"
            v-model="filterUserId"
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
            class="dashboard__filter"
          />
        </div>
      </v-card-text>
    </v-card>

    <v-row class="mb-4">
      <v-col
        v-for="stat in visibleStats"
        :key="stat.key"
        cols="12"
        sm="6"
        :lg="statCols"
      >
        <DashboardStatCard
          :label="stat.label"
          :value="stat.value"
          :icon="stat.icon"
          :color="stat.color"
          :loading="loading"
        />
      </v-col>
    </v-row>

    <v-row v-if="todayBreakdownStats.length" class="mb-4">
      <v-col
        v-for="stat in todayBreakdownStats"
        :key="stat.key"
        cols="6"
        sm="4"
        md="3"
        lg="2"
      >
        <DashboardStatCard
          :label="stat.label"
          :value="stat.value"
          :icon="stat.icon"
          :color="stat.color"
          :loading="loading"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="7">
        <v-card class="dashboard__panel" rounded="xl" elevation="0">
          <v-card-title class="d-flex align-center justify-space-between py-4 px-5">
            <div>
              <p class="text-subtitle-1 font-weight-bold mb-0">Agenda del día</p>
              <p class="text-caption text-medium-emphasis mb-0">
                {{ todaySchedule.length }} cita{{ todaySchedule.length === 1 ? "" : "s" }}
              </p>
            </div>
            <v-btn
              :to="appointmentsLink"
              variant="text"
              color="primary"
              size="small"
            >
              Ver todas
            </v-btn>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4">
            <AppSkeletonTransition>
              <v-skeleton-loader
                v-if="loading"
                key="dashboard-schedule-skeleton"
                type="list-item-two-line@4"
              />
              <div
                v-else-if="!todaySchedule.length"
                key="dashboard-schedule-empty"
                class="dashboard__empty"
              >
                <p class="text-body-2 text-medium-emphasis mb-0">
                  No hay citas programadas para esta fecha
                </p>
              </div>
              <div
                v-else
                key="dashboard-schedule-content"
                class="d-flex flex-column ga-2"
              >
                <DashboardAppointmentItem
                  v-for="appointment in todaySchedule"
                  :key="appointment.id ?? `${appointment.startAt}-${appointment.clientId}`"
                  :appointment="appointment"
                  :time-label="formatAppointmentTimeRange(appointment)"
                  @open-client-contact="openClientContact"
                />
              </div>
            </AppSkeletonTransition>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="5">
        <v-card class="dashboard__panel mb-4" rounded="xl" elevation="0">
          <v-card-title class="py-4 px-5">
            <p class="text-subtitle-1 font-weight-bold mb-0">Próximas citas</p>
            <p class="text-caption text-medium-emphasis mb-0">Siguientes citas activas</p>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4">
            <AppSkeletonTransition>
              <v-skeleton-loader
                v-if="loading"
                key="dashboard-upcoming-skeleton"
                type="list-item-two-line@3"
              />
              <div
                v-else-if="!upcomingAppointments.length"
                key="dashboard-upcoming-empty"
                class="dashboard__empty"
              >
                <p class="text-body-2 text-medium-emphasis mb-0">
                  No hay próximas citas
                </p>
              </div>
              <div
                v-else
                key="dashboard-upcoming-content"
                class="d-flex flex-column ga-2"
              >
                <DashboardAppointmentItem
                  v-for="appointment in upcomingAppointments"
                  :key="appointment.id ?? `${appointment.startAt}-${appointment.clientId}`"
                  :appointment="appointment"
                  :time-label="formatUpcomingAppointmentLabel(appointment)"
                  @open-client-contact="openClientContact"
                />
              </div>
            </AppSkeletonTransition>
          </v-card-text>
        </v-card>

        <v-card class="dashboard__panel" rounded="xl" elevation="0">
          <v-card-title class="py-4 px-5">
            <p class="text-subtitle-1 font-weight-bold mb-0">Resumen del mes</p>
            <p class="text-caption text-medium-emphasis mb-0">
              {{ monthLabel }}
            </p>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4">
            <AppSkeletonTransition>
              <v-skeleton-loader
                v-if="loading"
                key="dashboard-month-skeleton"
                type="chip@6"
              />
              <div
                v-else
                key="dashboard-month-content"
                class="d-flex flex-column ga-3"
              >
                <div class="d-flex flex-wrap ga-2">
                  <v-chip
                    v-for="item in monthStatusBreakdown"
                    :key="item.status"
                    size="small"
                    variant="tonal"
                    rounded="pill"
                    :color="item.color"
                  >
                    {{ item.label }}: {{ item.value }}
                  </v-chip>
                </div>

                <div class="d-flex flex-wrap ga-2">
                  <v-chip size="small" variant="outlined" color="error">
                    Canceladas: {{ dashboardData?.monthCancelled ?? 0 }}
                  </v-chip>
                  <v-chip size="small" variant="outlined" color="error">
                    No asistió: {{ dashboardData?.monthNoShow ?? 0 }}
                  </v-chip>
                </div>
              </div>
            </AppSkeletonTransition>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <AppointmentClientContactModal
      v-model="showClientContactModal"
      :appointment="selectedClientAppointment"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import type { Appointment, AppointmentStatus } from "~/interfaces/appointmentInterfaces"
import {
  APPOINTMENT_STATUS_LABELS,
  getAppointmentStatusColor,
} from "~/interfaces/appointmentInterfaces"
import type { DashboardFilters } from "~/interfaces/dashboardInterfaces"
import { useAuthStore } from "~/store/modules/auth"
import {
  useBranchesStore,
  useDashboardStore,
  useUsersStore,
} from "~/store"
import {
  areDashboardFiltersEqual,
  normalizeDashboardFilters,
} from "~/helpers/dashboardHelpers"
import {
  formatDateDisplay,
  formatTimeDisplay,
  getTodayDate,
  splitIsoDateTime,
} from "~/helpers/dateTimeHelpers"
import { CALENDAR_MONTH_LABELS } from "~/helpers/appointmentHelpers"

definePageMeta({
  layout: "app",
})

const authStore = useAuthStore()
const dashboardStore = useDashboardStore()
const branchesStore = useBranchesStore()
const usersStore = useUsersStore()

const filterDate = ref(getTodayDate())
const filterBranchId = ref<number | null>(null)
const filterUserId = ref<number | null>(null)
const activeFilters = ref<DashboardFilters>({ date: getTodayDate() })

const showClientContactModal = ref(false)
const selectedClientAppointment = ref<Appointment | null>(null)

const loading = computed(() => dashboardStore.loading)
const dashboardData = computed(() => dashboardStore.data)
const todaySchedule = computed(() => dashboardData.value?.todaySchedule ?? [])
const upcomingAppointments = computed(
  () => dashboardData.value?.upcomingAppointments ?? []
)

const userName = computed(
  () =>
    authStore.user?.fullName ||
    [authStore.user?.firstName, authStore.user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Usuario"
)

const userInitials = computed(() => {
  const user = authStore.user
  if (!user) return "U"
  const first = user.firstName?.charAt(0) ?? ""
  const last = user.lastName?.charAt(0) ?? ""
  return `${first}${last}`.toUpperCase() || "U"
})

const salonName = computed(() => (authStore.user as any)?.salonName ?? "")

const roleLabel = computed(() => {
  if (authStore.isSuperAdmin) return "Super administrador"
  if (authStore.isAdmin) return "Administrador"
  if (authStore.isStaff) return "Personal"
  return "Usuario"
})

const showAdvancedFilters = computed(
  () => authStore.isAdmin || authStore.isSuperAdmin
)

const selectedDateLabel = computed(() => {
  const date = dashboardData.value?.date ?? filterDate.value
  if (!date) return ""

  return new Date(`${date}T12:00:00`).toLocaleDateString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
})

const monthLabel = computed(() => {
  const data = dashboardData.value
  if (!data) return ""

  const monthName = CALENDAR_MONTH_LABELS[data.month - 1] ?? data.month
  return `${monthName} ${data.year}`
})

const statCols = computed(() => {
  const count = visibleStats.value.length
  if (count <= 3) return 4
  return 3
})

const visibleStats = computed(() => {
  const data = dashboardData.value

  return [
    {
      key: "totalClients",
      label: "Clientes",
      value: data?.totalClients ?? 0,
      icon: "mdi-account-outline",
      color: "primary",
    },
    {
      key: "activeUsers",
      label: "Usuarios activos",
      value: data?.activeUsers ?? 0,
      icon: "mdi-account-group-outline",
      color: "success",
    },
    {
      key: "todayAppointments",
      label: "Citas hoy",
      value: data?.todayAppointments ?? 0,
      icon: "mdi-calendar-today",
      color: "info",
    },
    {
      key: "monthAppointments",
      label: "Citas del mes",
      value: data?.monthAppointments ?? 0,
      icon: "mdi-calendar-month-outline",
      color: "warning",
    },
  ]
})

const todayBreakdownStats = computed(() => {
  const data = dashboardData.value
  if (!data) return []

  return [
    {
      key: "todayScheduled",
      label: "Agendadas",
      value: data.todayScheduled,
      icon: "mdi-clock-outline",
      color: "grey",
    },
    {
      key: "todayConfirmed",
      label: "Confirmadas",
      value: data.todayConfirmed,
      icon: "mdi-check-circle-outline",
      color: "primary",
    },
    {
      key: "todayInProgress",
      label: "En curso",
      value: data.todayInProgress,
      icon: "mdi-play-circle-outline",
      color: "warning",
    },
    {
      key: "todayCompleted",
      label: "Completadas",
      value: data.todayCompleted,
      icon: "mdi-check-all",
      color: "success",
    },
  ]
})

const monthStatusBreakdown = computed(() => {
  const byStatus = dashboardData.value?.appointmentsByStatus ?? {}

  return (Object.keys(APPOINTMENT_STATUS_LABELS) as AppointmentStatus[])
    .map((status) => ({
      status,
      label: APPOINTMENT_STATUS_LABELS[status],
      value: byStatus[status] ?? 0,
      color: getAppointmentStatusColor(status),
    }))
    .filter((item) => item.value > 0)
})

const branchFilterItems = computed(() =>
  (branchesStore.data?.content ?? []).map((branch) => ({
    title: branch.name,
    value: Number(branch.id),
  }))
)

const userFilterItems = computed(() =>
  (usersStore.data?.content ?? [])
    .filter((user) => user.isActive)
    .map((user) => ({
      title:
        user.fullName ||
        `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
      value: Number(user.id),
    }))
)

const appointmentsLink = computed(() => {
  const query = new URLSearchParams()
  const date = activeFilters.value.date ?? filterDate.value
  if (date) query.set("date", date)
  if (activeFilters.value.branchId != null) {
    query.set("branchId", String(activeFilters.value.branchId))
  }
  if (activeFilters.value.userId != null) {
    query.set("userId", String(activeFilters.value.userId))
  }

  const suffix = query.toString()
  return suffix ? `/app/appointments?${suffix}` : "/app/appointments"
})

const formatAppointmentTimeRange = (appointment: Appointment) => {
  const { time: startTime } = splitIsoDateTime(appointment.startAt)
  const { time: endTime } = splitIsoDateTime(appointment.endAt)
  const startLabel = formatTimeDisplay(startTime)
  const endLabel = formatTimeDisplay(endTime)

  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`
  return startLabel || "Sin hora"
}

const formatUpcomingAppointmentLabel = (appointment: Appointment) => {
  const { date, time } = splitIsoDateTime(appointment.startAt)
  const dateLabel = formatDateDisplay(date)
  const timeLabel = formatTimeDisplay(time)

  if (dateLabel && timeLabel) return `${dateLabel} · ${timeLabel}`
  return dateLabel || timeLabel || "Sin fecha"
}

const openClientContact = (appointment: Appointment) => {
  if (!appointment.clientName) return
  selectedClientAppointment.value = appointment
  showClientContactModal.value = true
}

const buildFiltersFromInputs = (): DashboardFilters =>
  normalizeDashboardFilters({
    date: filterDate.value,
    branchId: filterBranchId.value ?? undefined,
    userId: filterUserId.value ?? undefined,
  })

const fetchDashboard = async () => {
  await dashboardStore.fetchDashboard(activeFilters.value)
}

const loadFilterOptions = async () => {
  if (!showAdvancedFilters.value) return

  await Promise.allSettled([
    branchesStore.fetchBranches(0, 100),
    usersStore.fetchUsers(0, 100, { isActive: true }),
  ])
}

watch([filterDate, filterBranchId, filterUserId], () => {
  const nextFilters = buildFiltersFromInputs()

  if (areDashboardFiltersEqual(activeFilters.value, nextFilters)) {
    return
  }

  activeFilters.value = nextFilters
  fetchDashboard()
})

onMounted(async () => {
  await Promise.allSettled([fetchDashboard(), loadFilterOptions()])
})
</script>

<style scoped>
.dashboard {
  max-width: 1280px;
  margin: 0 auto;
}

.dashboard__welcome,
.dashboard__filters,
.dashboard__panel {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
}

.dashboard__welcome {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.08) 0%,
    rgba(var(--v-theme-surface), 1) 55%
  );
}

.dashboard__avatar {
  box-shadow: 0 8px 20px rgba(235, 88, 137, 0.25);
}

.dashboard__filters-inner {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.dashboard__filter {
  min-width: min(100%, 220px);
  flex: 1 1 220px;
}

.dashboard__empty {
  text-align: center;
}
</style>
