export interface User {
  id?: string
  firstName: string
  lastName: string
  email: string
  isActive: boolean
  commissionPercentage: number | string
  password: string
  passwordConfirmation?: string
}

export interface userDataModalForm {
  action: "create" | "update" | "changePassword"
  rowId?: number | string
}