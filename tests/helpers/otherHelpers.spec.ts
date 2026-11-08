import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getApiErrorMessage, getApiErrorTitle, parseApiError } from "~/helpers/apiErrorHelpers"
import { areTableSearchEqual, normalizeTableSearch } from "~/helpers/tableSearchHelpers"
import {
  buildCreateUserPayload,
  buildReplaceUserServiceCommissionsPayload,
  buildUpdateUserPayload,
  canManageUserRole,
  getAvailableRoleTargets,
  mapUserServiceCommissionsToInputs,
  normalizeUserFilters,
} from "~/helpers/userHelpers"
import { buildAppointmentReminderMessage, buildWhatsAppReminderLink, normalizePhoneForWhatsApp } from "~/helpers/whatsappHelpers"
import {
  combineDateAndTime,
  formatDateDisplay,
  formatSoldAt,
  formatTimeDisplay,
  formatTimeFrom12h,
  isDateAfterToday,
  parseTimeTo12h,
  snapMinuteToStep,
  splitIsoDateTime,
} from "~/helpers/dateTimeHelpers"

const fetchError = (data: Record<string, unknown> | null, status?: number) => ({ data, status })

describe("api errors", () => {
  it("parseApiError is null for anything that is not an API error body", () => {
    expect(parseApiError(null)).toBeNull()
    expect(parseApiError(new Error("boom"))).toBeNull()
    expect(parseApiError(fetchError(null))).toBeNull()
    expect(parseApiError(fetchError({ status: 409 }, 500))?.status).toBe(409)
  })

  it("falls back when the API sent no message", () => {
    expect(getApiErrorMessage(new Error("boom"), "No se pudo guardar")).toBe("No se pudo guardar")
  })

  it("translates the backend messages the screens know about", () => {
    const err = fetchError({ message: "The professional already has an appointment in that time slot" })
    expect(getApiErrorMessage(err, "x")).toBe("El profesional ya tiene una cita activa en ese horario.")
    expect(getApiErrorMessage(fetchError({ message: "Client not found with id: 42" }), "x")).toBe(
      "No se encontró el recurso con id 42."
    )
  })

  it("joins several messages the backend separates with ;", () => {
    const err = fetchError({ message: "First name is required; Last name is required ;;" })
    expect(getApiErrorMessage(err, "x")).toBe("First name is required Last name is required")
  })

  it.each([
    ["VALIDATION_ERROR", "Datos inválidos"],
    ["BAD_REQUEST", "Solicitud inválida"],
    ["NOT_FOUND", "No encontrado"],
    ["FORBIDDEN", "Sin permisos"],
    ["UNAUTHORIZED", "No autorizado"],
  ])("code %s -> %s", (code, title) => {
    expect(getApiErrorTitle(fetchError({ code }))).toBe(title)
  })

  it("a conflict is 'de horario' only when it is about the professional's time slot", () => {
    const slot = fetchError({ code: "CONFLICT", message: "El profesional ya tiene una cita activa en ese horario" })
    expect(getApiErrorTitle(slot)).toBe("Conflicto de horario")
    expect(getApiErrorTitle(fetchError({ message: "The professional already has an appointment in that time slot" }, 409))).toBe(
      "Conflicto de horario"
    )

    const duplicatedRuc = fetchError({ code: "CONFLICT", message: "Ya existe un salón con el RUC '20123456789'" })
    expect(getApiErrorTitle(duplicatedRuc)).toBe("Conflicto")
    expect(getApiErrorTitle(fetchError({}, 409))).toBe("Conflicto")
  })

  it.each([
    [404, "No encontrado"],
    [403, "Sin permisos"],
    [401, "No autorizado"],
    [400, "Solicitud inválida"],
    [500, "Error"],
  ])("status %i -> %s", (status, title) => {
    expect(getApiErrorTitle(fetchError({}, status))).toBe(title)
  })
})

describe("table search", () => {
  it("trims and cuts at 255 characters", () => {
    expect(normalizeTableSearch("  hola  ")).toBe("hola")
    expect(normalizeTableSearch(null)).toBe("")
    expect(normalizeTableSearch("a".repeat(300))).toHaveLength(255)
    expect(areTableSearchEqual(" a ", "a")).toBe(true)
    expect(areTableSearchEqual("a", "b")).toBe(false)
  })
})

describe("user payloads (shape of the backend's CreateUserRequest / UpdateUserRequest)", () => {
  const user = {
    id: 5,
    firstName: "Ana",
    lastName: "Paz",
    email: "ana@salon.pe",
    isActive: true,
    role: "STAFF_USER",
    commissionPercentage: "12.5",
    password: "clave-segura",
  } as any

  it("create sends exactly the backend's fields, with the commission as a number", () => {
    expect(buildCreateUserPayload(user)).toEqual({
      firstName: "Ana",
      lastName: "Paz",
      email: "ana@salon.pe",
      password: "clave-segura",
      role: "STAFF_USER",
      commissionPercentage: 12.5,
    })
  })

  it("create defaults the role to STAFF_USER and only sends salonId when asked and present", () => {
    expect(buildCreateUserPayload({ ...user, role: undefined }).role).toBe("STAFF_USER")
    expect(buildCreateUserPayload({ ...user, salonId: 3 })).not.toHaveProperty("salonId")
    expect(buildCreateUserPayload({ ...user, salonId: "3" }, { includeSalonId: true }).salonId).toBe(3)
    expect(buildCreateUserPayload({ ...user, salonId: "" }, { includeSalonId: true })).not.toHaveProperty("salonId")
  })

  it("an empty or broken commission goes as 0, '12%' as 12", () => {
    expect(buildCreateUserPayload({ ...user, commissionPercentage: "" }).commissionPercentage).toBe(0)
    expect(buildCreateUserPayload({ ...user, commissionPercentage: "abc" }).commissionPercentage).toBe(0)
    expect(buildCreateUserPayload({ ...user, commissionPercentage: "12%" }).commissionPercentage).toBe(12)
  })

  it("update never sends the password, and lets the caller override active / role / commission", () => {
    const payload = buildUpdateUserPayload(user, { isActive: false, role: "ADMIN_USER", commissionPercentage: 30 })
    expect(payload).toEqual({
      firstName: "Ana",
      lastName: "Paz",
      email: "ana@salon.pe",
      isActive: false,
      role: "ADMIN_USER",
      commissionPercentage: 30,
    })
    expect(payload).not.toHaveProperty("password")
  })

  it("the platform owner's role cannot be managed, and the roles one can move to exclude the current one", () => {
    expect(canManageUserRole({ role: "SUPER_ADMIN" })).toBe(false)
    expect(canManageUserRole({ role: "STAFF_USER" })).toBe(true)
    expect(getAvailableRoleTargets("SUPER_ADMIN")).toEqual([])
    expect(getAvailableRoleTargets("STAFF_USER")).not.toContain("STAFF_USER")
    expect(getAvailableRoleTargets("STAFF_USER")).not.toContain("SUPER_ADMIN")
  })

  it("filters keep only valid values", () => {
    expect(normalizeUserFilters({ isActive: "true", role: "STAFF_USER" })).toEqual({ isActive: true, role: "STAFF_USER" })
    expect(normalizeUserFilters({ isActive: "false" })).toEqual({ isActive: false })
    expect(normalizeUserFilters({ role: "HACKER", isActive: "maybe" })).toEqual({})
  })

  it("service commissions go to the backend as numbers", () => {
    expect(
      buildReplaceUserServiceCommissionsPayload([{ serviceId: "4" as any, commissionPercentage: "10" as any }])
    ).toEqual({ commissions: [{ serviceId: 4, commissionPercentage: 10 }] })
    expect(mapUserServiceCommissionsToInputs([{ serviceId: "4", commissionPercentage: "10" } as any])).toEqual([
      { serviceId: 4, commissionPercentage: 10 },
    ])
  })
})

describe("whatsapp reminders", () => {
  it.each([
    ["987654321", "51987654321"],
    ["987 654 321", "51987654321"],
    ["+51 987-654-321", "51987654321"],
    ["51987654321", "51987654321"],
    ["12345678", "12345678"],
    ["123", null],
    ["", null],
    [null, null],
  ])("normalizes %j -> %j", (phone, expected) => {
    expect(normalizePhoneForWhatsApp(phone as any)).toBe(expected)
  })

  describe("message", () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 10, 8, 10, 0, 0))
    })
    afterEach(() => vi.useRealTimers())

    it("says 'hoy' or 'mañana' for the next two days and names the salon and the service", () => {
      const today = { startAt: "2026-11-08T15:30:00", clientName: "María López", serviceName: "Limpieza facial" } as any
      // The month name is capitalised or not depending on the ICU data of the Node running the tests.
      expect(buildAppointmentReminderMessage(today, "Spa Luna").toLowerCase()).toBe(
        "hola maría, te recordamos tu cita en spa luna hoy, 8 nov, 2026 a las 3:30 pm para limpieza facial. ¡te esperamos!"
      )

      const tomorrow = { ...today, startAt: "2026-11-09T09:00:00" }
      expect(buildAppointmentReminderMessage(tomorrow, "Spa Luna").toLowerCase()).toContain("mañana, 9 nov, 2026 a las 9:00 am")
    })

    it("uses 'el' for other days and a generic salon name when there is none", () => {
      const later = { startAt: "2026-11-20T09:00:00", clientName: "", serviceName: "" } as any
      const message = buildAppointmentReminderMessage(later).toLowerCase()
      expect(message).toContain("hola, te recordamos tu cita en nuestro salón el 20 nov, 2026")
      expect(message).not.toContain(" para ")
    })

    it("the link goes to the client's phone with the message encoded, and is null without a usable phone", () => {
      const appointment = { startAt: "2026-11-20T09:00:00", clientName: "Ana", clientPhone: "987654321" } as any
      const link = buildWhatsAppReminderLink(appointment, "Spa")
      expect(link).toMatch(/^https:\/\/wa\.me\/51987654321\?text=Hola%20Ana/)
      expect(buildWhatsAppReminderLink({ ...appointment, clientPhone: "" }, "Spa")).toBeNull()
    })
  })
})

describe("date and time helpers", () => {
  it("splitIsoDateTime splits a local ISO datetime without timezone surprises", () => {
    expect(splitIsoDateTime("2026-11-08T15:30:00")).toEqual({ date: "2026-11-08", time: "15:30" })
    expect(splitIsoDateTime("")).toEqual({ date: "", time: "" })
    expect(splitIsoDateTime(undefined)).toEqual({ date: "", time: "" })
  })

  it("combineDateAndTime / formatSoldAt build what the backend reads", () => {
    expect(combineDateAndTime("2026-11-08", "15:30")).toBe("2026-11-08T15:30")
    expect(formatSoldAt("2026-11-08", "15:30")).toBe("2026-11-08T15:30:00")
    expect(formatSoldAt("2026-11-08", "15:30:45")).toBe("2026-11-08T15:30:45")
  })

  it("formatDateDisplay ignores the time part and returns the raw text when it is not a date", () => {
    expect(formatDateDisplay("2026-11-05T23:59:00")).toBe(formatDateDisplay("2026-11-05"))
    expect(formatDateDisplay("2026-11-05")).toMatch(/^5 nov\w*, 2026$/i)
    expect(formatDateDisplay("")).toBe("")
    expect(formatDateDisplay("hola")).toBe("hola")
  })

  it("12-hour clock conversions round-trip, with 12 AM = 00:00 and 12 PM = 12:00", () => {
    expect(parseTimeTo12h("00:00")).toEqual({ hour: 12, minute: "00", period: "AM" })
    expect(parseTimeTo12h("12:00")).toEqual({ hour: 12, minute: "00", period: "PM" })
    expect(parseTimeTo12h("15:30")).toEqual({ hour: 3, minute: "30", period: "PM" })
    expect(parseTimeTo12h("")).toBeNull()
    for (const time of ["00:00", "00:05", "09:05", "12:00", "12:55", "13:00", "23:55"]) {
      expect(formatTimeFrom12h(parseTimeTo12h(time)!)).toBe(time)
    }
    expect(formatTimeDisplay("15:30")).toBe("3:30 PM")
  })

  it("minutes snap to steps of 5 and never past 55", () => {
    expect(snapMinuteToStep("07")).toBe("05")
    expect(snapMinuteToStep("08")).toBe("10")
    expect(snapMinuteToStep("58")).toBe("55")
    expect(snapMinuteToStep("xx")).toBe("00")
  })

  it("isDateAfterToday compares days, not instants", () => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    expect(isDateAfterToday(iso(now))).toBe(false)
    expect(isDateAfterToday(iso(tomorrow))).toBe(true)
    expect(isDateAfterToday("")).toBe(false)
  })
})
