import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { setActivePinia, createPinia } from "pinia"
import { mockNuxtImport } from "@nuxt/test-utils/runtime"
import { useAuthStore } from "~/store/modules/auth"
import { useSubscriptionStore } from "~/store/modules/subscription"
import { requiredFeatureForPath } from "~/interfaces/subscriptionInterfaces"
import { makeStubApi } from "../utils/api"

const holder = vi.hoisted(() => ({ current: undefined as any }))
mockNuxtImport("useNuxtApp", () => () => ({ $api: (...args: any[]) => holder.current?.(...args) }))
const stubApi = makeStubApi(holder)

type Role = "SUPER_ADMIN" | "ADMIN_USER" | "STAFF_USER"

const signIn = (role: Role, tokenRole: string | null = role) => {
  const store = useAuthStore()
  store.setAuth({
    token: "t",
    role: tokenRole,
    user: { id: 1, firstName: "Ana", lastName: "Paz", email: "ana@x.com", role, isActive: true },
  })
  return store
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.spyOn(console, "error").mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

describe("auth store", () => {
  //            role          admin  manageAppointments manageSales
  const matrix: Array<[Role, boolean, boolean, boolean]> = [
    ["SUPER_ADMIN", false, true, true],
    ["ADMIN_USER", true, true, true],
    ["STAFF_USER", false, false, false],
  ]

  it.each(matrix)("%s", (role, isAdmin, canManageAppointments, canManageSales) => {
    const store = signIn(role)
    expect(store.isAdmin).toBe(isAdmin)
    expect(store.canManageAppointments).toBe(canManageAppointments)
    expect(store.canManageSales).toBe(canManageSales)
    expect(store.isSuperAdmin).toBe(role === "SUPER_ADMIN")
    expect(store.isStaff).toBe(role === "STAFF_USER")
  })

  it("builds fullName from the names when the API sends none", () => {
    expect(signIn("ADMIN_USER").user?.fullName).toBe("Ana Paz")
  })

  it("keeps the user's own role (database) over the one in the token, which can be a day old", () => {
    const store = signIn("ADMIN_USER", "STAFF_USER")
    expect(store.role).toBe("ADMIN_USER")
    expect(store.canManageSales).toBe(true)
  })

  it("works with only the token and its role (before the user is read)", () => {
    const store = useAuthStore()
    store.setAuth({ token: "t", role: "STAFF_USER" })
    expect(store.user).toBeNull()
    expect(store.effectiveRole).toBe("STAFF_USER")
    expect(store.canManageSales).toBe(false)
  })

  it("logout clears the session and forgets the salon's plan", () => {
    const store = signIn("ADMIN_USER")
    const subscription = useSubscriptionStore()
    subscription.current = { planCode: "BASICO", blocked: false, features: [] } as any
    subscription.loaded = true

    store.logout()

    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
    expect(store.role).toBeNull()
    expect(subscription.current).toBeNull()
    expect(subscription.loaded).toBe(false)
  })
})

describe("subscription store", () => {
  const info = (over: Record<string, unknown> = {}) => ({
    salonId: 7,
    planCode: "BASICO",
    planName: "Básico",
    status: "TRIAL",
    blocked: false,
    daysRemaining: 10,
    features: ["products"],
    ...over,
  })

  it("shows every feature until the subscription is known, then only the plan's", () => {
    const store = useSubscriptionStore()
    expect(store.hasFeature("reports")).toBe(true)

    store.current = info() as any
    store.loaded = true
    expect(store.hasFeature("products")).toBe(true)
    expect(store.hasFeature("reports")).toBe(false)
  })

  it("fetchMine reads /api/subscription/me once, then trusts it for a while", async () => {
    const api = stubApi(() => info())
    const store = useSubscriptionStore()
    await store.fetchMine()
    await store.fetchMine()
    expect(api).toHaveBeenCalledTimes(1)
    expect(api).toHaveBeenCalledWith("/api/subscription/me", { method: "GET" })
    expect(store.planName).toBe("Básico")
    expect(store.isBlocked).toBe(false)

    await store.fetchMine(true)
    expect(api).toHaveBeenCalledTimes(2)
  })

  it("stays unloaded when the call fails", async () => {
    stubApi(() => {
      throw new Error("down")
    })
    const store = useSubscriptionStore()
    await store.fetchMine()
    expect(store.loaded).toBe(false)
    expect(store.loading).toBe(false)
  })

  it("markBlocked (the API answered 402) blocks locally even when the subscription cannot be read", async () => {
    stubApi(() => {
      throw new Error("down")
    })
    const store = useSubscriptionStore()
    await store.markBlocked()
    expect(store.isBlocked).toBe(true)
    expect(store.loaded).toBe(true)
  })

  it("activate sends planCode + paidUntil, or noExpiry when there is no date (the backend needs one or the other)", async () => {
    const api = stubApi()
    const store = useSubscriptionStore()
    await store.activate(7, "PREMIUM", "2026-12-31")
    await store.activate(7, "PREMIUM", null)
    expect(api).toHaveBeenNthCalledWith(1, "/api/subscriptions/7/activate", {
      method: "POST",
      body: { planCode: "PREMIUM", paidUntil: "2026-12-31" },
    })
    expect(api).toHaveBeenNthCalledWith(2, "/api/subscriptions/7/activate", {
      method: "POST",
      body: { planCode: "PREMIUM", noExpiry: true },
    })
  })

  it("trial days, suspend and resume use the backend's routes and body fields", async () => {
    const api = stubApi()
    const store = useSubscriptionStore()
    await store.setTrialDays(7, 14)
    await store.suspend(7, "No pagó")
    await store.resume(7)
    expect(api).toHaveBeenNthCalledWith(1, "/api/subscriptions/7/trial-days", { method: "POST", body: { days: 14 } })
    expect(api).toHaveBeenNthCalledWith(2, "/api/subscriptions/7/suspend", { method: "POST", body: { reason: "No pagó" } })
    expect(api).toHaveBeenNthCalledWith(3, "/api/subscriptions/7/resume", { method: "POST" })
  })

  it("fetchAll, fetchPlans (once) and fetchEvents", async () => {
    const api = stubApi((url) => (url === "/api/plans" ? [{ code: "BASICO" }] : []))
    const store = useSubscriptionStore()
    await store.fetchAll()
    await store.fetchPlans()
    await store.fetchPlans()
    await store.fetchEvents(7)
    expect(api.mock.calls.map((call) => call[0])).toEqual([
      "/api/subscriptions",
      "/api/plans",
      "/api/subscriptions/7/events",
    ])
  })
})

describe("requiredFeatureForPath", () => {
  it.each([
    ["/app/reports", "reports"],
    ["/app/products", "products"],
    ["/app/product-categories", "products"],
    ["/app/clinical-records", "clinical_records"],
    ["/app/clients/15/clinical-records", "clinical_records"],
    ["/app/clients", null],
    ["/app/appointments", null],
    ["/app/sales", null],
    ["/app", null],
  ])("%s -> %s", (path, feature) => {
    expect(requiredFeatureForPath(path)).toBe(feature)
  })
})
