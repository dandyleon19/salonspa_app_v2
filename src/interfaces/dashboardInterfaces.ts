import type { Appointment, AppointmentStatus } from "~/interfaces/appointmentInterfaces"

export interface DashboardFilters {
  date?: string
  branchId?: number
  userId?: number
}

export interface DashboardResponse {
  date: string
  year: number
  month: number
  totalClients: number
  activeUsers: number
  todayAppointments: number
  todayScheduled: number
  todayConfirmed: number
  todayInProgress: number
  todayCompleted: number
  monthAppointments: number
  monthCancelled: number
  monthNoShow: number
  appointmentsByStatus: Partial<Record<AppointmentStatus, number>>
  todaySchedule: Appointment[]
  upcomingAppointments: Appointment[]
}
