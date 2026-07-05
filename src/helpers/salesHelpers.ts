import type { PageResponse } from "~/interfaces/PageResponse"
import type {
  PaymentMethod,
  Sale,
  SaleFilters,
  SalePaymentMethodBreakdown,
  SaleReportFilters,
  SaleItem,
  SalesReportResponse,
} from "~/interfaces/salesInterfaces"
import {
  getSaleAmountPaid,
  getSaleItemTotal,
  getSalePendingAmount,
  getSaleSoldAt,
} from "~/interfaces/salesInterfaces"

export function formatCurrency(value?: number | null): string {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function normalizeSaleFilters(values: Record<string, unknown> = {}): SaleFilters {
  const filters: SaleFilters = {}

  if (values.branchId != null && values.branchId !== "") {
    const branchId = Number(values.branchId)
    if (Number.isFinite(branchId)) filters.branchId = branchId
  }

  if (values.clientId != null && values.clientId !== "") {
    const clientId = Number(values.clientId)
    if (Number.isFinite(clientId)) filters.clientId = clientId
  }

  if (typeof values.status === "string" && values.status.trim()) {
    filters.status = values.status.trim() as SaleFilters["status"]
  }

  if (typeof values.from === "string" && values.from.trim()) {
    filters.from = values.from.trim()
  }

  if (typeof values.to === "string" && values.to.trim()) {
    filters.to = values.to.trim()
  }

  return filters
}

export function areSaleFiltersEqual(
  current: SaleFilters = {},
  next: SaleFilters = {}
): boolean {
  return (
    current.branchId === next.branchId &&
    current.clientId === next.clientId &&
    current.status === next.status &&
    current.from === next.from &&
    current.to === next.to
  )
}

export function normalizeSaleReportFilters(
  values: Partial<SaleReportFilters> = {}
): SaleReportFilters | null {
  const from = values.from?.trim()
  const to = values.to?.trim()

  if (!from || !to) return null
  if (from > to) return null

  const filters: SaleReportFilters = { from, to }

  if (values.branchId != null) {
    const branchId = Number(values.branchId)
    if (Number.isFinite(branchId)) filters.branchId = branchId
  }

  if (values.userId != null) {
    const userId = Number(values.userId)
    if (Number.isFinite(userId)) filters.userId = userId
  }

  return filters
}

export function areSaleReportFiltersEqual(
  current: SaleReportFilters | null,
  next: SaleReportFilters | null
): boolean {
  if (!current && !next) return true
  if (!current || !next) return false

  return (
    current.from === next.from &&
    current.to === next.to &&
    current.branchId === next.branchId &&
    current.userId === next.userId
  )
}

export function getMonthDateRange(date = new Date()): { from: string; to: string } {
  const year = date.getFullYear()
  const month = date.getMonth()
  const from = `${year}-${String(month + 1).padStart(2, "0")}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
  return { from, to }
}

export function getPaymentMethodBreakdown(
  revenueByPaymentMethod?: Partial<Record<PaymentMethod, number>>
): SalePaymentMethodBreakdown[] {
  if (!revenueByPaymentMethod) return []

  return (Object.entries(revenueByPaymentMethod) as Array<[PaymentMethod, number]>)
    .filter(([, amount]) => Number(amount) > 0)
    .map(([paymentMethod, amount]) => ({
      paymentMethod,
      amount: Number(amount),
    }))
}

export function normalizeSalesReportResponse(
  response: SalesReportResponse | Record<string, unknown> | null
): SalesReportResponse | null {
  if (!response) return null

  const raw = response as Record<string, unknown>

  const revenueByPaymentMethod =
    (raw.revenueByPaymentMethod as Partial<Record<PaymentMethod, number>>) ??
    (raw.revenue_by_payment_method as Partial<Record<PaymentMethod, number>>) ??
    {}

  const legacyPaymentMethods = raw.by_payment_method as
    | Array<{ paymentMethod: PaymentMethod; amount: number }>
    | undefined

  const resolvedPaymentMethods =
    Object.keys(revenueByPaymentMethod).length > 0
      ? revenueByPaymentMethod
      : Object.fromEntries(
          (legacyPaymentMethods ?? []).map((item) => [item.paymentMethod, item.amount])
        )

  const topServices =
    (raw.topServices as SalesReportResponse["topServices"]) ??
    (raw.top_services as SalesReportResponse["topServices"]) ??
    []

  const byProfessional =
    (raw.byProfessional as SalesReportResponse["byProfessional"]) ??
    (raw.by_professional as SalesReportResponse["byProfessional"]) ??
    []

  const dailyBreakdown =
    (raw.dailyBreakdown as SalesReportResponse["dailyBreakdown"]) ??
    (raw.daily_breakdown as SalesReportResponse["dailyBreakdown"]) ??
    []

  return {
    from: String(raw.from ?? ""),
    to: String(raw.to ?? ""),
    totalSales: Number(raw.totalSales ?? raw.total_sales ?? 0),
    totalRevenue: Number(raw.totalRevenue ?? raw.total_revenue ?? 0),
    totalPaid: Number(
      raw.totalPaid ??
        raw.total_paid ??
        raw.totalCollected ??
        raw.total_collected ??
        0
    ),
    totalOutstanding: Number(
      raw.totalOutstanding ??
        raw.total_outstanding ??
        raw.totalPending ??
        raw.total_pending ??
        0
    ),
    revenueByPaymentMethod: resolvedPaymentMethods,
    topServices,
    byProfessional: byProfessional.map((item) => ({
      userId: Number(item.userId ?? (item as Record<string, unknown>).user_id ?? 0),
      userName: String(item.userName ?? (item as Record<string, unknown>).user_name ?? ""),
      itemsSold: Number(item.itemsSold ?? (item as Record<string, unknown>).items_sold ?? 0),
      revenue: Number(item.revenue ?? 0),
    })),
    dailyBreakdown: dailyBreakdown.map((item) => ({
      date: String(item.date ?? ""),
      salesCount: Number(item.salesCount ?? (item as Record<string, unknown>).sales_count ?? 0),
      revenue: Number(item.revenue ?? 0),
    })),
  }
}

export function normalizeSaleItem(item: SaleItem): SaleItem {
  return {
    ...item,
    lineTotal: getSaleItemTotal(item),
  }
}

export function normalizeSale(sale: Sale): Sale {
  return {
    ...sale,
    amountPaid: getSaleAmountPaid(sale),
    items: (sale.items ?? []).map(normalizeSaleItem),
    payments: sale.payments ?? [],
  }
}

export function normalizeSalesPage(
  response: PageResponse<Sale> | null
): PageResponse<Sale> | null {
  if (!response) return null

  return {
    ...response,
    content: (response.content ?? []).map(normalizeSale),
  }
}
