import { beforeEach, describe, expect, it, vi } from "vitest"
import { defineComponent, h } from "vue"
import { flushPromises } from "@vue/test-utils"
import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime"
import { VLayout } from "vuetify/components"
import AppBottomNav from "~/components/app/shared/AppBottomNav.vue"
import { useAuthStore } from "~/store/modules/auth"
import { useSubscriptionStore } from "~/store/modules/subscription"
import { useOverlayState } from "~/composables/useOverlayState"

const { navigateToMock, routeState } = vi.hoisted(() => ({
  navigateToMock: vi.fn(),
  routeState: { path: "/app" },
}))

mockNuxtImport("navigateTo", () => navigateToMock)
mockNuxtImport("useRoute", () => () => routeState)

type Role = "SUPER_ADMIN" | "ADMIN_USER" | "STAFF_USER"

const signIn = (role: Role) => {
  useAuthStore().setAuth({ token: "t", role, user: { id: 1, firstName: "A", lastName: "B", role } as any })
}

const setSubscription = (features: string[]) => {
  const subscription = useSubscriptionStore()
  subscription.current = { planName: "Básico", status: "ACTIVE", blocked: false, features } as any
  subscription.loaded = true
  subscription.fetchedAt = Date.now()
}

// The bar has to live inside a layout, like in the app.
const Layout = defineComponent({ render: () => h(VLayout, null, { default: () => h(AppBottomNav) }) })

const mountBar = async () => {
  const wrapper = await mountSuspended(Layout)
  await flushPromises()
  return wrapper
}

const labels = (wrapper: Awaited<ReturnType<typeof mountBar>>) =>
  wrapper.findAll(".app-bottom-nav__label").map((label) => label.text())

beforeEach(() => {
  useAuthStore().logout()
  routeState.path = "/app"
  navigateToMock.mockClear()
  useState<number>("overlay-open-count").value = 0
})

describe("bottom navigation of the phone and tablet layout", () => {
  it("ADMIN_USER: home, appointments, clients, sales and reports, plus 'Más'", async () => {
    signIn("ADMIN_USER")
    setSubscription(["reports"])
    expect(labels(await mountBar())).toEqual(["Inicio", "Citas", "Clientes", "Ventas", "Reportes", "Más"])
  })

  it("STAFF_USER has no clients page, so it is left out", async () => {
    signIn("STAFF_USER")
    setSubscription(["reports"])
    expect(labels(await mountBar())).toEqual(["Inicio", "Citas", "Ventas", "Reportes", "Más"])
  })

  it("SUPER_ADMIN only has the platform pages", async () => {
    signIn("SUPER_ADMIN")
    expect(labels(await mountBar())).toEqual(["Inicio", "Salones", "Sucursales", "Usuarios", "Más"])
  })

  it("leaves reports out when the plan does not include them (they stay in the sidebar, with their lock)", async () => {
    signIn("ADMIN_USER")
    setSubscription(["products"])
    expect(labels(await mountBar())).toEqual(["Inicio", "Citas", "Clientes", "Ventas", "Más"])
  })

  it("goes to the page of the button that is pressed, and does nothing on the page it is already on", async () => {
    signIn("ADMIN_USER")
    setSubscription(["reports"])
    const wrapper = await mountBar()
    const button = (text: string) => wrapper.findAll(".app-bottom-nav__btn").find((b) => b.text() === text)!

    await button("Ventas").trigger("click")
    expect(navigateToMock).toHaveBeenCalledWith("/app/sales")

    navigateToMock.mockClear()
    routeState.path = "/app/clients"
    await button("Clientes").trigger("click")
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it("highlights the page the user is on, sub-pages included, and 'Más' for a page that only lives in the sidebar", async () => {
    signIn("ADMIN_USER")
    setSubscription(["reports"])

    routeState.path = "/app/appointments/calendar"
    let wrapper = await mountBar()
    expect(wrapper.find(".v-btn--active").text()).toBe("Citas")

    routeState.path = "/app/service-categories"
    wrapper = await mountBar()
    expect(wrapper.find(".v-btn--active").text()).toBe("Más")

    routeState.path = "/app"
    wrapper = await mountBar()
    expect(wrapper.find(".v-btn--active").text()).toBe("Inicio")
  })

  it("'Más' opens the sidebar, and the bar steps aside while it is open", async () => {
    signIn("ADMIN_USER")
    setSubscription(["reports"])
    const wrapper = await mountBar()
    const bar = () => wrapper.find(".app-bottom-nav")
    expect(bar().classes()).toContain("v-bottom-navigation--active")

    await wrapper.findAll(".app-bottom-nav__btn").at(-1)!.trigger("click")
    await flushPromises()
    expect(bar().classes()).not.toContain("v-bottom-navigation--active")
  })

  it("hides while a form panel is open, and comes back when it closes", async () => {
    signIn("ADMIN_USER")
    setSubscription(["reports"])
    const wrapper = await mountBar()
    const bar = () => wrapper.find(".app-bottom-nav")
    const overlay = useOverlayState()
    expect(bar().classes()).toContain("v-bottom-navigation--active")

    overlay.opened()
    await flushPromises()
    expect(bar().classes()).not.toContain("v-bottom-navigation--active")

    overlay.closed()
    await flushPromises()
    expect(bar().classes()).toContain("v-bottom-navigation--active")
  })
})
