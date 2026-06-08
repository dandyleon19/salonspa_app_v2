import type { Service } from "~/interfaces/serviceInterfaces";

export interface ServiceCategory {
    id?: string
    name: string
    description: string
    longDescription: string
    services?: Service[]
    salonId?: string
}

export interface serviceCategoryDataModalForm {
    action: "create" | "update" | "services"
    rowId?: number | string
    services?: any
}