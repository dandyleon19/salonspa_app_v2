import type { DashboardFilters } from "~/interfaces/dashboardInterfaces"

export function normalizeDashboardFilters(
  values: DashboardFilters = {}
): DashboardFilters {
  const filters: DashboardFilters = {}

  if (values.date?.trim()) {
    filters.date = values.date.trim()
  }

  if (values.branchId != null) {
    const branchId = Number(values.branchId)
    if (Number.isFinite(branchId)) {
      filters.branchId = branchId
    }
  }

  if (values.userId != null) {
    const userId = Number(values.userId)
    if (Number.isFinite(userId)) {
      filters.userId = userId
    }
  }

  return filters
}

export function areDashboardFiltersEqual(
  current: DashboardFilters = {},
  next: DashboardFilters = {}
): boolean {
  return (
    current.date === next.date &&
    current.branchId === next.branchId &&
    current.userId === next.userId
  )
}
