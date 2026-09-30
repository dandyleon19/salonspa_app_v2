export interface Salon {
    id?: string
    name: string
    socialReason: string
    rucNumber: string
    fiscalAddress: string
    phone?: string
    logoUrl?: string | null
    branches?: Branch[]
}

export interface Branch {
    id?: string
    name: string
    address: string
    city: string
    salonId?: string | number
    salonName?: string
}

export interface salonDataModalForm {
    action: "create" | "update" | "branches"
    rowId?: number | string
    branches?: any
}

export interface branchDataModalForm {
    action: "create" | "update"
    rowId?: number | string
    branches?: any
}