import { defineStore } from "pinia"
import { normalizeDashboardFilters } from "~/helpers/dashboardHelpers"
import type {
  DashboardFilters,
  DashboardResponse,
} from "~/interfaces/dashboardInterfaces"

export const useDashboardStore = defineStore("dashboard", {
  state: () => ({
    data: null as DashboardResponse | null,
    loading: true,
  }),

  actions: {
    async fetchDashboard(filters: DashboardFilters = {}) {
      this.loading = true

      try {
        const { $api } = useNuxtApp()
        const query: Record<string, number | string> = {}
        const normalized = normalizeDashboardFilters(filters)

        if (normalized.date) query.date = normalized.date
        if (normalized.branchId != null) query.branchId = normalized.branchId
        if (normalized.userId != null) query.userId = normalized.userId

        this.data = await $api<DashboardResponse>("/api/dashboard", {
          method: "GET",
          query,
        })
      } catch (err) {
        console.error("Error al obtener dashboard:", err)
        this.data = null
      } finally {
        this.loading = false
      }
    },
  },
})
