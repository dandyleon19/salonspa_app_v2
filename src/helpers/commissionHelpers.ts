import type {
  CommissionByUser,
  CommissionByUserAndService,
  CommissionReportFilters,
  CommissionReportResponse,
} from "~/interfaces/commissionInterfaces"

export function normalizeCommissionReportFilters(
  values: Partial<CommissionReportFilters> = {}
): CommissionReportFilters | null {
  const from = values.from?.trim()
  const to = values.to?.trim()

  if (!from || !to) return null
  if (from > to) return null

  const filters: CommissionReportFilters = { from, to }

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

export function areCommissionReportFiltersEqual(
  current: CommissionReportFilters | null,
  next: CommissionReportFilters | null
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

export function normalizeCommissionReportResponse(
  response: CommissionReportResponse | Record<string, unknown> | null
): CommissionReportResponse | null {
  if (!response) return null

  const raw = response as Record<string, unknown>

  const byUser =
    (raw.byUser as CommissionByUser[]) ??
    (raw.by_user as CommissionByUser[]) ??
    []

  const byUserAndService =
    (raw.byUserAndService as CommissionByUserAndService[]) ??
    (raw.by_user_and_service as CommissionByUserAndService[]) ??
    []

  return {
    from: String(raw.from ?? ""),
    to: String(raw.to ?? ""),
    totalItems: Number(raw.totalItems ?? raw.total_items ?? 0),
    totalRevenue: Number(raw.totalRevenue ?? raw.total_revenue ?? 0),
    totalCommission: Number(raw.totalCommission ?? raw.total_commission ?? 0),
    byUser: byUser.map((item) => normalizeCommissionByUser(item)),
    byUserAndService: byUserAndService.map((item) =>
      normalizeCommissionByUserAndService(item)
    ),
  }
}

function normalizeCommissionByUser(item: CommissionByUser | Record<string, unknown>) {
  const raw = item as Record<string, unknown>
  return {
    userId: Number(raw.userId ?? raw.user_id ?? 0),
    userName: String(raw.userName ?? raw.user_name ?? ""),
    defaultCommissionPercentage: Number(
      raw.defaultCommissionPercentage ?? raw.default_commission_percentage ?? 0
    ),
    itemsSold: Number(raw.itemsSold ?? raw.items_sold ?? 0),
    revenue: Number(raw.revenue ?? 0),
    commissionAmount: Number(raw.commissionAmount ?? raw.commission_amount ?? 0),
  }
}

function normalizeCommissionByUserAndService(
  item: CommissionByUserAndService | Record<string, unknown>
) {
  const raw = item as Record<string, unknown>
  return {
    userId: Number(raw.userId ?? raw.user_id ?? 0),
    userName: String(raw.userName ?? raw.user_name ?? ""),
    serviceId: Number(raw.serviceId ?? raw.service_id ?? 0),
    serviceName: String(raw.serviceName ?? raw.service_name ?? ""),
    quantity: Number(raw.quantity ?? 0),
    revenue: Number(raw.revenue ?? 0),
    appliedCommissionPercentage: Number(
      raw.appliedCommissionPercentage ?? raw.applied_commission_percentage ?? 0
    ),
    usedServiceCommission: Boolean(
      raw.usedServiceCommission ?? raw.used_service_commission ?? false
    ),
    commissionAmount: Number(raw.commissionAmount ?? raw.commission_amount ?? 0),
  }
}

export function groupCommissionDetailsByUser(
  items: CommissionByUserAndService[] = []
): Record<number, CommissionByUserAndService[]> {
  return items.reduce<Record<number, CommissionByUserAndService[]>>((groups, item) => {
    const userId = Number(item.userId)
    if (!groups[userId]) groups[userId] = []
    groups[userId].push(item)
    return groups
  }, {})
}
