export interface Service {
    id?: string
    name: string
    description?: string
    longDescription?: string
    price?: number | null
    isActive: boolean
    salonId?: string
    categoryId?: string
}

export interface serviceDataModalForm {
    action: "create" | "update"
    rowId?: number | string
}