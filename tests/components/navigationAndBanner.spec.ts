import { beforeEach, describe, expect, it } from "vitest"
import { defineComponent, h } from "vue"
import { flushPromises } from "@vue/test-utils"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import { VLayout } from "vuetify/components"
import AppSidebar from "~/components/app/shared/AppSidebar.vue"
import SubscriptionBanner from "~/components/app/shared/SubscriptionBanner.vue"
import { useAuthStore } from "~/store/modules/auth"
import { useSubscriptionStore } from "~/store/modules/subscription"

type Role = "SUPER_ADMIN" | "ADMIN_USER" | "STAFF_USER"

const signIn = (role: Role) => {
  useAuthStore().setAuth({ token: "t", role, user: { id: 1, firstName: "A", lastName: "B", role, salonName: "Spa Luna" } })
}

const setSubscription = (over: Record<string, unknown> = {}) => {
  const subscription = useSubscriptionStore()
  subscription.current = {
    planCode: "BASICO",
    planName: "Básico",
    status: "ACTIVE",
    blocked: false,
    daysRemaining: 30,
    features: ["products", "reports", "clinical_records"],
    currentPeriodEnd: null,
    ...over,
  } as any
  subscription.loaded = true
  subscription.fetchedAt = Date.now()
}

beforeEach(() => {
  useAuthStore().logout()
})

// The navigation drawer has to live inside a layout, like in the app.
const Layout = defineComponent({ render: () => h(VLayout, null, { default: () => h(AppSidebar) }) })

const menuTitles = async () => {
  const wrapper = await mountSuspended(Layout)
  await flushPromises()
  return wrapper.findAll(".v-list-item-title").map((item) => item.text())
}

describe("sidebar menu per role", () => {
  it("SUPER_ADMIN manages the platform: salons, branches and users (no clients, appointments, sales or reports)", async () => {
    signIn("SUPER_ADMIN")
    expect(await menuTitles()).toEqual(["Dashboard", "Salones", "Sucursales", "Usuarios"])
  })

  it("ADMIN_USER sees the whole salon menu, with settings, and not the platform's salons", async () => {
    signIn("ADMIN_USER")
    setSubscription()
    const titles = await menuTitles()
    expect(titles).toEqual([
      "Dashboard",
      "Sucursales",
      "Usuarios",
      "Clientes",
      "Citas",
      "Ventas",
      "Reportes",
      "Categorías de Servicio",
      "Categorías de Producto",
      "Configuración",
    ])
    expect(titles).not.toContain("Salones")
  })

  it("STAFF_USER only sees the day-to-day: dashboard, appointments, sales and reports", async () => {
    signIn("STAFF_USER")
    setSubscription()
    expect(await menuTitles()).toEqual(["Dashboard", "Citas", "Ventas", "Reportes"])
  })

  it("an item of a feature the plan lacks stays in the menu but locked", async () => {
    signIn("ADMIN_USER")
    setSubscription({ features: [] })
    const wrapper = await mountSuspended(Layout)
    await flushPromises()
    const locked = wrapper.findAll(".app-sidebar__item--locked").map((item) => item.text())
    expect(locked).toEqual(expect.arrayContaining(["Reportes", "Categorías de Producto"]))
    expect(locked).not.toContain("Clientes")
  })
})

describe("subscription banner", () => {
  const banner = async () => {
    const wrapper = await mountSuspended(SubscriptionBanner)
    await flushPromises()
    return wrapper
  }

  it("shows nothing before the subscription is known, for SUPER_ADMIN, or when blocked", async () => {
    signIn("ADMIN_USER")
    expect((await banner()).text()).toBe("")

    setSubscription({ status: "TRIAL", daysRemaining: 3, blocked: true })
    expect((await banner()).text()).toBe("")

    signIn("SUPER_ADMIN")
    setSubscription({ status: "TRIAL", daysRemaining: 3 })
    expect((await banner()).text()).toBe("")
  })

  it("counts the days left of the trial", async () => {
    signIn("ADMIN_USER")
    setSubscription({ status: "TRIAL", daysRemaining: 5 })
    expect((await banner()).text()).toContain("te quedan 5 días")

    setSubscription({ status: "TRIAL", daysRemaining: 0 })
    expect((await banner()).text()).toContain("termina hoy")
  })

  it("warns a few days before a paid plan ends, but not earlier", async () => {
    signIn("ADMIN_USER")
    setSubscription({ status: "ACTIVE", daysRemaining: 7 })
    expect((await banner()).text()).toContain("vence en 7 días")

    setSubscription({ status: "ACTIVE", daysRemaining: 8 })
    expect((await banner()).text()).toBe("")
  })

  it("an overdue payment is a warning that cannot be closed", async () => {
    signIn("ADMIN_USER")
    setSubscription({ status: "PAST_DUE", daysRemaining: 2 })
    const wrapper = await banner()
    expect(wrapper.text()).toContain("pago está vencido")
    expect(wrapper.find(".v-alert__close").exists()).toBe(false)
  })
})
