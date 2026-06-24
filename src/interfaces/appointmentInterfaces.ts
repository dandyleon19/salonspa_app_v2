export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"

export type AppointmentClientGender = "MALE" | "FEMALE" | "OTHER"

export interface Appointment {
  id?: number | string
  clientId: number
  userId: number
  branchId: number
  salonId?: number
  serviceId?: number | null
  startAt: string
  endAt?: string
  status?: AppointmentStatus
  notes?: string
  cancellationReason?: string
  cancelledAt?: string
  clientName?: string
  clientPhone?: string | null
  clientEmail?: string | null
  clientBirthDate?: string | null
  clientGender?: AppointmentClientGender | string | null
  userName?: string
  branchName?: string
  serviceName?: string
  createdAt?: string
  updatedAt?: string
}

export type AppointmentClientContact = Pick<
  Appointment,
  | "clientName"
  | "clientPhone"
  | "clientEmail"
  | "clientBirthDate"
  | "clientGender"
>

export interface CreateAppointmentRequest {
  clientId: number
  userId: number
  branchId: number
  serviceId?: number
  startAt: string
  notes?: string
}

export interface UpdateAppointmentRequest {
  userId?: number
  branchId?: number
  serviceId?: number
  startAt?: string
  status?: AppointmentStatus
  notes?: string
  cancellationReason?: string
}

export interface NextAppointmentRequest {
  userId: number
  branchId: number
  startAt: string
  serviceId?: number
  notes?: string
}

export interface AppointmentFilters {
  branchId?: number
  userId?: number
  clientId?: number
  date?: string
  status?: AppointmentStatus
}

export interface AppointmentCalendarFilters {
  branchId?: number
  userId?: number
  status?: AppointmentStatus
}

export interface AppointmentCalendarResponse {
  year: number
  month: number
  from: string
  to: string
  total: number
  appointments: Appointment[]
}

export interface appointmentDataModalForm {
  action: "create" | "update"
  rowId?: number | string
}

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
}

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  SCHEDULED: "grey",
  CONFIRMED: "primary",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "error",
  NO_SHOW: "error",
}

export const APPOINTMENT_STATUS_ACTIONS: Record<
  AppointmentStatus,
  AppointmentStatus[]
> = {
  SCHEDULED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED", "NO_SHOW"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
}

export const APPOINTMENT_STATUS_ACTION_LABELS: Partial<
  Record<AppointmentStatus, string>
> = {
  CONFIRMED: "Confirmar",
  IN_PROGRESS: "Iniciar",
  COMPLETED: "Finalizar",
  CANCELLED: "Cancelar",
  NO_SHOW: "No asistió",
}

export const APPOINTMENT_STATUS_ACTION_ICONS: Partial<
  Record<AppointmentStatus, string>
> = {
  CONFIRMED: "mdi-check-circle-outline",
  IN_PROGRESS: "mdi-play-circle-outline",
  COMPLETED: "mdi-check-all",
  CANCELLED: "mdi-close-circle-outline",
  NO_SHOW: "mdi-account-off-outline",
}

export const APPOINTMENT_STATUS_ACTION_COLORS: Partial<
  Record<AppointmentStatus, string>
> = {
  CONFIRMED: "primary",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "error",
  NO_SHOW: "error",
}

/** @deprecated Use APPOINTMENT_STATUS_LABELS */
export const APPOINTMENT_STATUS_OPTIONS: {
  value: AppointmentStatus
  label: string
}[] = Object.entries(APPOINTMENT_STATUS_LABELS).map(([value, label]) => ({
  value: value as AppointmentStatus,
  label,
}))

export const getAppointmentStatusLabel = (status?: AppointmentStatus) =>
  status ? APPOINTMENT_STATUS_LABELS[status] ?? status : "—"

export const getAppointmentStatusColor = (status?: AppointmentStatus) =>
  status ? APPOINTMENT_STATUS_COLORS[status] ?? "default" : "default"

export const getAppointmentStatusActions = (
  status?: AppointmentStatus
): AppointmentStatus[] =>
  status ? APPOINTMENT_STATUS_ACTIONS[status] ?? [] : []

export const isInactiveAppointmentStatus = (status?: AppointmentStatus) =>
  status === "CANCELLED" || status === "NO_SHOW"
