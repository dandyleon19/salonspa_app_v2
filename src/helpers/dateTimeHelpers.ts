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

export function formatTimeDisplay(value?: string): string {
  if (!value) return ""

  const [hoursStr = "00", minutes = "00"] = value.split(":")
  const hours = Number(hoursStr)
  const period = hours >= 12 ? "PM" : "AM"
  const displayHours = hours % 12 || 12

  return `${displayHours}:${minutes} ${period}`
}
