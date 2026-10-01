export type SaleStatus = "COMPLETED" | "PARTIALLY_PAID" | "CANCELLED"
export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "YAPE" | "PLIN" | "OTHER"

export interface SaleItem {
  id?: number
  saleId?: number
  serviceId?: number | null
  serviceName?: string
  productId?: number | null
  productName?: string
  userId?: number | null
  userName?: string
  quantity: number
  unitPrice: number
  discountAmount?: number
  lineTotal?: number
  appointmentId?: number | null
  createdAt?: string
}

export interface SalePayment {
  id?: number
  saleId?: number
  amount: number
  paymentMethod: PaymentMethod
  reference?: string | null
  paidAt?: string
  createdAt?: string
}

export interface Sale {
  id?: number
  salonId?: number
  clientId: number
  clientName?: string
  branchId: number
  branchName?: string
  registeredByUserId?: number
  registeredByUserName?: string
  appointmentId?: number | null
  subtotal?: number
  discountAmount?: number
  totalAmount?: number
  amountPaid?: number
  notes?: string | null
  status: SaleStatus
  soldAt?: string
  cancelledAt?: string | null
  cancellationReason?: string | null
  createdAt?: string
  updatedAt?: string
  items?: SaleItem[]
  payments?: SalePayment[]
}

export interface SaleFilters {
  branchId?: number
  clientId?: number
  status?: SaleStatus
  from?: string
  to?: string
}

export interface SaleReportFilters {
  from: string
  to: string
  branchId?: number
  userId?: number
}

export interface SalePaymentMethodBreakdown {
  paymentMethod: PaymentMethod
  amount: number
}

export interface SaleTopService {
  serviceId: number
  serviceName: string
  quantity: number
  revenue: number
}

export interface SaleProfessionalRevenue {
  userId: number
  userName: string
  itemsSold: number
  revenue: number
}

export interface SaleDailyBreakdown {
  date: string
  salesCount: number
  revenue: number
}

export interface SalesReportResponse {
  from: string
  to: string
  totalSales: number
  totalRevenue: number
  totalPaid: number
  totalOutstanding: number
  revenueByPaymentMethod: Partial<Record<PaymentMethod, number>>
  topServices: SaleTopService[]
  byProfessional: SaleProfessionalRevenue[]
  dailyBreakdown: SaleDailyBreakdown[]
}

export interface CreateSalePaymentPayload {
  amount: number
  paymentMethod: PaymentMethod
  reference?: string
  paidAt?: string
}

export interface CreateSaleItemPayload {
  serviceId?: number
  productId?: number
  userId?: number
  quantity: number
  unitPrice?: number
  discountAmount?: number
}

export interface CreateSaleRequest {
  clientId: number
  branchId: number
  soldAt?: string
  appointmentId?: number
  discountAmount?: number
  notes?: string
  items: CreateSaleItemPayload[]
  payments?: CreateSalePaymentPayload[]
}

export interface saleDataModalForm {
  action: "create"
}

export const SALE_STATUS_OPTIONS: Array<{ label: string; value: SaleStatus }> = [
  { label: "Completada", value: "COMPLETED" },
  { label: "Pago parcial", value: "PARTIALLY_PAID" },
  { label: "Cancelada", value: "CANCELLED" },
]

export const PAYMENT_METHOD_OPTIONS: Array<{ label: string; value: PaymentMethod }> = [
  { label: "Efectivo", value: "CASH" },
  { label: "Tarjeta", value: "CARD" },
  { label: "Transferencia", value: "TRANSFER" },
  { label: "Yape", value: "YAPE" },
  { label: "Plin", value: "PLIN" },
  { label: "Otro", value: "OTHER" },
]

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  COMPLETED: "Completada",
  PARTIALLY_PAID: "Pago parcial",
  CANCELLED: "Cancelada",
}

export const SALE_STATUS_COLORS: Record<SaleStatus, string> = {
  COMPLETED: "success",
  PARTIALLY_PAID: "warning",
  CANCELLED: "error",
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  YAPE: "Yape",
  PLIN: "Plin",
  OTHER: "Otro",
}

export function getSaleStatusLabel(status?: SaleStatus): string {
  if (!status) return "—"
  return SALE_STATUS_LABELS[status] ?? status
}

export function getSaleStatusColor(status?: SaleStatus): string {
  if (!status) return "default"
  return SALE_STATUS_COLORS[status] ?? "default"
}

export function getPaymentMethodLabel(method?: PaymentMethod): string {
  if (!method) return "—"
  return PAYMENT_METHOD_LABELS[method] ?? method
}

export function getSaleAmountPaid(sale?: Pick<Sale, "amountPaid" | "payments"> | null): number {
  if (!sale) return 0
  if (sale.amountPaid != null) return Number(sale.amountPaid)

  return (sale.payments ?? []).reduce(
    (total, payment) => total + (Number(payment.amount) || 0),
    0
  )
}

export function getSalePendingAmount(
  sale?: Pick<Sale, "totalAmount" | "amountPaid" | "payments"> | null
): number {
  if (!sale) return 0
  return Math.max(0, Number(sale.totalAmount ?? 0) - getSaleAmountPaid(sale))
}

export function getSaleSoldAt(sale?: Pick<Sale, "soldAt" | "createdAt"> | null): string | undefined {
  return sale?.soldAt ?? sale?.createdAt
}

export function getSaleItemLabel(item: SaleItem): string {
  return item.serviceName ?? item.productName ?? "—"
}

export function getSaleItemTotal(item: SaleItem): number {
  if (item.lineTotal != null) return Number(item.lineTotal)

  const quantity = Number(item.quantity) || 0
  const unitPrice = Number(item.unitPrice) || 0
  const discount = Number(item.discountAmount) || 0
  return Math.max(0, unitPrice * quantity - discount)
}
