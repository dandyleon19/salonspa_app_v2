export function formatDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatTimeInput(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${hours}:${minutes}`
}

export function getTodayDate(): string {
  return formatDateInput(new Date())
}

export function getCurrentTime(): string {
  return formatTimeInput(new Date())
}

export function getMinFutureTime(): string {
  const date = new Date()
  date.setMinutes(date.getMinutes() + 1)
  date.setSeconds(0, 0)
  return formatTimeInput(date)
}

export function splitIsoDateTime(value?: string): { date: string; time: string } {
  if (!value) return { date: "", time: "" }

  if (value.includes("T")) {
    const [date = "", time = ""] = value.split("T")
    return { date, time: time.slice(0, 5) }
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return { date: value, time: "" }
  }

  return {
    date: formatDateInput(parsed),
    time: formatTimeInput(parsed),
  }
}

export function combineDateAndTime(date: string, time: string): string {
  return `${date}T${time}`
}

export function isDateAfterToday(date: string): boolean {
  if (!date) return false

  const selected = new Date(`${date}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return selected.getTime() > today.getTime()
}

export function isDateTimeAfterNow(date: string, time: string): boolean {
  if (!date || !time) return false

  const selected = new Date(combineDateAndTime(date, time))
  return selected.getTime() > Date.now()
}

export function isDateTimeBeforeNow(date: string, time: string): boolean {
  if (!date || !time) return false

  const selected = new Date(combineDateAndTime(date, time))
  return selected.getTime() < Date.now()
}

export function isIsoDateTimeBeforeNow(value?: string): boolean {
  if (!value) return false

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return false

  return parsed.getTime() < Date.now()
}

export function isTimeAfterCurrentTime(time: string): boolean {
  if (!time) return false
  return time > getCurrentTime()
}

export function isTimeBeforeOrEqualCurrentTime(time: string): boolean {
  if (!time) return false
  return time <= getCurrentTime()
}

export function formatDateDisplay(value?: string): string {
  if (!value) return ""

  const parsed = new Date(`${value}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return value

  const day = parsed.getDate()
  const month = parsed
    .toLocaleDateString("es-PE", { month: "short" })
    .replace(/\.$/, "")
  const year = parsed.getFullYear()

  return `${day} ${month}, ${year}`
}

export type Time12h = {
  hour: number
  minute: string
  period: "AM" | "PM"
}

export const TIME_MINUTE_STEP = 5

export const TIME_MINUTE_OPTIONS = Array.from(
  { length: 60 / TIME_MINUTE_STEP },
  (_, index) => String(index * TIME_MINUTE_STEP).padStart(2, "0")
)

export const TIME_HOUR_12_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1)

export const TIME_PERIOD_OPTIONS = ["AM", "PM"] as const

export function parseTimeTo12h(value?: string): Time12h | null {
  if (!value) return null

  const [hoursStr = "00", minutes = "00"] = value.split(":")
  const hours24 = Number(hoursStr)
  if (Number.isNaN(hours24)) return null

  return {
    hour: hours24 % 12 || 12,
    minute: snapMinuteToStep(minutes),
    period: hours24 >= 12 ? "PM" : "AM",
  }
}

export function formatTimeFrom12h({ hour, minute, period }: Time12h): string {
  let hours24: number

  if (period === "AM") {
    hours24 = hour === 12 ? 0 : hour
  } else {
    hours24 = hour === 12 ? 12 : hour + 12
  }

  return `${String(hours24).padStart(2, "0")}:${minute.padStart(2, "0")}`
}

export function snapMinuteToStep(minute: string, step = TIME_MINUTE_STEP): string {
  const parsed = Number(minute)
  if (Number.isNaN(parsed)) return "00"

  const snapped = Math.min(55, Math.round(parsed / step) * step)
  return String(snapped).padStart(2, "0")
}

export function formatTimeDisplay(value?: string): string {
  if (!value) return ""

  const parsed = parseTimeTo12h(value)
  if (!parsed) return value

  return `${parsed.hour}:${parsed.minute} ${parsed.period}`
}
