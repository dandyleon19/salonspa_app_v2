export type UserRole = "SUPER_ADMIN" | "ADMIN_USER" | "STAFF_USER"

export type UserTableAction =
  | "status:activate"
  | "status:deactivate"
  | "role:change"

export interface User {
  id?: string | number
  firstName: string
  lastName: string
  fullName?: string
  email: string
  isActive: boolean
  role?: UserRole
  commissionPercentage: number | string
  salonId?: number
  salonName?: string
  password: string
  passwordConfirmation?: string
}

export interface UpdateUserRequest {
  firstName: string
  lastName: string
  email: string
  isActive: boolean
  role: UserRole
  commissionPercentage: number
}

export interface CreateUserRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  role: UserRole
  commissionPercentage: number
  salonId?: number
}

export interface UserFilters {
  isActive?: boolean
  role?: UserRole
  search?: string
}

export const USER_STATUS_LABELS = {
  active: "Activo",
  inactive: "Inactivo",
} as const

export const USER_STATUS_COLORS = {
  active: "success",
  inactive: "error",
} as const

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super administrador",
  ADMIN_USER: "Administrador",
  STAFF_USER: "Personal",
}

export const USER_ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN: "primary",
  ADMIN_USER: "info",
  STAFF_USER: "grey",
}

export const ASSIGNABLE_USER_ROLES: UserRole[] = ["ADMIN_USER", "STAFF_USER"]

export const USER_ROLE_OPTIONS = ASSIGNABLE_USER_ROLES.map((role) => ({
  value: role,
  label: USER_ROLE_LABELS[role],
}))

export const USER_ROLE_FILTER_OPTIONS = (
  Object.keys(USER_ROLE_LABELS) as UserRole[]
).map((role) => ({
  value: role,
  label: USER_ROLE_LABELS[role],
}))

export const USER_ACTION_COLORS: Record<UserTableAction, string> = {
  "status:activate": "success",
  "status:deactivate": "warning",
  "role:change": "primary",
}

export const USER_ACTION_ICONS: Record<UserTableAction, string> = {
  "status:activate": "mdi-account-check-outline",
  "status:deactivate": "mdi-account-off-outline",
  "role:change": "mdi-shield-account-outline",
}

export const USER_ACTION_LABELS: Record<UserTableAction, string> = {
  "status:activate": "Activar",
  "status:deactivate": "Desactivar",
  "role:change": "Cambiar rol",
}

export const getUserStatusLabel = (isActive?: boolean | null) =>
  isActive ? USER_STATUS_LABELS.active : USER_STATUS_LABELS.inactive

export const getUserStatusColor = (isActive?: boolean | null) =>
  isActive ? USER_STATUS_COLORS.active : USER_STATUS_COLORS.inactive

export const getUserRoleLabel = (role?: UserRole | null) =>
  role ? USER_ROLE_LABELS[role] ?? role : "—"

export const getUserRoleColor = (role?: UserRole | null) =>
  role ? USER_ROLE_COLORS[role] ?? "default" : "default"

export const getUserTableActions = (user: User): UserTableAction[] => {
  const actions: UserTableAction[] = []

  if (user.isActive) {
    actions.push("status:deactivate")
  } else {
    actions.push("status:activate")
  }

  const canChangeRole =
    user.role !== "SUPER_ADMIN" &&
    ASSIGNABLE_USER_ROLES.some((role) => role !== user.role)

  if (canChangeRole) {
    actions.push("role:change")
  }

  return actions
}

export const getUserActionLabel = (action: UserTableAction) =>
  USER_ACTION_LABELS[action] ?? action

export const getUserActionIcon = (action: UserTableAction) =>
  USER_ACTION_ICONS[action] ?? "mdi-help-circle-outline"

export const getUserActionColor = (action: UserTableAction) =>
  USER_ACTION_COLORS[action] ?? "primary"

export interface userDataModalForm {
  action: "create" | "update" | "changePassword"
  rowId?: number | string
}
