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
              <p class="text-body-2 text-medium-emphasis mt-2 mb-0">
                {{ selectedDateLabel }}
              </p>
            </div>
          </div>

          <v-btn
            to="/app/appointments"
            variant="tonal"
            color="primary"
            rounded="lg"
            prepend-icon="tabler:calendar-month"
          >
            Ver citas
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-row class="mb-4">
      <v-col
        v-for="stat in generalStats"
        :key="stat.key"
        cols="12"
        sm="6"
      >
        <DashboardStatCard
          :label="stat.label"
          :value="stat.value"
          :icon="stat.icon"
          :color="stat.color"
          :to="stat.to"
          :loading="loading"
        />
      </v-col>
    </v-row>

    <v-card v-if="showAdvancedFilters" class="dashboard__filters mb-4" rounded="xl" elevation="0">
      <v-card-text class="pa-4">
        <div class="dashboard__filters-inner">
          <v-select
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
        v-for="stat in salesStats"
        :key="stat.key"
        cols="12"
        sm="6"
        lg="4"
      >
        <DashboardStatCard
          :label="stat.label"
          :value="stat.value"
          :icon="stat.icon"
          :color="stat.color"
          :hint="stat.hint"
          :to="stat.to"
          :loading="salesReportLoading"
        />
      </v-col>
    </v-row>

    <v-card class="dashboard__panel mb-4" rounded="xl" elevation="0">
      <v-card-title class="d-flex align-center justify-space-between py-4 px-5">
        <p class="text-subtitle-1 font-weight-bold mb-0">Ventas del mes por día</p>
        <v-btn to="/app/sales" variant="text" color="primary" size="small">
          Ver todas
        </v-btn>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-4">
        <AppSkeletonTransition>
          <v-skeleton-loader
            v-if="salesReportLoading"
            key="dashboard-sales-trend-skeleton"
            type="image"
            height="120"
          />
          <div v-else key="dashboard-sales-trend-content">
            <div v-if="salesTrendPoints.length > 1" class="dashboard-sales-trend">
              <svg
                class="dashboard-sales-trend__svg"
                viewBox="0 0 100 40"
                preserveAspectRatio="none"
              >
                <line
                  v-for="tick in 3"
                  :key="tick"
                  x1="0"
                  :y1="(tick * 40) / 4"
                  x2="100"
                  :y2="(tick * 40) / 4"
                  class="dashboard-sales-trend__grid"
                  vector-effect="non-scaling-stroke"
                />
                <path :d="salesTrendAreaPath" class="dashboard-sales-trend__area" />
                <path
                  :d="salesTrendLinePath"
                  class="dashboard-sales-trend__line"
                  vector-effect="non-scaling-stroke"
                />
              </svg>

              <div class="dashboard-sales-trend__points">
                <v-tooltip
                  v-for="point in salesTrendPoints"
                  :key="point.date"
                  location="top"
                >
                  <template #activator="{ props }">
                    <div
                      v-bind="props"
                      class="dashboard-sales-trend__hit"
                      :style="{ left: `${point.x}%` }"
                    />
                  </template>
                  {{ formatDateDisplay(point.date) }}: {{ formatCurrency(point.revenue) }}
                </v-tooltip>
              </div>
            </div>
            <p v-else class="text-body-2 text-medium-emphasis mb-0">
              Aún no hay suficientes días con ventas para mostrar la tendencia
            </p>
          </div>
        </AppSkeletonTransition>
      </v-card-text>
    </v-card>

    <v-row class="mb-4">
      <v-col cols="12" :lg="showTopProfessionals ? 6 : 12">
        <v-card class="dashboard__panel" rounded="xl" elevation="0" style="height: 100%">
          <v-card-title class="d-flex align-center justify-space-between py-4 px-5">
            <p class="text-subtitle-1 font-weight-bold mb-0">
              {{ authStore.isStaff ? "Mis servicios top" : "Top servicios" }}
            </p>
            <v-btn to="/app/reports" variant="text" color="primary" size="small">
              Ver reporte
            </v-btn>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4">
            <AppSkeletonTransition>
              <v-skeleton-loader
                v-if="salesReportLoading"
                key="dashboard-top-services-skeleton"
                type="list-item@3"
              />
              <div v-else-if="!topServices.length" key="dashboard-top-services-empty" class="dashboard__empty">
                <p class="text-body-2 text-medium-emphasis mb-0">
                  Sin ventas registradas este mes
                </p>
              </div>
              <div v-else key="dashboard-top-services-content" class="d-flex flex-column ga-3">
                <div
                  v-for="(item, index) in topServices"
                  :key="item.serviceId"
                  class="dashboard-top-list__item"
                >
                  <div class="d-flex align-center justify-space-between ga-2">
                    <div class="d-flex align-center ga-2 min-width-0">
                      <span class="dashboard-top-list__rank">{{ index + 1 }}</span>
                      <span class="text-body-2 font-weight-medium text-truncate">
                        {{ item.serviceName }}
                      </span>
                    </div>
                    <span class="text-body-2 font-weight-bold flex-shrink-0">
                      {{ formatCurrency(item.revenue) }}
                    </span>
                  </div>
                  <div class="dashboard-top-list__bar-track">
                    <div
                      class="dashboard-top-list__bar-fill"
                      :style="{ width: `${(item.revenue / maxTopServiceRevenue) * 100}%` }"
                    />
                  </div>
                </div>
              </div>
            </AppSkeletonTransition>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col v-if="showTopProfessionals" cols="12" lg="6">
        <v-card class="dashboard__panel" rounded="xl" elevation="0" style="height: 100%">
          <v-card-title class="d-flex align-center justify-space-between py-4 px-5">
            <p class="text-subtitle-1 font-weight-bold mb-0">Top profesionales</p>
            <v-btn to="/app/reports" variant="text" color="primary" size="small">
              Ver reporte
            </v-btn>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4">
            <AppSkeletonTransition>
              <v-skeleton-loader
                v-if="salesReportLoading"
                key="dashboard-top-professionals-skeleton"
                type="list-item@3"
              />
              <div
                v-else-if="!topProfessionals.length"
                key="dashboard-top-professionals-empty"
                class="dashboard__empty"
              >
                <p class="text-body-2 text-medium-emphasis mb-0">
                  Sin ventas registradas este mes
                </p>
              </div>
              <div v-else key="dashboard-top-professionals-content" class="d-flex flex-column ga-3">
                <div
                  v-for="(item, index) in topProfessionals"
                  :key="item.userId"
                  class="dashboard-top-list__item"
                >
                  <div class="d-flex align-center justify-space-between ga-2">
                    <div class="d-flex align-center ga-2 min-width-0">
                      <span class="dashboard-top-list__rank">{{ index + 1 }}</span>
                      <span class="text-body-2 font-weight-medium text-truncate">
                        {{ item.userName }}
                      </span>
                    </div>
                    <span class="text-body-2 font-weight-bold flex-shrink-0">
                      {{ formatCurrency(item.revenue) }}
                    </span>
                  </div>
                  <div class="dashboard-top-list__bar-track">
                    <div
                      class="dashboard-top-list__bar-fill"
                      :style="{
                        width: `${(item.revenue / maxTopProfessionalRevenue) * 100}%`,
                      }"
                    />
                  </div>
                </div>
              </div>
            </AppSkeletonTransition>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

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
          :to="stat.to"
          :loading="loading"
        />
      </v-col>
    </v-row>

    <v-card
      v-if="todayBreakdownStats.length"
      class="dashboard__panel mb-4"
      rounded="xl"
      elevation="0"
    >
      <v-card-text class="pa-4">
        <p class="text-subtitle-1 font-weight-bold mb-3">Estado de citas de hoy</p>

        <AppSkeletonTransition>
          <v-skeleton-loader
            v-if="loading"
            key="dashboard-status-bar-skeleton"
            type="image"
            height="22"
          />
          <div v-else key="dashboard-status-bar-content">
            <div v-if="todayBreakdownTotal > 0" class="dashboard-status-bar">
              <v-tooltip
                v-for="(segment, index) in nonZeroBreakdownStats"
                :key="segment.key"
                location="top"
              >
                <template #activator="{ props }">
                  <div
                    v-bind="props"
                    class="dashboard-status-bar__segment"
                    :class="`bg-${segment.color}`"
                    :style="{
                      flexGrow: segment.value,
                      borderTopLeftRadius: index === 0 ? '4px' : 0,
                      borderBottomLeftRadius: index === 0 ? '4px' : 0,
                      borderTopRightRadius:
                        index === nonZeroBreakdownStats.length - 1 ? '4px' : 0,
                      borderBottomRightRadius:
                        index === nonZeroBreakdownStats.length - 1 ? '4px' : 0,
                    }"
                  />
                </template>
                {{ segment.label }}: {{ segment.value }}
              </v-tooltip>
            </div>
            <p v-else class="text-body-2 text-medium-emphasis mb-0 text-center">
              Sin citas registradas hoy
            </p>

            <div
              class="dashboard-status-bar__legend mt-3"
              :class="{ 'dashboard-status-bar__legend--center': !todayBreakdownTotal }"
            >
              <div
                v-for="stat in todayBreakdownStats"
                :key="stat.key"
                class="dashboard-status-bar__legend-item"
              >
                <span class="dashboard-status-bar__dot" :class="`bg-${stat.color}`" />
                <span class="text-body-2 text-medium-emphasis">{{ stat.label }}</span>
                <span class="text-body-2 font-weight-bold">{{ stat.value }}</span>
              </div>
            </div>
          </div>
        </AppSkeletonTransition>
      </v-card-text>
    </v-card>

    <v-row>
      <v-col cols="12" lg="7">
        <v-card class="dashboard__panel" rounded="xl" elevation="0">
          <v-card-title class="d-flex align-center justify-space-between py-4 px-5">
            <div>
              <p class="text-subtitle-1 font-weight-bold mb-0">Agenda del día</p>
              <p class="text-body-2 text-medium-emphasis mb-0">
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
          <v-card-title class="d-flex align-center justify-space-between py-4 px-5">
            <div>
              <p class="text-subtitle-1 font-weight-bold mb-0">Próximas citas</p>
              <p class="text-body-2 text-medium-emphasis mb-0">Siguientes citas activas</p>
            </div>
            <v-btn :to="upcomingAppointmentsLink" variant="text" color="primary" size="small">
              Ver todas
            </v-btn>
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
          <v-card-title class="d-flex align-center justify-space-between py-4 px-5">
            <div>
              <p class="text-subtitle-1 font-weight-bold mb-0">Resumen del mes</p>
              <p class="text-body-2 text-medium-emphasis mb-0">
                {{ monthLabel }}
              </p>
            </div>
            <v-btn to="/app/reports" variant="text" color="primary" size="small">
              Ver reporte
            </v-btn>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4">
            <AppSkeletonTransition>
              <v-skeleton-loader
                v-if="loading"
                key="dashboard-month-skeleton"
                type="image"
                height="22"
              />
              <div v-else key="dashboard-month-content">
                <div v-if="monthStatusBreakdown.length" class="dashboard-status-bar">
                  <v-tooltip
                    v-for="(item, index) in monthStatusBreakdown"
                    :key="item.status"
                    location="top"
                  >
                    <template #activator="{ props }">
                      <div
                        v-bind="props"
                        class="dashboard-status-bar__segment"
                        :class="`bg-${item.color}`"
                        :style="{
                          flexGrow: item.value,
                          borderTopLeftRadius: index === 0 ? '4px' : 0,
                          borderBottomLeftRadius: index === 0 ? '4px' : 0,
                          borderTopRightRadius:
                            index === monthStatusBreakdown.length - 1 ? '4px' : 0,
                          borderBottomRightRadius:
                            index === monthStatusBreakdown.length - 1 ? '4px' : 0,
                        }"
                      />
                    </template>
                    {{ item.label }}: {{ item.value }}
                  </v-tooltip>
                </div>
                <p v-else class="text-body-2 text-medium-emphasis mb-0 text-center">
                  Sin citas registradas este mes
                </p>

                <div
                  class="dashboard-status-bar__legend mt-3"
                  :class="{ 'dashboard-status-bar__legend--center': !monthStatusBreakdown.length }"
                >
                  <div
                    v-for="item in monthStatusBreakdown"
                    :key="item.status"
                    class="dashboard-status-bar__legend-item"
                  >
                    <span class="dashboard-status-bar__dot" :class="`bg-${item.color}`" />
                    <span class="text-body-2 text-medium-emphasis">{{ item.label }}</span>
                    <span class="text-body-2 font-weight-bold">{{ item.value }}</span>
                  </div>
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
  useSalesStore,
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
import { formatCurrency, getMonthDateRange } from "~/helpers/salesHelpers"
import { CALENDAR_MONTH_LABELS } from "~/helpers/appointmentHelpers"

definePageMeta({
  layout: "app",
})

const authStore = useAuthStore()
const dashboardStore = useDashboardStore()
const branchesStore = useBranchesStore()
const usersStore = useUsersStore()
const salesStore = useSalesStore()

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
  const date = dashboardData.value?.date ?? getTodayDate()
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

const salesReport = computed(() => salesStore.report)
const salesReportLoading = computed(() => salesStore.reportLoading)

const todayRevenue = computed(() => {
  const today = getTodayDate()
  const match = salesReport.value?.dailyBreakdown.find((item) => item.date === today)
  return match?.revenue ?? 0
})

const averageTicket = computed(() => {
  const report = salesReport.value
  if (!report || !report.totalSales) return 0
  return report.totalRevenue / report.totalSales
})

const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`

const salesTrendPoints = computed(() => {
  const report = salesReport.value
  if (!report) return []

  const dailyMap = new Map(report.dailyBreakdown.map((item) => [item.date, item.revenue]))
  const { from } = getMonthDateRange()
  const today = getTodayDate()

  const days: { date: string; revenue: number }[] = []
  const cursor = new Date(`${from}T00:00:00`)

  while (toIsoDate(cursor) <= today) {
    const iso = toIsoDate(cursor)
    days.push({ date: iso, revenue: dailyMap.get(iso) ?? 0 })
    cursor.setDate(cursor.getDate() + 1)
  }

  const maxRevenue = Math.max(...days.map((day) => day.revenue), 1)

  return days.map((day, index) => ({
    ...day,
    x: days.length > 1 ? (index / (days.length - 1)) * 100 : 50,
    y: 40 - (day.revenue / maxRevenue) * 34,
  }))
})

const salesTrendLinePath = computed(() =>
  salesTrendPoints.value
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ")
)

const salesTrendAreaPath = computed(() => {
  const points = salesTrendPoints.value
  if (!points.length) return ""

  const first = points[0]
  const last = points[points.length - 1]
  return `${salesTrendLinePath.value} L ${last.x} 40 L ${first.x} 40 Z`
})

const topServices = computed(() =>
  [...(salesReport.value?.topServices ?? [])]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3)
)

const maxTopServiceRevenue = computed(() =>
  Math.max(...topServices.value.map((item) => item.revenue), 1)
)

const showTopProfessionals = computed(
  () => authStore.isAdmin || authStore.isSuperAdmin
)

const topProfessionals = computed(() =>
  [...(salesReport.value?.byProfessional ?? [])]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3)
)

const maxTopProfessionalRevenue = computed(() =>
  Math.max(...topProfessionals.value.map((item) => item.revenue), 1)
)

const salesStats = computed(() => {
  const isStaff = authStore.isStaff

  return [
    {
      key: "todayRevenue",
      label: isStaff ? "Mis ventas de hoy" : "Ventas de hoy",
      value: formatCurrency(todayRevenue.value),
      icon: "tabler:cash",
      color: "success",
      to: "/app/sales",
    },
    {
      key: "monthRevenue",
      label: isStaff ? "Mis ventas del mes" : "Ventas del mes",
      value: formatCurrency(salesReport.value?.totalRevenue ?? 0),
      icon: "tabler:report-money",
      color: "primary",
      to: "/app/sales",
    },
    {
      key: "averageTicket",
      label: isStaff ? "Mi ticket promedio" : "Ticket promedio",
      value: formatCurrency(averageTicket.value),
      icon: "tabler:receipt",
      color: "info",
      hint: "Monto promedio por venta: ventas del mes ÷ número de ventas del mes",
      to: "/app/sales",
    },
  ]
})

const statCols = computed(() => {
  const count = visibleStats.value.length
  if (count <= 1) return 12
  if (count === 2) return 6
  if (count === 3) return 4
  return 3
})

const generalStats = computed(() => {
  const data = dashboardData.value

  return [
    {
      key: "totalClients",
      label: "Clientes",
      value: data?.totalClients ?? 0,
      icon: "tabler:user",
      color: "primary",
      to: authStore.isAdmin ? "/app/clients" : undefined,
    },
    {
      key: "activeUsers",
      label: "Usuarios activos",
      value: data?.activeUsers ?? 0,
      icon: "tabler:users-group",
      color: "success",
      to: authStore.isAdmin || authStore.isSuperAdmin ? "/app/users" : undefined,
    },
  ]
})

const visibleStats = computed(() => {
  const data = dashboardData.value

  return [
    {
      key: "todayAppointments",
      label: "Citas hoy",
      value: data?.todayAppointments ?? 0,
      icon: "tabler:calendar-event",
      color: "info",
      to: appointmentsLink.value,
    },
    {
      key: "monthAppointments",
      label: "Citas del mes",
      value: data?.monthAppointments ?? 0,
      icon: "tabler:calendar-month",
      color: "warning",
      to: appointmentsLink.value,
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
      icon: "tabler:clock",
      color: getAppointmentStatusColor("SCHEDULED"),
    },
    {
      key: "todayConfirmed",
      label: "Confirmadas",
      value: data.todayConfirmed,
      icon: "tabler:circle-check",
      color: getAppointmentStatusColor("CONFIRMED"),
    },
    {
      key: "todayInProgress",
      label: "En curso",
      value: data.todayInProgress,
      icon: "tabler:player-play",
      color: getAppointmentStatusColor("IN_PROGRESS"),
    },
    {
      key: "todayCompleted",
      label: "Completadas",
      value: data.todayCompleted,
      icon: "tabler:checks",
      color: getAppointmentStatusColor("COMPLETED"),
    },
  ]
})

const todayBreakdownTotal = computed(() =>
  todayBreakdownStats.value.reduce((sum, stat) => sum + (stat.value || 0), 0)
)

const nonZeroBreakdownStats = computed(() =>
  todayBreakdownStats.value.filter((stat) => stat.value > 0)
)

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

const buildAppointmentsLink = (date?: string) => {
  const query = new URLSearchParams()
  if (date) query.set("date", date)
  if (activeFilters.value.branchId != null) {
    query.set("branchId", String(activeFilters.value.branchId))
  }
  if (activeFilters.value.userId != null) {
    query.set("userId", String(activeFilters.value.userId))
  }

  const suffix = query.toString()
  return suffix ? `/app/appointments?${suffix}` : "/app/appointments"
}

const appointmentsLink = computed(() =>
  buildAppointmentsLink(activeFilters.value.date ?? getTodayDate())
)

const upcomingAppointmentsLink = computed(() => buildAppointmentsLink())

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
    date: getTodayDate(),
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

const fetchSalesSummary = async () => {
  const { from, to } = getMonthDateRange()
  await salesStore.fetchSalesReport({
    from,
    to,
    branchId: filterBranchId.value ?? undefined,
    userId: filterUserId.value ?? undefined,
  })
}

watch([filterBranchId, filterUserId], () => {
  const nextFilters = buildFiltersFromInputs()

  if (areDashboardFiltersEqual(activeFilters.value, nextFilters)) {
    return
  }

  activeFilters.value = nextFilters
  fetchDashboard()
})

watch([filterBranchId, filterUserId], () => {
  fetchSalesSummary()
})

onMounted(async () => {
  await Promise.allSettled([fetchDashboard(), loadFilterOptions(), fetchSalesSummary()])
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

.dashboard-status-bar {
  display: flex;
  align-items: stretch;
  height: 22px;
  gap: 2px;
}

.dashboard-status-bar__segment {
  min-width: 6px;
  cursor: default;
}

.dashboard-status-bar__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem 1rem;
}

.dashboard-status-bar__legend--center {
  justify-content: center;
}

.dashboard-status-bar__legend-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.dashboard-status-bar__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dashboard-sales-trend {
  position: relative;
  height: 120px;
}

.dashboard-sales-trend__svg {
  display: block;
  width: 100%;
  height: 100%;
}

.dashboard-sales-trend__grid {
  stroke: rgba(var(--v-border-color), var(--v-border-opacity));
  stroke-width: 1;
}

.dashboard-sales-trend__area {
  fill: rgba(var(--v-theme-primary), 0.1);
  stroke: none;
}

.dashboard-sales-trend__line {
  fill: none;
  stroke: rgb(var(--v-theme-primary));
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.dashboard-sales-trend__points {
  position: absolute;
  inset: 0;
}

.dashboard-sales-trend__hit {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 12px;
  transform: translateX(-50%);
  cursor: default;
}

.dashboard-top-list__rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  font-size: 0.7rem;
  font-weight: 700;
}

.dashboard-top-list__bar-track {
  height: 4px;
  border-radius: 2px;
  background: rgba(var(--v-border-color), var(--v-border-opacity));
  margin-top: 6px;
  overflow: hidden;
}

.dashboard-top-list__bar-fill {
  height: 100%;
  border-radius: 2px;
  background: rgb(var(--v-theme-primary));
}
</style>
