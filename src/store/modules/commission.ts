import { defineStore } from "pinia"
import { normalizeCommissionReportResponse } from "~/helpers/commissionHelpers"
import type {
  CommissionReportFilters,
  CommissionReportResponse,
} from "~/interfaces/commissionInterfaces"

export const useCommissionsStore = defineStore("commissions", {
  state: () => ({
    report: null as CommissionReportResponse | null,
    reportLoading: false,
    reportError: false,
  }),

  actions: {
    async fetchCommissionReport(filters: CommissionReportFilters) {
      this.reportLoading = true
      this.reportError = false

      try {
        const { $api } = useNuxtApp()
        const query: Record<string, number | string> = {
          from: filters.from,
          to: filters.to,
        }

        if (filters.branchId != null) query.branchId = filters.branchId
        if (filters.userId != null) query.userId = filters.userId

        this.report = normalizeCommissionReportResponse(
          await $api<CommissionReportResponse>("/api/commissions/report", {
            method: "GET",
            query,
          })
        )
      } catch (err) {
        console.error("Error al obtener reporte de comisiones:", err)
        this.report = null
        this.reportError = true
      } finally {
        this.reportLoading = false
      }
    },
  },
})
