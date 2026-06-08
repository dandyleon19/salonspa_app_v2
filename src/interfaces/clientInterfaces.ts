import type { ClinicalRecord } from "~/interfaces/clinicalRecordInterfaces";

export interface Client {
    id?: string
    firstName: string
    lastName: string
    documentNumber?: string
    phone?: string
    email?: string
    birthDate?: string
    gender?: Gender
    salonId?: string
    clinicalRecords: ClinicalRecord[]
}

enum Gender {
    MALE,
    FEMALE,
    OTHER,
}

export interface clientDataModalForm {
    action: "create" | "update" | "clinicalRecords"
    rowId?: number | string
    branches?: any
}