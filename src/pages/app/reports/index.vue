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
      <v-select
        v-if="showUserFilter"
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
          <v-tab value="commissions" prepend-icon="tabler:coins">Comisiones</v-tab>
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

    <v-row>
      <v-col cols="12" lg="6">
        <v-card class="sales-report__panel" rounded="xl" elevation="0">
          <v-card-title class="py-4 px-5">
            <p class="text-subtitle-1 font-weight-bold mb-0">Por método de pago</p>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4">
            <AppSkeletonTransition>
              <v-skeleton-loader
                v-if="loading"
                key="payment-method-skeleton"
                type="list-item-two-line@3"
              />
              <div
                v-else-if="!paymentMethodBreakdown.length"
                key="payment-method-empty"
                class="sales-report__empty"
              >
                <p class="text-body-2 text-medium-emphasis mb-0">Sin datos en el período</p>
              </div>
              <div
                v-else
                key="payment-method-content"
                class="d-flex flex-column ga-2"
              >
                <div
                  v-for="item in paymentMethodBreakdown"
                  :key="item.paymentMethod"
                  class="d-flex justify-space-between align-center"
                >
                  <span class="text-body-2">{{ getPaymentMethodLabel(item.paymentMethod) }}</span>
                  <span class="text-body-2 font-weight-medium">{{ formatCurrency(item.amount) }}</span>
                </div>
              </div>
            </AppSkeletonTransition>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6">
        <v-card class="sales-report__panel" rounded="xl" elevation="0">
          <v-card-title class="py-4 px-5">
            <p class="text-subtitle-1 font-weight-bold mb-0">Top servicios vendidos</p>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4">
            <AppSkeletonTransition>
              <v-skeleton-loader
                v-if="loading"
                key="top-services-skeleton"
                type="list-item-two-line@4"
              />
              <div
                v-else-if="!topServices.length"
                key="top-services-empty"
                class="sales-report__empty"
              >
                <p class="text-body-2 text-medium-emphasis mb-0">Sin datos en el período</p>
              </div>
              <div
                v-else
                key="top-services-content"
                class="d-flex flex-column ga-2"
              >
                <div
                  v-for="(item, index) in topServices"
                  :key="item.serviceId ?? `${item.serviceName}-${index}`"
                  class="d-flex justify-space-between align-start ga-3"
                >
                  <div>
                    <p class="text-body-2 font-weight-medium mb-0">{{ item.serviceName }}</p>
                    <p class="text-caption text-medium-emphasis mb-0">
                      {{ item.quantity }} vendido{{ item.quantity === 1 ? "" : "s" }}
                    </p>
                  </div>
                  <span class="text-body-2 font-weight-medium">{{ formatCurrency(item.revenue) }}</span>
                </div>
              </div>
            </AppSkeletonTransition>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6">
        <v-card class="sales-report__panel" rounded="xl" elevation="0">
          <v-card-title class="py-4 px-5">
            <p class="text-subtitle-1 font-weight-bold mb-0">Ingresos por profesional</p>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4">
            <AppSkeletonTransition>
              <v-skeleton-loader
                v-if="loading"
                key="professional-skeleton"
                type="list-item-two-line@4"
              />
              <div
                v-else-if="!professionalRevenue.length"
                key="professional-empty"
                class="sales-report__empty"
              >
                <p class="text-body-2 text-medium-emphasis mb-0">Sin datos en el período</p>
              </div>
              <div
                v-else
                key="professional-content"
                class="d-flex flex-column ga-2"
              >
                <div
                  v-for="item in professionalRevenue"
                  :key="item.userId"
                  class="d-flex justify-space-between align-start ga-3"
                >
                  <div>
                    <p class="text-body-2 font-weight-medium mb-0">
                      {{ item.userName || `Profesional #${item.userId}` }}
                    </p>
                    <p class="text-caption text-medium-emphasis mb-0">
                      {{ item.itemsSold }} servicio{{ item.itemsSold === 1 ? "" : "s" }}
                    </p>
                  </div>
                  <span class="text-body-2 font-weight-medium">{{ formatCurrency(item.revenue) }}</span>
                </div>
              </div>
            </AppSkeletonTransition>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6">
        <v-card class="sales-report__panel" rounded="xl" elevation="0">
          <v-card-title class="py-4 px-5">
            <p class="text-subtitle-1 font-weight-bold mb-0">Desglose diario</p>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4">
            <AppSkeletonTransition>
              <v-skeleton-loader
                v-if="loading"
                key="daily-skeleton"
                type="list-item-two-line@5"
              />
              <div
                v-else-if="!dailyBreakdown.length"
                key="daily-empty"
                class="sales-report__empty"
              >
                <p class="text-body-2 text-medium-emphasis mb-0">Sin datos en el período</p>
              </div>
              <div
                v-else
                key="daily-content"
                class="d-flex flex-column ga-2"
              >
                <div
                  v-for="item in dailyBreakdown"
                  :key="item.date"
                  class="sales-report__daily-item pa-3 rounded-lg"
                >
                  <div class="d-flex justify-space-between align-center mb-1">
                    <span class="text-body-2 font-weight-medium">
                      {{ formatDateDisplay(item.date) }}
                    </span>
                    <span class="text-caption text-medium-emphasis">
                      {{ item.salesCount }} venta{{ item.salesCount === 1 ? "" : "s" }}
                    </span>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span class="text-caption text-medium-emphasis">Ingresos</span>
                    <span class="text-caption font-weight-medium">{{ formatCurrency(item.revenue) }}</span>
                  </div>
                </div>
              </div>
            </AppSkeletonTransition>
          </v-card-text>
        </v-card>
      </v-col>
              </v-row>
            </v-window-item>

            <v-window-item value="commissions">
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
import { useBranchesStore, useSalesStore, useUsersStore } from "~/store"
import {
  areSaleReportFiltersEqual,
  formatCurrency,
  getMonthDateRange,
  getPaymentMethodBreakdown,
  normalizeSaleReportFilters,
} from "~/helpers/salesHelpers"
import { getPaymentMethodLabel } from "~/interfaces/salesInterfaces"
import { formatDateDisplay } from "~/helpers/dateTimeHelpers"

definePageMeta({
  layout: "app",
})

const salesStore = useSalesStore()
const branchesStore = useBranchesStore()
const usersStore = useUsersStore()
const authStore = useAuthStore()

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

  if (filterUserId.value != null) {
    const user = userFilterItems.value.find((item) => item.value === filterUserId.value)
    if (user) filterLabels.push(`Profesional: ${user.title}`)
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

const userFilterItems = computed(() =>
  (usersStore.data?.content ?? []).map((user) => ({
    title: user.fullName || `${user.firstName} ${user.lastName}`.trim(),
    value: Number(user.id),
  }))
)

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
  const requests: Promise<unknown>[] = [branchesStore.fetchBranches(0, 100)]

  if (showUserFilter.value) {
    requests.push(usersStore.fetchUsers(0, 100))
  }

  await Promise.allSettled(requests)
})
</script>

<style scoped>
.sales-report__panel {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.sales-report__tabs {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.sales-report__body {
  min-width: 0;
}

.sales-report__empty {
  padding: 2rem 1rem;
  text-align: center;
}

.sales-report__daily-item {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-on-surface), 0.02);
}
</style>
