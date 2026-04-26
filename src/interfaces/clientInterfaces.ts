export interface Client {
    id?: string
    firstName: string
    lastName: string
    documentNumber: string
    phone: string
    email: string
    birthDate: string
    gender: Gender
    salonId?: string
}

enum Gender {
    MAN,
    WOMAN,
}

export interface clientDataModalForm {
    action: "create" | "update" | "clinicalRecords"
    rowId?: number | string
    branches?: any
}