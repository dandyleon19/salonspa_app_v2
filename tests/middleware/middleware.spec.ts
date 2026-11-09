import { beforeEach, describe, expect, it, vi } from "vitest"
import { setActivePinia, createPinia } from "pinia"
import { mockNuxtImport } from "@nuxt/test-utils/runtime"
import { useAuthStore } from "~/store/modules/auth"
import { useSubscriptionStore } from "~/store/modules/subscription"
import roleMiddleware from "~/middleware/role"
import platformMiddleware from "~/middleware/platform.global"
import subscriptionMiddleware from "~/middleware/subscription.global"

const { navigateToMock, showMock } = vi.hoisted(() => ({
  navigateToMock: vi.fn((path: string) => ({ redirectedTo: path })),
  showMock: vi.fn(),
}))

mockNuxtImport("navigateTo", () => navigateToMock)
mockNuxtImport("useNotification", () => () => ({ show: showMock }))

type Role = "SUPER_ADMIN" | "ADMIN_USER" | "STAFF_USER"

const signIn = (role: Role) => {
  const auth = useAuthStore()
  auth.setAuth({ token: "t", role, user: { id: 1, firstName: "A", lastName: "B", email: "a@b.co", role } })
  return auth
}

const route = (path: string, meta: Record<string, unknown> = {}) => ({ path, meta }) as any
const run = (middleware: any, to: any) => middleware(to, to)

beforeEach(() => {
  setActivePinia(createPinia())
  navigateToMock.mockClear()
  showMock.mockClear()
})

describe("role middleware", () => {
  it("lets any signed-in user through a page that declares no roles", () => {
    signIn("STAFF_USER")
    expect(run(roleMiddleware, route("/app/appointments"))).toBeUndefined()
    expect(run(roleMiddleware, route("/app/appointments", { allowedRoles: [] }))).toBeUndefined()
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it("lets an allowed role in", () => {
    signIn("ADMIN_USER")
    expect(run(roleMiddleware, route("/app/clients", { allowedRoles: ["ADMIN_USER"] }))).toBeUndefined()
  })

  it.each([
    ["STAFF_USER", ["ADMIN_USER"]],
    ["SUPER_ADMIN", ["ADMIN_USER"]],
    ["ADMIN_USER", ["SUPER_ADMIN"]],
  ] as Array<[Role, string[]]>)("sends %s away from a page for %j", (role, allowedRoles) => {
    signIn(role)
    run(roleMiddleware, route("/app/anything", { allowedRoles }))
    expect(navigateToMock).toHaveBeenCalledWith("/app")
  })

  it("sends a visitor without a role away", () => {
    run(roleMiddleware, route("/app/clients", { allowedRoles: ["ADMIN_USER"] }))
    expect(navigateToMock).toHaveBeenCalledWith("/app")
  })
})

describe("platform middleware (SUPER_ADMIN has the dashboard, the salons, and everyone's branches and users)", () => {
  it.each(["/app", "/app/", "/app/salons", "/app/salons/", "/app/branches", "/app/users"])("lets SUPER_ADMIN into %s", (path) => {
    signIn("SUPER_ADMIN")
    expect(run(platformMiddleware, route(path))).toBeUndefined()
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it.each([
    "/app/appointments",
    "/app/appointments/calendar",
    "/app/sales",
    "/app/reports",
    "/app/clients",
    "/app/clients/3/clinical-records",
    "/app/clinical-records",
    "/app/service-categories",
    "/app/product-categories",
    "/app/settings",
  ])("sends SUPER_ADMIN from %s to the dashboard", (path) => {
    signIn("SUPER_ADMIN")
    run(platformMiddleware, route(path))
    expect(navigateToMock).toHaveBeenCalledWith("/app")
  })

  it.each(["ADMIN_USER", "STAFF_USER"] as Role[])("does not touch the navigation of %s", (role) => {
    signIn(role)
    expect(run(platformMiddleware, route("/app/appointments"))).toBeUndefined()
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it("ignores pages outside /app and visitors that are not signed in", () => {
    signIn("SUPER_ADMIN")
    expect(run(platformMiddleware, route("/login"))).toBeUndefined()
    setActivePinia(createPinia())
    expect(run(platformMiddleware, route("/app/appointments"))).toBeUndefined()
    expect(navigateToMock).not.toHaveBeenCalled()
  })
})

describe("subscription middleware", () => {
  const withSubscription = (over: Record<string, unknown>) => {
    const subscription = useSubscriptionStore()
    subscription.current = {
      planName: "Básico",
      status: "TRIAL",
      blocked: false,
      features: ["products", "reports"],
      ...over,
    } as any
    subscription.loaded = true
    subscription.fetchedAt = Date.now()
    return subscription
  }

  it("never limits SUPER_ADMIN, nor pages outside /app", async () => {
    signIn("SUPER_ADMIN")
    withSubscription({ blocked: true })
    expect(await run(subscriptionMiddleware, route("/app/clients"))).toBeUndefined()

    signIn("ADMIN_USER")
    expect(await run(subscriptionMiddleware, route("/login"))).toBeUndefined()
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it("sends a blocked salon to the 'subscription expired' page from anywhere, and lets it stay there", async () => {
    signIn("ADMIN_USER")
    withSubscription({ blocked: true, status: "EXPIRED" })
    await run(subscriptionMiddleware, route("/app/appointments"))
    expect(navigateToMock).toHaveBeenCalledWith("/app/subscription-expired")

    navigateToMock.mockClear()
    expect(await run(subscriptionMiddleware, route("/app/subscription-expired"))).toBeUndefined()
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it("sends a salon that is fine away from the 'subscription expired' page", async () => {
    signIn("ADMIN_USER")
    withSubscription({ blocked: false })
    await run(subscriptionMiddleware, route("/app/subscription-expired"))
    expect(navigateToMock).toHaveBeenCalledWith("/app")
  })

  it("lets a page through when the plan includes its feature, and when the page is core", async () => {
    signIn("ADMIN_USER")
    withSubscription({ features: ["products", "reports"] })
    expect(await run(subscriptionMiddleware, route("/app/reports"))).toBeUndefined()
    expect(await run(subscriptionMiddleware, route("/app/products"))).toBeUndefined()
    expect(await run(subscriptionMiddleware, route("/app/clients"))).toBeUndefined()
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it("sends the user to the dashboard, with a notice, when the plan lacks the feature", async () => {
    signIn("ADMIN_USER")
    withSubscription({ features: ["products"] })
    await run(subscriptionMiddleware, route("/app/reports"))
    expect(navigateToMock).toHaveBeenCalledWith("/app")
    expect(showMock).toHaveBeenCalledTimes(1)
    expect(showMock.mock.calls[0]![0]).toMatchObject({ type: "warning" })
  })
})
