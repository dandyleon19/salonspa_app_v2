import type {
  UpdateUserRequest,
  User,
  UserFilters,
  UserRole,
} from "~/interfaces/userInterfaces"
import { ASSIGNABLE_USER_ROLES, USER_ROLE_LABELS } from "~/interfaces/userInterfaces"

function parseCommissionPercentage(
  value: number | string | null | undefined
): number {
  if (value == null || value === "") return 0
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  const parsed = Number(String(value).replace("%", "").trim())
  return Number.isFinite(parsed) ? parsed : 0
}

export function buildUpdateUserPayload(
  user: User,
  overrides: Partial<UpdateUserRequest> = {}
): UpdateUserRequest {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    isActive: overrides.isActive ?? user.isActive,
    role: overrides.role ?? user.role ?? "STAFF_USER",
    commissionPercentage: parseCommissionPercentage(
      overrides.commissionPercentage ?? user.commissionPercentage
    ),
  }
}

export function canManageUserRole(user: Pick<User, "role">): boolean {
  return user.role !== "SUPER_ADMIN"
}

export function getAvailableRoleTargets(currentRole?: UserRole | null): UserRole[] {
  if (currentRole === "SUPER_ADMIN") return []

  return ASSIGNABLE_USER_ROLES.filter((role) => role !== currentRole)
}

export function normalizeUserFilters(
  values: Record<string, unknown> = {}
): UserFilters {
  const filters: UserFilters = {}

  if (values.isActive === "true" || values.isActive === true) {
    filters.isActive = true
  } else if (values.isActive === "false" || values.isActive === false) {
    filters.isActive = false
  }

  if (values.role != null && values.role !== "") {
    const role = String(values.role)
    if (role in USER_ROLE_LABELS) {
      filters.role = role as UserRole
    }
  }

  return filters
}

export function areUserFiltersEqual(
  current: UserFilters = {},
  next: UserFilters = {}
): boolean {
  return (
    current.isActive === next.isActive &&
    current.role === next.role &&
    current.search === next.search
  )
}
