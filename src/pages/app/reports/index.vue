<template>
  <AppTableWrapper class="sales-report">
    <AppPageTitle
      title="Reportes"
      :subtitle="pageSubtitle"
    />

    <AppCollapsibleToolbarCard
      v-model:expanded="filtersExpanded"
      label="Filtros"
      collapsed-hint="Mostrar filtros"
    >
      <v-text-field
        v-model="filterFrom"
        label="Desde"
        type="date"
        hide-details
        density="comfortable"
        variant="solo-filled"
        flat
        rounded="lg"
        class="app-table__filter"
      />
      <v-text-field
        v-model="filterTo"
        label="Hasta"
        type="date"
        hide-details
        density="comfortable"
        variant="solo-filled"
        flat
        rounded="lg"
        class="app-table__filter"
      />
      <v-select
        v-if="showBranchFilter"
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
        class="app-table__filter"
      />
      <RemoteSelect
        v-if="showUserFilter"
        v-model="filterUserId"
        kind="user"
        label="Profesional"
        hide-details
        @select="selectedUserName = $event ? ($event.fullName as string) || `${$event.firstName} ${$event.lastName}`.trim() : ''"
        density="comfortable"
        variant="solo-filled"
        flat
        rounded="lg"
        clearable
        class="app-table__filter"
      />

      <template #body>
        <v-tabs
          v-model="activeReportTab"
          color="primary"
          class="sales-report__tabs"
          rounded="0"
        >
          <v-tab value="sales" prepend-icon="tabler:cash-register">Ventas</v-tab>
          <v-tab v-if="hasCommissions" value="commissions" prepend-icon="tabler:coins">Comisiones</v-tab>
        </v-tabs>

        <div class="sales-report__body pa-4 pa-md-5">
          <v-alert
      v-if="activeReportTab === 'sales' && reportError"
      type="error"
      variant="tonal"
      rounded="lg"
      class="mb-4"
    >
      No se pudo cargar el reporte. Verifica que el backend esté activo y que tengas sesión iniciada.
    </v-alert>

    <v-alert
      v-else-if="hasInvalidRange"
      type="warning"
      variant="tonal"
      rounded="lg"
      class="mb-4"
    >
      La fecha de inicio debe ser anterior o igual a la fecha de fin.
    </v-alert>

    <v-alert
      v-else-if="!hasValidRange"
      type="info"
      variant="tonal"
      rounded="lg"
      class="mb-4"
    >
      Selecciona un rango de fechas (desde y hasta) para generar el reporte.
    </v-alert>

    <v-alert
      v-else-if="activeReportTab === 'sales' && hasLoadedReport && isEmptyReport"
      type="info"
      variant="tonal"
      rounded="lg"
      class="mb-4"
    >
      No hay ventas en este período. Registra ventas en
      <NuxtLink to="/app/sales" class="text-primary font-weight-medium">Ventas</NuxtLink>
      y asegúrate de que la <strong>fecha de venta</strong> caiga entre Desde y Hasta.
    </v-alert>

          <v-window v-model="activeReportTab">
            <v-window-item value="sales">
              <v-row class="mb-4">
      <v-col
        v-for="stat in summaryStats"
        :key="stat.key"
        cols="12"
        sm="6"
        lg="3"
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

    <div class="sales-report__stack">
      <DashboardPanel
        title="Evolución diaria"
        subtitle="Ingresos por día en el período seleccionado"
      >
        <AppSkeletonTransition>
          <v-skeleton-loader v-if="loading" key="daily-skeleton" type="image" height="220" />
          <DashboardSalesChart v-else key="daily-chart" :points="dailyPoints" />
        </AppSkeletonTransition>
      </DashboardPanel>

      <div class="sales-report__grid">
        <DashboardPanel title="Por método de pago" subtitle="Cómo pagan tus clientes">
          <AppSkeletonTransition>
            <v-skeleton-loader v-if="loading" key="payment-skeleton" type="image" height="260" />
            <DashboardEmpty
              v-else-if="!paymentSegments.length"
              key="payment-empty"
              icon="tabler:credit-card-off"
              title="Sin datos en el período"
            />
            <DashboardDonut
              v-else
              key="payment-donut"
              :segments="paymentSegments"
              center-label="cobrado"
              :format="formatCurrency"
            />
          </AppSkeletonTransition>
        </DashboardPanel>

        <DashboardPanel title="Servicios más vendidos" subtitle="Por ingresos">
          <AppSkeletonTransition>
            <v-skeleton-loader v-if="loading" key="services-skeleton" type="list-item-two-line@4" />
            <DashboardEmpty
              v-else-if="!topServiceItems.length"
              key="services-empty"
              icon="tabler:scissors"
              title="Sin datos en el período"
            />
            <DashboardRankList v-else key="services" :items="topServiceItems" />
          </AppSkeletonTransition>
        </DashboardPanel>

        <DashboardPanel title="Ingresos por profesional" subtitle="Por ingresos">
          <AppSkeletonTransition>
            <v-skeleton-loader v-if="loading" key="pros-skeleton" type="list-item-two-line@4" />
            <DashboardEmpty
              v-else-if="!professionalItems.length"
              key="pros-empty"
              icon="tabler:users"
              title="Sin datos en el período"
            />
            <DashboardRankList v-else key="pros" :items="professionalItems" />
          </AppSkeletonTransition>
        </DashboardPanel>
      </div>
    </div>

            </v-window-item>

            <v-window-item v-if="hasCommissions" value="commissions">
              <CommissionsReportPanel :filters="activeFilters" />
            </v-window-item>
          </v-window>
        </div>
      </template>
    </AppCollapsibleToolbarCard>
  </AppTableWrapper>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { useAuthStore } from "~/store/modules/auth"
import { useSubscriptionStore } from "~/store/modules/subscription"
import { useBranchesStore, useSalesStore } from "~/store"
import {
  areSaleReportFiltersEqual,
  formatCurrency,
  getMonthDateRange,
  getPaymentMethodBreakdown,
  normalizeSaleReportFilters,
} from "~/helpers/salesHelpers"
import { getPaymentMethodLabel } from "~/interfaces/salesInterfaces"
import { formatDateDisplay, getTodayDate } from "~/helpers/dateTimeHelpers"

definePageMeta({
  layout: "app",
})

useHead({ title: "Reportes" })

const salesStore = useSalesStore()
const branchesStore = useBranchesStore()
const authStore = useAuthStore()
const subscriptionStore = useSubscriptionStore()

// Commissions are their own plan feature: without it the backend refuses /api/commissions, so the tab is not offered.
const hasCommissions = computed(
  () => authStore.isSuperAdmin || subscriptionStore.hasFeature("commissions")
)

const defaultRange = getMonthDateRange()
const activeReportTab = ref<"sales" | "commissions">("sales")
const filtersExpanded = ref(true)
const filterFrom = ref(defaultRange.from)
const filterTo = ref(defaultRange.to)
const filterBranchId = ref<number | null>(null)
const filterUserId = ref<number | null>(null)

const showBranchFilter = computed(
  () => authStore.isAdmin || authStore.isSuperAdmin || authStore.isStaff
)

const showUserFilter = computed(
  () => authStore.isAdmin || authStore.isSuperAdmin
)

const loading = computed(() => salesStore.reportLoading)
const reportData = computed(() => salesStore.report)
const reportError = computed(() => salesStore.reportError)

const activeFilters = computed(() =>
  normalizeSaleReportFilters({
    from: filterFrom.value,
    to: filterTo.value,
    branchId: filterBranchId.value ?? undefined,
    userId: showUserFilter.value ? (filterUserId.value ?? undefined) : undefined,
  })
)

const hasValidRange = computed(() => activeFilters.value != null)

const hasInvalidRange = computed(() => {
  const from = filterFrom.value?.trim()
  const to = filterTo.value?.trim()
  return Boolean(from && to && from > to)
})

const hasLoadedReport = computed(
  () => !loading.value && hasValidRange.value && !reportError.value && reportData.value != null
)

const isEmptyReport = computed(() => (reportData.value?.totalSales ?? 0) === 0)

const reportSubtitle = computed(() => {
  const data = reportData.value
  const period =
    data?.from && data?.to
      ? `${formatDateDisplay(data.from)} – ${formatDateDisplay(data.to)}`
      : `${formatDateDisplay(filterFrom.value)} – ${formatDateDisplay(filterTo.value)}`

  const filterLabels: string[] = []

  if (filterBranchId.value != null) {
    const branch = branchFilterItems.value.find(
      (item) => item.value === filterBranchId.value
    )
    if (branch) filterLabels.push(`Sucursal: ${branch.title}`)
  }

  if (filterUserId.value != null && selectedUserName.value) {
    filterLabels.push(`Profesional: ${selectedUserName.value}`)
  }

  const filtersText = filterLabels.length ? ` · ${filterLabels.join(" · ")}` : ""
  return `${period} · fecha de venta${filtersText}`
})

const pageSubtitle = computed(() => {
  if (activeReportTab.value === "commissions") {
    const period = `${formatDateDisplay(filterFrom.value)} – ${formatDateDisplay(filterTo.value)}`
    return `${period} · comisiones a pagar por servicios vendidos`
  }

  return reportSubtitle.value
})

const branchFilterItems = computed(() =>
  (branchesStore.data?.content ?? []).map((branch) => ({
    title: branch.name,
    value: Number(branch.id),
  }))
)

// Name of the professional chosen in the filter (the select searches the server, so the page has no list of them).
const selectedUserName = ref("")

const summaryStats = computed(() => [
  {
    key: "totalSales",
    label: "Total ventas",
    value: reportData.value?.totalSales ?? 0,
    icon: "tabler:receipt-2",
    color: "primary",
  },
  {
    key: "totalRevenue",
    label: "Ingresos",
    value: formatCurrency(reportData.value?.totalRevenue),
    icon: "tabler:cash",
    color: "success",
  },
  {
    key: "totalPaid",
    label: "Cobrado",
    value: formatCurrency(reportData.value?.totalPaid),
    icon: "tabler:circle-check",
    color: "info",
  },
  {
    key: "totalOutstanding",
    label: "Pendiente",
    value: formatCurrency(reportData.value?.totalOutstanding),
    icon: "tabler:clock",
    color: "warning",
  },
])

const paymentMethodBreakdown = computed(() =>
  getPaymentMethodBreakdown(reportData.value?.revenueByPaymentMethod)
)
const topServices = computed(() => reportData.value?.topServices ?? [])
const professionalRevenue = computed(() => reportData.value?.byProfessional ?? [])
const dailyBreakdown = computed(() => reportData.value?.dailyBreakdown ?? [])

// One point per day of the period (days without sales are 0), up to today: days to come are unknown, not zero.
const dailyPoints = computed(() => {
  const data = reportData.value
  if (!data?.from || !data?.to) return []

  const byDate = new Map(data.dailyBreakdown.map((item) => [item.date, item]))
  const today = getTodayDate()
  const last = data.to < today ? data.to : today
  const cursor = new Date(`${data.from}T00:00:00`)
  const points: { date: string; revenue: number; count: number }[] = []

  for (let guard = 0; guard < 400; guard++) {
    const month = String(cursor.getMonth() + 1).padStart(2, "0")
    const day = String(cursor.getDate()).padStart(2, "0")
    const iso = `${cursor.getFullYear()}-${month}-${day}`
    if (iso > last) break

    const item = byDate.get(iso)
    points.push({ date: iso, revenue: item?.revenue ?? 0, count: item?.salesCount ?? 0 })
    cursor.setDate(cursor.getDate() + 1)
  }

  return points
})

// One color per payment method, so the ring reads the same in every report.
const PAYMENT_COLORS: Record<string, string> = {
  CASH: "#1B8556",
  YAPE: "#7C3AED",
  PLIN: "#0E9AA7",
  CARD: "#1F78C1",
  TRANSFER: "#FF8000",
  OTHER: "#8A8F98",
}

const paymentSegments = computed(() =>
  paymentMethodBreakdown.value.map((item) => ({
    key: item.paymentMethod,
    label: getPaymentMethodLabel(item.paymentMethod),
    value: item.amount,
    color: PAYMENT_COLORS[item.paymentMethod] ?? PAYMENT_COLORS.OTHER,
  }))
)

const topServiceItems = computed(() =>
  topServices.value.map((item, index) => ({
    key: item.serviceId ?? `${item.serviceName}-${index}`,
    label: item.serviceName,
    value: item.revenue,
    valueLabel: formatCurrency(item.revenue),
    caption: `${item.quantity} vendido${item.quantity === 1 ? "" : "s"}`,
  }))
)

const professionalItems = computed(() =>
  professionalRevenue.value.map((item) => ({
    key: item.userId,
    label: item.userName || `Profesional #${item.userId}`,
    value: item.revenue,
    valueLabel: formatCurrency(item.revenue),
    caption: `${item.itemsSold} servicio${item.itemsSold === 1 ? "" : "s"}`,
  }))
)

let lastAppliedFilters: ReturnType<typeof normalizeSaleReportFilters> = null

const fetchReport = async () => {
  const filters = activeFilters.value
  if (!filters) {
    lastAppliedFilters = null
    return
  }
  if (areSaleReportFiltersEqual(lastAppliedFilters, filters)) return

  lastAppliedFilters = { ...filters }
  await salesStore.fetchSalesReport(filters)
}

watch(
  [filterFrom, filterTo, filterBranchId, filterUserId],
  () => {
    fetchReport()
  },
  { immediate: true }
)

watch(showUserFilter, (canFilterByUser) => {
  if (!canFilterByUser) filterUserId.value = null
})

onMounted(async () => {
  await Promise.allSettled([branchesStore.fetchBranches(0, 100)])
})
</script>

<style scoped>
.sales-report__tabs {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.sales-report__body {
  min-width: 0;
}

.sales-report__stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sales-report__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}
</style>
