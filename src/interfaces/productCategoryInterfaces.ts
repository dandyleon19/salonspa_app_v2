import type { Product } from "~/interfaces/productInterfaces";

export interface ProductCategory {
    id?: string
    name: string
    description: string
    longDescription: string
    products?: Product[]
    productCount?: number
    salonId?: string
}

export interface productCategoryDataModalForm {
    action: "create" | "update" | "products"
    rowId?: number | string
    products?: any
}

export function getProductCategoryProductsCount(
    category: Pick<ProductCategory, "products" | "productCount">
): number {
    if (typeof category.productCount === "number") {
        return category.productCount
    }

    return category.products?.length ?? 0
}

export function formatProductCategoryProductsCount(count: number): string {
    return count === 1 ? "1 producto" : `${count} productos`
}
