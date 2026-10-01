export type StockMovementType = "RESTOCK" | "ADJUSTMENT" | "SALE" | "SALE_CANCELLED"

export interface ProductStockMovement {
    id?: number
    productId: number
    movementType: StockMovementType
    quantityDelta: number
    resultingStock: number
    reason?: string | null
    saleId?: number | null
    createdByUserId?: number | null
    createdByUserName?: string | null
    createdAt?: string
}

export interface CreateProductStockMovementRequest {
    movementType: "RESTOCK" | "ADJUSTMENT"
    quantityDelta: number
    reason?: string
}

export const STOCK_MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
    RESTOCK: "Reposición",
    ADJUSTMENT: "Corrección",
    SALE: "Venta",
    SALE_CANCELLED: "Venta cancelada",
}

export const STOCK_MOVEMENT_TYPE_COLORS: Record<StockMovementType, string> = {
    RESTOCK: "success",
    ADJUSTMENT: "info",
    SALE: "primary",
    SALE_CANCELLED: "warning",
}

export function getStockMovementTypeLabel(type: StockMovementType): string {
    return STOCK_MOVEMENT_TYPE_LABELS[type] ?? type
}

export function getStockMovementTypeColor(type: StockMovementType): string {
    return STOCK_MOVEMENT_TYPE_COLORS[type] ?? "default"
}
