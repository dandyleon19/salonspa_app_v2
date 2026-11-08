<template>
  <div class="dashboard">
    <!-- Welcome card: who you are and today's date on the left; the main actions on the right. -->
    <v-card class="dashboard-welcome" rounded="xl" elevation="0">
      <v-card-text class="dashboard-welcome__body">
        <div class="dashboard-welcome__identity">
          <v-avatar size="64" color="primary" class="dashboard-welcome__avatar">
            <span class="text-h6 font-weight-bold text-on-primary">{{ userInitials }}</span>
          </v-avatar>

          <div class="dashboard-welcome__text">
            <p class="dashboard-welcome__eyebrow">{{ roleLabel }}</p>
            <h1 class="dashboard-welcome__title">{{ greeting }}, {{ firstName }}</h1>
            <p v-if="salonName" class="dashboard-welcome__salon">
              <v-icon icon="tabler:building-store" size="16" />
              {{ salonName }}
            </p>
            <p class="dashboard-welcome__date">{{ dateLabel }}</p>
          </div>
        </div>

        <div class="dashboard-welcome__tools">
          <template v-if="showAdvancedFilters">
            <v-select
              v-model="filterBranchId"
              placeholder="Todas las sedes"
              :items="branchFilterItems"
              item-title="title"
              item-value="value"
              prepend-inner-icon="tabler:git-branch"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              class="dashboard-welcome__filter"
            />
            <RemoteSelect
              v-model="filterUserId"
              kind="user"
              :query="{ isActive: true }"
              placeholder="Todo el equipo"
              prepend-inner-icon="tabler:user"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              class="dashboard-welcome__filter"
            />
          </template>

          <v-btn :to="appointmentsLink" color="primary" prepend-icon="tabler:calendar-month" class="dashboard-welcome__action">
            Ver agenda
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- KPIs -->
    <section class="dashboard-kpis" aria-label="Indicadores principales">
      <DashboardStatCard
        v-for="kpi in kpis"
        :key="kpi.key"
        :label="kpi.label"
        :value="kpi.value"
        :icon="kpi.icon"
        :color="kpi.color"
        :caption="kpi.caption"
        :hint="kpi.hint"
        :to="kpi.to"
        :loading="kpi.loading"
      />
    </section>

    <!-- Secondary figures in one slim bar -->
    <section class="dashboard-pulse" aria-label="Resumen general">
      <component
        :is="item.to ? NuxtLinkComponent : 'div'"
        v-for="item in pulseStats"
        :key="item.key"
        v-bind="item.to ? { to: item.to } : {}"
        class="dashboard-pulse__item"
        :class="{ 'dashboard-pulse__item--link': item.to }"
      >
        <span class="dashboard-pulse__icon"><v-icon :icon="item.icon" size="18" /></span>
        <span class="dashboard-pulse__text">
          <span class="dashboard-pulse__label">{{ item.label }}</span>
          <v-skeleton-loader v-if="loading" type="text" width="40" />
          <span v-else class="dashboard-pulse__value">{{ item.value }}</span>
        </span>
      </component>
    </section>

    <!-- Sales evolution and appointment status -->
    <div class="dashboard-split dashboard-split--main">
      <DashboardPanel
        title="Ventas del mes"
        :subtitle="monthLabel"
        to="/app/sales"
        action-label="Ver ventas"
      >
        <div class="dashboard-sales-summary">
          <div class="dashboard-sales-summary__item">
            <span class="dashboard-sales-summary__label">Total del mes</span>
            <span class="dashboard-sales-summary__value">{{ formatCurrency(salesReport?.totalRevenue ?? 0) }}</span>
          </div>
          <div class="dashboard-sales-summary__item">
            <span class="dashboard-sales-summary__label">Mejor día</span>
            <span class="dashboard-sales-summary__value">
              {{ bestDay ? formatDateDisplay(bestDay.date) : "—" }}
            </span>
            <span v-if="bestDay" class="dashboard-sales-summary__hint">{{ formatCurrency(bestDay.revenue) }}</span>
          </div>
          <div class="dashboard-sales-summary__item">
            <span class="dashboard-sales-summary__label">Promedio diario</span>
            <span class="dashboard-sales-summary__value">{{ formatCurrency(dailyAverage) }}</span>
          </div>
        </div>

        <AppSkeletonTransition>
          <v-skeleton-loader v-if="salesReportLoading" key="sales-chart-skeleton" type="image" height="220" />
          <DashboardSalesChart v-else key="sales-chart" :points="salesDailyPoints" />
        </AppSkeletonTransition>
      </DashboardPanel>

      <DashboardPanel
        title="Estado de las citas"
        :subtitle="statusView === 'today' ? 'Hoy' : monthLabel"
        :to="upcomingAppointmentsLink"
        action-label="Ver citas"
      >
        <template #actions>
          <div class="dashboard-segmented" role="group" aria-label="Periodo">
            <button
              type="button"
              class="dashboard-segmented__option"
              :class="{ 'dashboard-segmented__option--active': statusView === 'today' }"
              :aria-pressed="statusView === 'today'"
              @click="statusView = 'today'"
            >
              Hoy
            </button>
            <button
              type="button"
              class="dashboard-segmented__option"
              :class="{ 'dashboard-segmented__option--active': statusView === 'month' }"
              :aria-pressed="statusView === 'month'"
              @click="statusView = 'month'"
            >
              Mes
            </button>
          </div>
        </template>

        <AppSkeletonTransition>
          <v-skeleton-loader v-if="loading" key="donut-skeleton" type="image" height="260" />
          <DashboardDonut
            v-else-if="donutTotal > 0"
            key="donut"
            :segments="donutSegments"
            center-label="citas"
          />
          <DashboardEmpty
            v-else
            key="donut-empty"
            icon="tabler:calendar-off"
            :title="statusView === 'today' ? 'Sin citas registradas hoy' : 'Sin citas registradas este mes'"
            hint="Cuando agendes citas verás aquí cómo van."
          />
        </AppSkeletonTransition>
      </DashboardPanel>
    </div>

    <!-- Agenda -->
    <div class="dashboard-split dashboard-split--halves">
      <DashboardPanel
        title="Agenda del día"
        :subtitle="`${todaySchedule.length} cita${todaySchedule.length === 1 ? '' : 's'} programada${todaySchedule.length === 1 ? '' : 's'}`"
        :to="appointmentsLink"
        action-label="Ver todas"
      >
        <AppSkeletonTransition>
          <v-skeleton-loader v-if="loading" key="schedule-skeleton" type="list-item-two-line@4" />
          <DashboardEmpty
            v-else-if="!todaySchedule.length"
            key="schedule-empty"
            icon="tabler:calendar-event"
            title="No hay citas programadas para hoy"
            hint="Las citas de hoy aparecerán aquí, ordenadas por hora."
          />
          <div v-else key="schedule-content" class="dashboard-list">
            <DashboardAppointmentItem
              v-for="appointment in todaySchedule"
              :key="appointment.id ?? `${appointment.startAt}-${appointment.clientId}`"
              :appointment="appointment"
              :time-label="formatAppointmentTimeRange(appointment)"
              @open-client-contact="openClientContact"
            />
          </div>
        </AppSkeletonTransition>
      </DashboardPanel>

      <DashboardPanel
        title="Próximas citas"
        subtitle="Las siguientes citas activas"
        :to="upcomingAppointmentsLink"
        action-label="Ver todas"
      >
        <AppSkeletonTransition>
          <v-skeleton-loader v-if="loading" key="upcoming-skeleton" type="list-item-two-line@4" />
          <DashboardEmpty
            v-else-if="!upcomingAppointments.length"
            key="upcoming-empty"
            icon="tabler:calendar-time"
            title="No hay próximas citas"
            hint="Las citas de los siguientes días aparecerán aquí."
          />
          <div v-else key="upcoming-content" class="dashboard-list">
            <DashboardAppointmentItem
              v-for="appointment in upcomingAppointments"
              :key="appointment.id ?? `${appointment.startAt}-${appointment.clientId}`"
              :appointment="appointment"
              :time-label="formatUpcomingAppointmentLabel(appointment)"
              :salon-name="salonName"
              :show-reminder-action="canSendReminders"
              @open-client-contact="openClientContact"
              @sent="handleReminderSent"
            />
          </div>
        </AppSkeletonTransition>
      </DashboardPanel>
    </div>

    <!-- Rankings and alerts -->
    <div class="dashboard-tops">
      <DashboardPanel
        :title="authStore.isStaff ? 'Mis servicios top' : 'Servicios top'"
        subtitle="Por ingresos del mes"
        to="/app/reports"
        action-label="Ver reporte"
      >
        <AppSkeletonTransition>
          <v-skeleton-loader v-if="salesReportLoading" key="services-skeleton" type="list-item@4" />
          <DashboardEmpty
            v-else-if="!topServiceItems.length"
            key="services-empty"
            icon="tabler:scissors"
            title="Sin ventas registradas este mes"
          />
          <DashboardRankList v-else key="services" :items="topServiceItems" />
        </AppSkeletonTransition>
      </DashboardPanel>

      <DashboardPanel
        v-if="showTopProfessionals"
        title="Profesionales top"
        subtitle="Por ingresos del mes"
        to="/app/reports"
        action-label="Ver reporte"
      >
        <AppSkeletonTransition>
          <v-skeleton-loader v-if="salesReportLoading" key="pros-skeleton" type="list-item@4" />
          <DashboardEmpty
            v-else-if="!topProfessionalItems.length"
            key="pros-empty"
            icon="tabler:users"
            title="Sin ventas registradas este mes"
          />
          <DashboardRankList v-else key="pros" :items="topProfessionalItems" />
        </AppSkeletonTransition>
      </DashboardPanel>

      <DashboardPanel
        v-if="showLowStock"
        title="Stock bajo"
        subtitle="En o por debajo de la alerta configurada"
        to="/app/product-categories"
        action-label="Ver productos"
      >
        <AppSkeletonTransition>
          <v-skeleton-loader v-if="lowStockLoading" key="stock-skeleton" type="list-item-two-line@3" />
          <DashboardEmpty
            v-else-if="!lowStockProducts.length"
            key="stock-empty"
            icon="tabler:package"
            title="Todo en orden"
            hint="Todos los productos activos tienen stock suficiente."
          />
          <ul v-else key="stock-content" class="dashboard-stock">
            <li v-for="product in lowStockProducts" :key="product.id" class="dashboard-stock__item">
              <div class="dashboard-stock__text">
                <span class="dashboard-stock__name">{{ product.name }}</span>
                <span class="dashboard-stock__qty">{{ product.stockQuantity ?? 0 }} en stock</span>
              </div>
              <v-chip
                size="small"
                variant="tonal"
                :color="getProductStockStatusColor(getProductStockStatus(product))"
              >
                {{ getProductStockStatusLabel(product) }}
              </v-chip>
            </li>
          </ul>
        </AppSkeletonTransition>
      </DashboardPanel>
    </div>

    <AppointmentClientContactModal
      v-model="showClientContactModal"
      :appointment="selectedClientAppointment"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, resolveComponent } from "vue"
import type { Appointment, AppointmentStatus } from "~/interfaces/appointmentInterfaces"
import { APPOINTMENT_STATUS_LABELS } from "~/interfaces/appointmentInterfaces"
import type { DashboardFilters } from "~/interfaces/dashboardInterfaces"
import { useAuthStore } from "~/store/modules/auth"
import { useProductsStore } from "~/store/modules/product"
import { useSubscriptionStore } from "~/store/modules/subscription"
import {
  useBranchesStore,
  useDashboardStore,
  useSalesStore,
} from "~/store"
import type { Product } from "~/interfaces/productInterfaces"
import {
  getProductStockStatus,
  getProductStockStatusColor,
  getProductStockStatusLabel,
} from "~/interfaces/productInterfaces"
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

const authStore = useAuthStore()
const dashboardStore = useDashboardStore()
const branchesStore = useBranchesStore()
const salesStore = useSalesStore()
const lowStockProductsStore = useProductsStore()
const subscriptionStore = useSubscriptionStore()

const NuxtLinkComponent = resolveComponent("NuxtLink")

const filterBranchId = ref<number | null>(null)
const filterUserId = ref<number | null>(null)
const activeFilters = ref<DashboardFilters>({ date: getTodayDate() })
const statusView = ref<"today" | "month">("today")

const showClientContactModal = ref(false)
const selectedClientAppointment = ref<Appointment | null>(null)

const loading = computed(() => dashboardStore.loading)
const dashboardData = computed(() => dashboardStore.data)
const todaySchedule = computed(() => dashboardData.value?.todaySchedule ?? [])
const upcomingAppointments = computed(
  () => dashboardData.value?.upcomingAppointments ?? []
)

// Plan features: the reminder button and the stock panel only appear when the salon's plan includes them.
const canSendReminders = computed(() => subscriptionStore.hasFeature("whatsapp_reminders"))
const canSeeProducts = computed(() => subscriptionStore.hasFeature("products"))

// ---------------------------------------------------------------- header

const userName = computed(
  () =>
    authStore.user?.fullName ||
    [authStore.user?.firstName, authStore.user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Usuario"
)

const firstName = computed(() => authStore.user?.firstName || userName.value.split(" ")[0])

const userInitials = computed(() => {
  const user = authStore.user
  if (!user) return "U"
  const first = user.firstName?.charAt(0) ?? ""
  const last = user.lastName?.charAt(0) ?? ""
  return `${first}${last}`.toUpperCase() || "U"
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return "Buenos días"
  if (hour < 19) return "Buenas tardes"
  return "Buenas noches"
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

const dateLabel = computed(() => {
  const date = dashboardData.value?.date ?? getTodayDate()
  if (!date) return ""

  const label = new Date(`${date}T12:00:00`).toLocaleDateString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
})

const monthLabel = computed(() => {
  const data = dashboardData.value
  if (!data) return ""

  const monthName = CALENDAR_MONTH_LABELS[data.month - 1] ?? data.month
  return `${monthName} ${data.year}`
})

// ---------------------------------------------------------------- sales

const salesReport = computed(() => salesStore.report)
const salesReportLoading = computed(() => salesStore.reportLoading)

const todaySales = computed(() => {
  const today = getTodayDate()
  return salesReport.value?.dailyBreakdown.find((item) => item.date === today)
})

const todayRevenue = computed(() => todaySales.value?.revenue ?? 0)

const averageTicket = computed(() => {
  const report = salesReport.value
  if (!report || !report.totalSales) return 0
  return report.totalRevenue / report.totalSales
})

const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`

// One entry per day of the month up to today; days without sales count as 0.
const salesDailyPoints = computed(() => {
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

  return days
})

const bestDay = computed(() => {
  const best = salesDailyPoints.value.reduce<{ date: string; revenue: number } | null>(
    (top, day) => (!top || day.revenue > top.revenue ? day : top),
    null
  )
  return best && best.revenue > 0 ? best : null
})

const dailyAverage = computed(() => {
  const days = salesDailyPoints.value.length
  return days ? (salesReport.value?.totalRevenue ?? 0) / days : 0
})

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

const topServiceItems = computed(() =>
  [...(salesReport.value?.topServices ?? [])]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((item) => ({
      key: item.serviceId,
      label: item.serviceName,
      value: item.revenue,
      valueLabel: formatCurrency(item.revenue),
    }))
)

const showTopProfessionals = computed(
  () => authStore.isAdmin || authStore.isSuperAdmin
)

const topProfessionalItems = computed(() =>
  [...(salesReport.value?.byProfessional ?? [])]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((item) => ({
      key: item.userId,
      label: item.userName,
      value: item.revenue,
      valueLabel: formatCurrency(item.revenue),
    }))
)

// ---------------------------------------------------------------- KPIs

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

const kpis = computed(() => {
  const isStaff = authStore.isStaff
  const data = dashboardData.value
  const report = salesReport.value

  return [
    {
      key: "todayRevenue",
      label: isStaff ? "Mis ventas de hoy" : "Ventas de hoy",
      value: formatCurrency(todayRevenue.value),
      caption: plural(todaySales.value?.salesCount ?? 0, "venta", "ventas"),
      icon: "tabler:cash",
      color: "success",
      to: "/app/sales",
      loading: salesReportLoading.value,
    },
    {
      key: "monthRevenue",
      label: isStaff ? "Mis ventas del mes" : "Ventas del mes",
      value: formatCurrency(report?.totalRevenue ?? 0),
      caption: plural(report?.totalSales ?? 0, "venta", "ventas"),
      icon: "tabler:report-money",
      color: "primary",
      to: "/app/sales",
      loading: salesReportLoading.value,
    },
    {
      key: "averageTicket",
      label: isStaff ? "Mi ticket promedio" : "Ticket promedio",
      value: formatCurrency(averageTicket.value),
      caption: "Por venta, en el mes",
      hint: "Monto promedio por venta: ventas del mes ÷ número de ventas del mes",
      icon: "tabler:receipt",
      color: "info",
      to: "/app/sales",
      loading: salesReportLoading.value,
    },
    {
      key: "todayAppointments",
      label: "Citas de hoy",
      value: data?.todayAppointments ?? 0,
      caption: data ? `${data.todayCompleted} completada${data.todayCompleted === 1 ? "" : "s"}` : "",
      icon: "tabler:calendar-event",
      color: "warning",
      to: appointmentsLink.value,
      loading: loading.value,
    },
  ]
})

const pulseStats = computed(() => {
  const data = dashboardData.value

  return [
    {
      key: "monthAppointments",
      label: "Citas del mes",
      value: data?.monthAppointments ?? 0,
      icon: "tabler:calendar-month",
      to: appointmentsLink.value,
    },
    {
      key: "totalClients",
      label: "Clientes",
      value: data?.totalClients ?? 0,
      icon: "tabler:user-heart",
      to: authStore.isAdmin ? "/app/clients" : undefined,
    },
    {
      key: "activeUsers",
      label: "Usuarios activos",
      value: data?.activeUsers ?? 0,
      icon: "tabler:users-group",
      to: authStore.isAdmin || authStore.isSuperAdmin ? "/app/users" : undefined,
    },
  ]
})

// ---------------------------------------------------------------- appointment status ring

// Each status keeps one color everywhere. "Scheduled" is neutral grey, which is not a theme color.
const STATUS_COLORS: Record<AppointmentStatus, string> = {
  SCHEDULED: "#8A8F98",
  CONFIRMED: "rgb(var(--v-theme-primary))",
  IN_PROGRESS: "rgb(var(--v-theme-info))",
  COMPLETED: "rgb(var(--v-theme-success))",
  CANCELLED: "rgb(var(--v-theme-error))",
  NO_SHOW: "rgb(var(--v-theme-warning))",
}

const todayStatusSegments = computed(() => {
  const data = dashboardData.value
  if (!data) return []

  const entries: [AppointmentStatus, string, number][] = [
    ["SCHEDULED", "Agendadas", data.todayScheduled],
    ["CONFIRMED", "Confirmadas", data.todayConfirmed],
    ["IN_PROGRESS", "En curso", data.todayInProgress],
    ["COMPLETED", "Completadas", data.todayCompleted],
  ]

  return entries.map(([status, label, value]) => ({
    key: status,
    label,
    value: value || 0,
    color: STATUS_COLORS[status],
  }))
})

const monthStatusSegments = computed(() => {
  const byStatus = dashboardData.value?.appointmentsByStatus ?? {}

  return (Object.keys(APPOINTMENT_STATUS_LABELS) as AppointmentStatus[])
    .map((status) => ({
      key: status,
      label: APPOINTMENT_STATUS_LABELS[status],
      value: byStatus[status] ?? 0,
      color: STATUS_COLORS[status],
    }))
    .filter((segment) => segment.value > 0)
})

const donutSegments = computed(() =>
  statusView.value === "today" ? todayStatusSegments.value : monthStatusSegments.value
)

const donutTotal = computed(() =>
  donutSegments.value.reduce((sum, segment) => sum + segment.value, 0)
)

// ---------------------------------------------------------------- filters

const branchFilterItems = computed(() =>
  (branchesStore.data?.content ?? []).map((branch) => ({
    title: branch.name,
    value: Number(branch.id),
  }))
)

// ---------------------------------------------------------------- appointment helpers

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
  const dateLabelText = formatDateDisplay(date)
  const timeLabel = formatTimeDisplay(time)

  if (dateLabelText && timeLabel) return `${dateLabelText} · ${timeLabel}`
  return dateLabelText || timeLabel || "Sin fecha"
}

const openClientContact = (appointment: Appointment) => {
  if (!appointment.clientName) return
  selectedClientAppointment.value = appointment
  showClientContactModal.value = true
}

const patchAppointmentInList = (list: Appointment[] | undefined, updated: Appointment) => {
  if (!list) return
  const index = list.findIndex((item) => item.id === updated.id)
  if (index !== -1) list[index] = { ...list[index], ...updated }
}

const handleReminderSent = (updated: Appointment) => {
  patchAppointmentInList(dashboardData.value?.upcomingAppointments, updated)
  patchAppointmentInList(dashboardData.value?.todaySchedule, updated)
}

// ---------------------------------------------------------------- low stock

const showLowStock = computed(() => showAdvancedFilters.value && canSeeProducts.value)
const lowStockLoading = computed(() => lowStockProductsStore.loading)
const lowStockProducts = computed(() =>
  lowStockProductsStore.products
    .filter((product: Product) => product.isActive && getProductStockStatus(product) !== "ok")
    .sort((a: Product, b: Product) => (a.stockQuantity ?? 0) - (b.stockQuantity ?? 0))
    .slice(0, 6)
)

const fetchLowStockProducts = async () => {
  if (!showLowStock.value) return
  await lowStockProductsStore.fetchProducts()
}

// ---------------------------------------------------------------- data loading

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

  await Promise.allSettled([branchesStore.fetchBranches(0, 100)])
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
  await Promise.allSettled([
    fetchDashboard(),
    loadFilterOptions(),
    fetchSalesSummary(),
    fetchLowStockProducts(),
  ])
})
</script>

<style scoped>
/* ------------------------------------------------------------------ panels' content */

.dashboard-sales-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem 1.5rem;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px dashed rgba(var(--v-border-color), 0.12);
}

.dashboard-sales-summary__item {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.dashboard-sales-summary__label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.dashboard-sales-summary__value {
  margin-top: 0.125rem;
  font-family: var(--font-heading);
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: rgba(var(--v-theme-on-surface), 0.94);
}

.dashboard-sales-summary__hint {
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.dashboard-segmented {
  display: inline-flex;
  padding: 3px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.06);
}

.dashboard-segmented__option {
  padding: 0.25rem 0.75rem;
  border: 0;
  border-radius: 8px;
  background: transparent;
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.74);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.dashboard-segmented__option:hover {
  color: rgba(var(--v-theme-on-surface), 0.94);
}

.dashboard-segmented__option--active {
  background: rgb(var(--v-theme-surface));
  color: rgba(var(--v-theme-on-surface), 0.94);
  box-shadow: 0 1px 3px rgba(11, 11, 12, 0.14);
}

.dashboard-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 560px;
  padding-right: 0.25rem;
  overflow-y: auto;
}

.dashboard-stock {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

.dashboard-stock__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.625rem 0;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
}

.dashboard-stock__item:last-child {
  border-bottom: 0;
}

.dashboard-stock__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.dashboard-stock__name {
  overflow: hidden;
  font-size: 0.875rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(var(--v-theme-on-surface), 0.88);
}

.dashboard-stock__qty {
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: rgba(var(--v-theme-on-surface), 0.7);
}
</style>
