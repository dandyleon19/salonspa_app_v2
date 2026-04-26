export interface Salon {
    id?: string
    name: string
    socialReason: string
    rucNumber: string
    fiscalAddress: string
    phone?: string
    branches: Branch[]
}

export interface Branch {
    id?: number
    name: string
    address: string
    city: string
    salonId?: string
}

export interface salonDataModalForm {
    action: "create" | "update" | "branches"
    rowId?: number | string
    branches?: any
}