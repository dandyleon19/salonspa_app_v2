import type { Service } from "~/interfaces/serviceInterfaces";

export interface ServiceCategory {
    id?: string
    name: string
    description: string
    longDescription: string
    services?: Service[]
    serviceCount?: number
    salonId?: string
}

export interface serviceCategoryDataModalForm {
    action: "create" | "update" | "services"
    rowId?: number | string
    services?: any
}

export function getServiceCategoryServicesCount(
    category: Pick<ServiceCategory, "services" | "serviceCount">
): number {
    if (typeof category.serviceCount === "number") {
        return category.serviceCount
    }

    return category.services?.length ?? 0
}

export function formatServiceCategoryServicesCount(count: number): string {
    return count === 1 ? "1 servicio" : `${count} servicios`
}