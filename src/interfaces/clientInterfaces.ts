import type { ClinicalRecord } from "~/interfaces/clinicalRecordInterfaces";

export type ClientGender = "MALE" | "FEMALE" | "OTHER"

export interface Client {
    id?: string
    firstName: string
    lastName: string
    documentNumber?: string
    phone?: string
    email?: string
    birthDate?: string
    gender?: ClientGender
    salonId?: string
    clinicalRecords: ClinicalRecord[]
}

export const CLIENT_GENDER_LABELS: Record<ClientGender, string> = {
    MALE: "Masculino",
    FEMALE: "Femenino",
    OTHER: "Otro",
}

export const getClientGenderLabel = (gender?: ClientGender | string | null) =>
    gender ? CLIENT_GENDER_LABELS[gender as ClientGender] ?? gender : "—"

export interface clientDataModalForm {
    action: "create" | "update" | "clinicalRecords"
    rowId?: number | string
    branches?: any
}