export interface CommissionReportFilters {
  from: string
  to: string
  branchId?: number
  userId?: number
}

export interface CommissionByUser {
  userId: number
  userName: string
  defaultCommissionPercentage: number
  itemsSold: number
  revenue: number
  commissionAmount: number
}

export interface CommissionByUserAndService {
  userId: number
  userName: string
  serviceId: number
  serviceName: string
  quantity: number
  revenue: number
  appliedCommissionPercentage: number
  usedServiceCommission: boolean
  commissionAmount: number
}

export interface CommissionReportResponse {
  from: string
  to: string
  totalItems: number
  totalRevenue: number
  totalCommission: number
  byUser: CommissionByUser[]
  byUserAndService: CommissionByUserAndService[]
}
