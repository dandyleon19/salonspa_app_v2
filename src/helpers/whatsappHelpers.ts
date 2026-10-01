import type { Appointment } from "~/interfaces/appointmentInterfaces"
import {
  formatDateDisplay,
  formatTimeDisplay,
  getTodayDate,
  getTomorrowDate,
  splitIsoDateTime,
} from "~/helpers/dateTimeHelpers"

const PERU_COUNTRY_CODE = "51"

export function normalizePhoneForWhatsApp(phone?: string | null): string | null {
  if (!phone) return null

  const digits = phone.replace(/\D/g, "")
  if (!digits) return null

  if (digits.length === 9) return `${PERU_COUNTRY_CODE}${digits}`
  if (digits.length === 11 && digits.startsWith(PERU_COUNTRY_CODE)) return digits
  if (digits.length >= 8) return digits

  return null
}

export function buildAppointmentReminderMessage(
  appointment: Appointment,
  salonName?: string | null
): string {
  const { date, time } = splitIsoDateTime(appointment.startAt)
  const dateLabel = formatDateDisplay(date)
  const timeLabel = formatTimeDisplay(time)
  const clientFirstName = appointment.clientName?.split(" ")[0] ?? ""
  const spa = salonName || "nuestro salón"

  const relativeDay =
    date === getTodayDate() ? "hoy" : date === getTomorrowDate() ? "mañana" : null

  const whenLabel =
    dateLabel && timeLabel
      ? `${relativeDay ? `${relativeDay}, ` : "el "}${dateLabel} a las ${timeLabel}`
      : relativeDay || "pronto"

  const parts = [
    `Hola${clientFirstName ? ` ${clientFirstName}` : ""}, te recordamos tu cita en ${spa}`,
    whenLabel,
    appointment.serviceName ? `para ${appointment.serviceName}` : "",
    ". ¡Te esperamos!",
  ]

  return parts.filter(Boolean).join(" ").replace(/ \./g, ".")
}

export function buildWhatsAppReminderLink(
  appointment: Appointment,
  salonName?: string | null
): string | null {
  const phone = normalizePhoneForWhatsApp(appointment.clientPhone)
  if (!phone) return null

  const message = buildAppointmentReminderMessage(appointment, salonName)
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
