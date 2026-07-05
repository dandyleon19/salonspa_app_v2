import { defineStore } from "pinia"
import type { PageResponse } from "~/interfaces/PageResponse"
import type {
  CreateSalePaymentPayload,
  CreateSaleRequest,
  Sale,
  SaleFilters,
  SaleReportFilters,
  SalesReportResponse,
} from "~/interfaces/salesInterfaces"
import { normalizeSale, normalizeSalesPage, normalizeSalesReportResponse } from "~/helpers/salesHelpers"

export const useSalesStore = defineStore("sales", {
  state: () => ({
    data: null as PageResponse<Sale> | null,
    loading: true,
    detail: null as Sale | null,
    detailLoading: false,
    report: null as SalesReportResponse | null,
    reportLoading: false,
    reportError: false,
  }),

  actions: {
    async fetchSales(page = 0, size = 10, filters: SaleFilters = {}) {
      this.loading = true
      try {
        const { $api } = useNuxtApp()
        const query: Record<string, number | string> = { page, size }

        if (filters.branchId != null) query.branchId = filters.branchId
        if (filters.clientId != null) query.clientId = filters.clientId
        if (filters.status) query.status = filters.status
        if (filters.from) query.from = filters.from
        if (filters.to) query.to = filters.to

        const response = await $api<PageResponse<Sale>>("/api/sales", {
          method: "GET",
          query,
        })
        this.data = normalizeSalesPage(response)
      } catch (err) {
        console.error("Error al obtener ventas:", err)
        this.data = null
      } finally {
        this.loading = false
      }
    },

    async createSale(payload: CreateSaleRequest) {
      const { $api } = useNuxtApp()
      return normalizeSale(
        await $api<Sale>("/api/sales", {
          method: "POST",
          body: payload,
        })
      )
    },

    async fetchSaleById(id: number | string) {
      this.detailLoading = true
      try {
        const { $api } = useNuxtApp()
        this.detail = normalizeSale(
          await $api<Sale>(`/api/sales/${id}`, { method: "GET" })
        )
        return this.detail
      } catch (err) {
        console.error("Error al obtener detalle de venta:", err)
        this.detail = null
        throw err
      } finally {
        this.detailLoading = false
      }
    },

    async addSalePayment(id: number | string, payload: CreateSalePaymentPayload) {
      const { $api } = useNuxtApp()
      await $api(`/api/sales/${id}/payments`, {
        method: "POST",
        body: payload,
      })
    },

    async cancelSale(id: number | string) {
      const { $api } = useNuxtApp()
      await $api(`/api/sales/${id}/cancel`, { method: "PUT" })
    },

    async fetchSalesReport(filters: SaleReportFilters) {
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

        this.report = normalizeSalesReportResponse(
          await $api<SalesReportResponse>("/api/sales/report", {
            method: "GET",
            query,
          })
        )
      } catch (err) {
        console.error("Error al obtener reporte de ventas:", err)
        this.report = null
        this.reportError = true
      } finally {
        this.reportLoading = false
      }
    },
  },
})
