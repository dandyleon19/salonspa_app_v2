<template>
  <div>
    <v-alert
      v-if="reportError"
      type="error"
      variant="tonal"
      rounded="lg"
      class="mb-4"
    >
      No se pudo cargar el reporte de comisiones.
    </v-alert>

    <v-alert
      v-else-if="hasLoadedReport && isEmptyReport"
      type="info"
      variant="tonal"
      rounded="lg"
      class="mb-4"
    >
      No hay comisiones en este período. Verifica el rango de fechas y que existan ventas
      con servicios realizados por profesionales.
    </v-alert>

    <v-row class="mb-4">
      <v-col
        v-for="stat in summaryStats"
        :key="stat.key"
        cols="12"
        sm="4"
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
        <v-card class="commissions-report__panel" rounded="xl" elevation="0">
          <v-card-title class="py-4 px-5">
            <p class="text-subtitle-1 font-weight-bold mb-0">Por profesional</p>
            <p class="text-caption text-medium-emphasis mb-0">
              Monto a pagar por cada profesional
            </p>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4">
            <AppSkeletonTransition>
              <v-skeleton-loader
                v-if="loading"
                key="commissions-by-user-skeleton"
                type="list-item-two-line@4"
              />
              <div
                v-else-if="!byUser.length"
                key="commissions-by-user-empty"
                class="commissions-report__empty"
              >
                <p class="text-body-2 text-medium-emphasis mb-0">Sin datos en el período</p>
              </div>
              <div
                v-else
                key="commissions-by-user-content"
                class="d-flex flex-column ga-3"
              >
                <div
                  v-for="item in byUser"
                  :key="item.userId"
                  class="commissions-report__user-item pa-3 rounded-lg"
                >
                  <div class="d-flex justify-space-between align-start ga-3 mb-1">
                    <div>
                      <p class="text-body-2 font-weight-medium mb-0">
                        {{ item.userName || `Profesional #${item.userId}` }}
                      </p>
                      <p class="text-caption text-medium-emphasis mb-0">
                        {{ item.itemsSold }} servicio{{ item.itemsSold === 1 ? "" : "s" }}
                        · Comisión general {{ item.defaultCommissionPercentage }}%
                      </p>
                    </div>
                    <span class="text-body-2 font-weight-bold text-primary">
                      {{ formatCurrency(item.commissionAmount) }}
                    </span>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span class="text-caption text-medium-emphasis">Ingresos base</span>
                    <span class="text-caption font-weight-medium">
                      {{ formatCurrency(item.revenue) }}
                    </span>
                  </div>
                </div>
              </div>
            </AppSkeletonTransition>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6">
        <v-card class="commissions-report__panel" rounded="xl" elevation="0">
          <v-card-title class="py-4 px-5">
            <p class="text-subtitle-1 font-weight-bold mb-0">Detalle por servicio</p>
            <p class="text-caption text-medium-emphasis mb-0">
              % aplicado y origen de la comisión
            </p>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4">
            <AppSkeletonTransition>
              <v-skeleton-loader
                v-if="loading"
                key="commissions-detail-skeleton"
                type="list-item-two-line@5"
              />
              <div
                v-else-if="!byUser.length"
                key="commissions-detail-empty"
                class="commissions-report__empty"
              >
                <p class="text-body-2 text-medium-emphasis mb-0">Sin datos en el período</p>
              </div>
              <v-expansion-panels
                v-else
                key="commissions-detail-content"
                variant="accordion"
                class="commissions-report__panels"
              >
                <v-expansion-panel
                  v-for="user in byUser"
                  :key="`detail-${user.userId}`"
                  rounded="lg"
                  elevation="0"
                >
                  <v-expansion-panel-title>
                    <div class="d-flex justify-space-between align-center w-100 pe-2">
                      <span class="text-body-2 font-weight-medium">
                        {{ user.userName || `Profesional #${user.userId}` }}
                      </span>
                      <span class="text-caption font-weight-bold text-primary">
                        {{ formatCurrency(user.commissionAmount) }}
                      </span>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <div class="d-flex flex-column ga-2">
                      <div
                        v-for="item in getDetailsForUser(user.userId)"
                        :key="`${item.userId}-${item.serviceId}`"
                        class="commissions-report__detail-item pa-3 rounded-lg"
                      >
                        <div class="d-flex justify-space-between align-start ga-3 mb-1">
                          <div>
                            <p class="text-body-2 font-weight-medium mb-0">
                              {{ item.serviceName }}
                            </p>
                            <p class="text-caption text-medium-emphasis mb-0">
                              {{ item.quantity }} vendido{{ item.quantity === 1 ? "" : "s" }}
                              · {{ item.appliedCommissionPercentage }}%
                            </p>
                          </div>
                          <span class="text-body-2 font-weight-medium">
                            {{ formatCurrency(item.commissionAmount) }}
                          </span>
                        </div>
                        <div class="d-flex align-center justify-space-between">
                          <v-chip
                            size="x-small"
                            variant="tonal"
                            :color="item.usedServiceCommission ? 'primary' : 'grey'"
                            rounded="pill"
                          >
                            {{ item.usedServiceCommission ? "Por servicio" : "General" }}
                          </v-chip>
                          <span class="text-caption text-medium-emphasis">
                            Base {{ formatCurrency(item.revenue) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </AppSkeletonTransition>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import {
  areCommissionReportFiltersEqual,
  groupCommissionDetailsByUser,
} from "~/helpers/commissionHelpers"
import { formatCurrency } from "~/helpers/salesHelpers"
import type { CommissionReportFilters } from "~/interfaces/commissionInterfaces"
import { useCommissionsStore } from "~/store"

const props = defineProps<{
  filters: CommissionReportFilters | null
}>()

const commissionsStore = useCommissionsStore()

const loading = computed(() => commissionsStore.reportLoading)
const reportData = computed(() => commissionsStore.report)
const reportError = computed(() => commissionsStore.reportError)

const hasLoadedReport = computed(
  () =>
    !loading.value &&
    props.filters != null &&
    !reportError.value &&
    reportData.value != null
)

const isEmptyReport = computed(() => (reportData.value?.totalCommission ?? 0) === 0)

const byUser = computed(() => reportData.value?.byUser ?? [])

const detailsByUser = computed(() =>
  groupCommissionDetailsByUser(reportData.value?.byUserAndService ?? [])
)

const getDetailsForUser = (userId: number) => detailsByUser.value[userId] ?? []

const summaryStats = computed(() => [
  {
    key: "totalItems",
    label: "Ítems vendidos",
    value: reportData.value?.totalItems ?? 0,
    icon: "mdi-package-variant-closed",
    color: "primary",
  },
  {
    key: "totalRevenue",
    label: "Ingresos base",
    value: formatCurrency(reportData.value?.totalRevenue),
    icon: "mdi-cash-multiple",
    color: "success",
  },
  {
    key: "totalCommission",
    label: "A pagar",
    value: formatCurrency(reportData.value?.totalCommission),
    icon: "mdi-hand-coin-outline",
    color: "warning",
  },
])

let lastAppliedFilters: CommissionReportFilters | null = null

const fetchReport = async () => {
  const filters = props.filters
  if (!filters) {
    lastAppliedFilters = null
    return
  }
  if (areCommissionReportFiltersEqual(lastAppliedFilters, filters)) return

  lastAppliedFilters = { ...filters }
  await commissionsStore.fetchCommissionReport(filters)
}

watch(
  () => props.filters,
  () => {
    fetchReport()
  },
  { immediate: true, deep: true }
)
</script>

<style scoped>
.commissions-report__panel {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.commissions-report__empty {
  padding: 2rem 1rem;
  text-align: center;
}

.commissions-report__user-item,
.commissions-report__detail-item {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.commissions-report__panels :deep(.v-expansion-panel) {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  margin-bottom: 0.5rem;
}
</style>
