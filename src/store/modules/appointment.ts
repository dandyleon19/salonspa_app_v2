import { defineStore } from "pinia"
import { buildAppointmentStatusUpdateBody } from "~/helpers/appointmentHelpers"
import type {
  Appointment,
  AppointmentCalendarFilters,
  AppointmentCalendarResponse,
  AppointmentFilters,
  AppointmentStatus,
} from "~/interfaces/appointmentInterfaces"
import type { PageResponse } from "~/interfaces/PageResponse"

export const useAppointmentsStore = defineStore("appointments", {
  state: () => ({
    data: null as PageResponse<Appointment> | null,
    loading: true,
    calendarData: null as AppointmentCalendarResponse | null,
    calendarLoading: false,
  }),

  actions: {
    async fetchAppointments(
      page = 0,
      size = 10,
      filters: AppointmentFilters = {}
    ) {
      this.loading = true
      try {
        const { $api } = useNuxtApp()
        const query: Record<string, number | string> = { page, size }

        if (filters.branchId != null) query.branchId = filters.branchId
        if (filters.userId != null) query.userId = filters.userId
        if (filters.clientId != null) query.clientId = filters.clientId
        if (filters.date) query.date = filters.date
        if (filters.status) query.status = filters.status

        this.data = await $api<PageResponse<Appointment>>("/api/appointments", {
          method: "GET",
          query,
        })
      } catch (err) {
        console.error("Error al obtener citas:", err)
      } finally {
        this.loading = false
      }
    },

    async fetchAppointmentsCalendar(
      year: number,
      month: number,
      filters: AppointmentCalendarFilters = {}
    ) {
      this.calendarLoading = true
      try {
        const { $api } = useNuxtApp()
        const query: Record<string, number | string> = { year, month }

        if (filters.branchId != null) query.branchId = filters.branchId
        if (filters.userId != null) query.userId = filters.userId
        if (filters.status) query.status = filters.status

        this.calendarData = await $api<AppointmentCalendarResponse>(
          "/api/appointments/calendar",
          {
            method: "GET",
            query,
          }
        )
      } catch (err) {
        console.error("Error al obtener calendario de citas:", err)
        throw err
      } finally {
        this.calendarLoading = false
      }
    },

    async updateAppointmentStatus(
      id: number | string,
      status: AppointmentStatus,
      cancellationReason?: string
    ) {
      const { $api } = useNuxtApp()
      await $api(`/api/appointments/${id}`, {
        method: "PUT",
        body: buildAppointmentStatusUpdateBody(status, cancellationReason),
      })
    },
  },
})
