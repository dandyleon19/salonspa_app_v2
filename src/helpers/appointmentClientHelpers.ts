import type { AppointmentClientContact } from "~/interfaces/appointmentInterfaces"
import { getClientGenderLabel } from "~/interfaces/clientInterfaces"
import { formatDateDisplay } from "~/helpers/dateTimeHelpers"

export function hasAppointmentClientContact(
  appointment?: AppointmentClientContact | null
): boolean {
  if (!appointment) return false

  return Boolean(
    appointment.clientPhone ||
      appointment.clientEmail ||
      appointment.clientBirthDate ||
      appointment.clientGender
  )
}

export function formatAppointmentClientBirthDate(
  birthDate?: string | null
): string {
  if (!birthDate) return "—"
  return formatDateDisplay(birthDate.slice(0, 10))
}

export function formatAppointmentClientGender(
  gender?: string | null
): string {
  return getClientGenderLabel(gender)
}
