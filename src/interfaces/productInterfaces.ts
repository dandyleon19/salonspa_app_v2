export interface Product {
    id?: string
    name: string
    description?: string
    longDescription?: string
    price?: number | null
    stockQuantity?: number | null
    lowStockThreshold?: number | null
    isActive: boolean
    imageUrl?: string | null
    salonId?: string
    categoryId?: string
}

export interface productDataModalForm {
    action: "create" | "update"
    rowId?: number | string
}

export type ProductStockStatus = "out" | "low" | "ok"

export const DEFAULT_LOW_STOCK_THRESHOLD = 5

export function getProductStockStatus(
    product: Pick<Product, "stockQuantity" | "lowStockThreshold">
): ProductStockStatus {
    const stock = product.stockQuantity ?? 0
    const threshold = product.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD

    if (stock <= 0) return "out"
    if (stock <= threshold) return "low"
    return "ok"
}

export function getProductStockStatusColor(status: ProductStockStatus): string {
    if (status === "out") return "error"
    if (status === "low") return "warning"
    return "default"
}

export function getProductStockStatusLabel(
    product: Pick<Product, "stockQuantity" | "lowStockThreshold">
): string {
    const stock = product.stockQuantity ?? 0
    const status = getProductStockStatus(product)

    if (status === "out") return "Sin stock"
    if (status === "low") return `Stock bajo: ${stock}`
    return `Stock: ${stock}`
}
