export interface ClinicalRecord {
    id?: string
    diagnosis?: string
    treatment?: string
    observations?: string
    sessionDate?: string
    clientId?: string
    userId?: string
    branchId?: string
    serviceId?: string
    associatedServices?: string[]
    userName?: string
    branchName?: string
}

export interface clinicalRecordDataModalForm {
    action: "create" | "update"
    rowId?: number | string
    branches?: any
}