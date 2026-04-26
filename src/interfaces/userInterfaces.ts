export interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  commission_percentage: number | string
  password: string
  salon: string
}

export interface userDataModalForm {
  action: "create" | "update" | "changePassword" | "changeBranchOffices"
  rowId?: number | string
}