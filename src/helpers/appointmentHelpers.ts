import {
  combineDateAndTime,
  formatDateInput,
  formatTimeDisplay,
  formatTimeInput,
  getTodayDate,
  splitIsoDateTime,
} from "~/helpers/dateTimeHelpers"
import type {
  Appointment,
  AppointmentCalendarFilters,
  AppointmentFilters,
  AppointmentStatus,
  UpdateAppointmentRequest,
} from "~/interfaces/appointmentInterfaces"
import { APPOINTMENT_STATUS_LABELS } from "~/interfaces/appointmentInterfaces"

export interface CalendarCell {
  date: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
}

export const CALENDAR_WEEKDAY_LABELS = [
  "Lun",
  "Mar",
  "Mié",
  "Jue",
  "Vie",
  "Sáb",
  "Dom",
] as const

export const CALENDAR_MONTH_LABELS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const

export const CALENDAR_MONTH_SHORT_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
] as const

export const CALENDAR_MIN_YEAR = 2000
export const CALENDAR_MAX_YEAR = 2100
import type { Service } from "~/interfaces/serviceInterfaces"

export const DEFAULT_APPOINTMENT_DURATION_MINUTES = 60

export function belongsToSalon<T extends { salonId?: string | number | null }>(
  item: T,
  salonId?: string | number | null
): boolean {
  if (!salonId) return true
  if (item.salonId == null || item.salonId === "") return true
  return String(item.salonId) === String(salonId)
}

export function getServiceDurationMinutes(
  service?: Pick<Service, "durationMinutes"> | null
): number {
  const duration = service?.durationMinutes
  if (typeof duration === "number" && duration > 0) {
    return duration
  }
  return DEFAULT_APPOINTMENT_DURATION_MINUTES
}

export function addMinutesToIsoDateTime(
  startAt: string,
  minutes: number
): string {
  const { date, time } = splitIsoDateTime(startAt)
  const [year, month, day] = date.split("-").map(Number)
  const [hours, mins] = time.split(":").map(Number)
  const start = new Date(year, month - 1, day, hours, mins, 0)

  start.setMinutes(start.getMinutes() + minutes)

  return combineDateAndTime(formatDateInput(start), formatTimeInput(start))
}

export function formatEstimatedEndTime(startAt: string, durationMinutes: number): string {
  const endAt = addMinutesToIsoDateTime(startAt, durationMinutes)
  const { time } = splitIsoDateTime(endAt)
  return formatTimeDisplay(time)
}

export function normalizeAppointmentFilters(
  values: Record<string, unknown> = {}
): AppointmentFilters {
  const filters: AppointmentFilters = {}

  if (values.branchId != null && values.branchId !== "") {
    filters.branchId = Number(values.branchId)
  }

  if (values.userId != null && values.userId !== "") {
    filters.userId = Number(values.userId)
  }

  if (values.clientId != null && values.clientId !== "") {
    filters.clientId = Number(values.clientId)
  }

  if (values.date != null && values.date !== "") {
    filters.date = String(values.date).slice(0, 10)
  }

  if (values.status != null && values.status !== "") {
    const status = String(values.status)
    if (status in APPOINTMENT_STATUS_LABELS) {
      filters.status = status as AppointmentStatus
    }
  }

  return filters
}

export function areAppointmentFiltersEqual(
  current: AppointmentFilters = {},
  next: AppointmentFilters = {}
): boolean {
  return (
    current.branchId === next.branchId &&
    current.userId === next.userId &&
    current.clientId === next.clientId &&
    current.date === next.date &&
    current.status === next.status
  )
}

export function normalizeAppointmentCalendarFilters(
  values: Record<string, unknown> = {}
): AppointmentCalendarFilters {
  const filters: AppointmentCalendarFilters = {}

  if (values.branchId != null && values.branchId !== "") {
    filters.branchId = Number(values.branchId)
  }

  if (values.userId != null && values.userId !== "") {
    filters.userId = Number(values.userId)
  }

  if (values.status != null && values.status !== "") {
    const status = String(values.status)
    if (status in APPOINTMENT_STATUS_LABELS) {
      filters.status = status as AppointmentStatus
    }
  }

  return filters
}

export function areAppointmentCalendarFiltersEqual(
  current: AppointmentCalendarFilters = {},
  next: AppointmentCalendarFilters = {}
): boolean {
  return (
    current.branchId === next.branchId &&
    current.userId === next.userId &&
    current.status === next.status
  )
}

export function groupAppointmentsByDay(
  appointments: Appointment[] = []
): Record<string, Appointment[]> {
  return appointments.reduce<Record<string, Appointment[]>>((acc, appointment) => {
    const day = appointment.startAt.slice(0, 10)
    ;(acc[day] ??= []).push(appointment)
    return acc
  }, {})
}

export function buildCalendarMonthCells(year: number, month: number): CalendarCell[] {
  const today = getTodayDate()
  const firstOfMonth = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const startWeekday = (firstOfMonth.getDay() + 6) % 7
  const cells: CalendarCell[] = []

  const prevMonthLastDay = new Date(year, month - 1, 0).getDate()
  for (let index = startWeekday - 1; index >= 0; index--) {
    const day = prevMonthLastDay - index
    const date = formatDateInput(new Date(year, month - 2, day))
    cells.push({
      date,
      day,
      isCurrentMonth: false,
      isToday: date === today,
    })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = formatDateInput(new Date(year, month - 1, day))
    cells.push({
      date,
      day,
      isCurrentMonth: true,
      isToday: date === today,
    })
  }

  let nextDay = 1
  while (cells.length % 7 !== 0) {
    const date = formatDateInput(new Date(year, month, nextDay))
    cells.push({
      date,
      day: nextDay,
      isCurrentMonth: false,
      isToday: date === today,
    })
    nextDay++
  }

  return cells
}

export function formatCalendarMonthLabel(year: number, month: number): string {
  const monthLabel = CALENDAR_MONTH_LABELS[month - 1] ?? String(month)
  return `${monthLabel} ${year}`
}

export function buildAppointmentStatusUpdateBody(
  status: AppointmentStatus,
  cancellationReason?: string
): UpdateAppointmentRequest {
  const body: UpdateAppointmentRequest = { status }

  if (status === "CANCELLED" && cancellationReason?.trim()) {
    body.cancellationReason = cancellationReason.trim()
  }

  return body
}
