import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { setActivePinia, createPinia } from "pinia"
import { mockNuxtImport } from "@nuxt/test-utils/runtime"
import { useClientsStore } from "~/store/modules/client"
import { useBranchesStore } from "~/store/modules/branch"
import { useSalonsStore } from "~/store/modules/salon"
import { useServicesStore } from "~/store/modules/service"
import { useProductsStore } from "~/store/modules/product"
import { useProductCategoriesStore } from "~/store/modules/productCategory"
import { useServiceCategoriesStore } from "~/store/modules/serviceCategory"
import { useUsersStore } from "~/store/modules/user"
import { useSalesStore } from "~/store/modules/sales"
import { useAppointmentsStore } from "~/store/modules/appointment"
import { useCommissionsStore } from "~/store/modules/commission"
import { useDashboardStore } from "~/store/modules/dashboard"
import { useClinicalRecordsStore } from "~/store/modules/clinicalRecord"
import { makeStubApi } from "../utils/api"

const holder = vi.hoisted(() => ({ current: undefined as any }))
mockNuxtImport("useNuxtApp", () => () => ({ $api: (...args: any[]) => holder.current?.(...args) }))
const stubApi = makeStubApi(holder)

const page = (content: unknown[] = []) => ({ content, page: 0, size: 10, totalElements: content.length, totalPages: 1 })

beforeEach(() => {
  setActivePinia(createPinia())
  vi.spyOn(console, "error").mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

describe.each([
  ["clients", () => useClientsStore(), "fetchClients", "/api/clients"],
  ["branches", () => useBranchesStore(), "fetchBranches", "/api/branches"],
  ["product categories", () => useProductCategoriesStore(), "fetchProductCategories", "/api/product-categories"],
  ["service categories", () => useServiceCategoriesStore(), "fetchServiceCategories", "/api/service-categories"],
] as const)("%s list", (_name, useStore, fetchName, url) => {
  it("asks for a page with the trimmed search, and leaves loading when done", async () => {
    const api = stubApi(() => page([{ id: 1 }]))
    const store: any = useStore()
    expect(store.loading).toBe(true)

    await store[fetchName](1, 5, "  ana ")

    expect(api).toHaveBeenCalledWith(url, { method: "GET", query: { page: 1, size: 5, search: "ana" } })
    expect(store.data.content).toHaveLength(1)
    expect(store.loading).toBe(false)
  })

  it("does not send an empty search", async () => {
    const api = stubApi(() => page())
    await (useStore() as any)[fetchName](0, 10, "   ")
    expect(api).toHaveBeenCalledWith(url, { method: "GET", query: { page: 0, size: 10 } })
  })

  it("keeps the previous list and stops loading when the call fails", async () => {
    stubApi(() => {
      throw new Error("down")
    })
    const store: any = useStore()
    await store[fetchName]()
    expect(store.data).toBeNull()
    expect(store.loading).toBe(false)
  })
})

describe("salons, services, products and clinical records (no search in the backend)", () => {
  it("salons: page and size only", async () => {
    const api = stubApi(() => page())
    await useSalonsStore().fetchSalons(2, 20)
    expect(api).toHaveBeenCalledWith("/api/salons", { method: "GET", query: { page: 2, size: 20 } })
  })

  it("services and products take either an array or a page from the API", async () => {
    stubApi(() => [{ id: 1 }, { id: 2 }])
    const services = useServicesStore()
    await services.fetchServices()
    expect(services.services).toHaveLength(2)

    stubApi(() => page([{ id: 1 }]))
    await services.fetchServices(0, 100)
    expect(services.services).toHaveLength(1)

    const api = stubApi(() => page([{ id: 3 }]))
    const products = useProductsStore()
    await products.fetchProducts()
    expect(api).toHaveBeenCalledWith("/api/products", { method: "GET", query: { page: 0, size: 100 } })
    expect(products.products).toHaveLength(1)
  })

  it("services and products come back empty when the call fails", async () => {
    stubApi(() => {
      throw new Error("down")
    })
    const services = useServicesStore()
    await services.fetchServices()
    expect(services.services).toEqual([])
    expect(services.loading).toBe(false)

    const products = useProductsStore()
    await products.fetchProducts()
    expect(products.products).toEqual([])
  })

  it("clinical records: a page, and one by id", async () => {
    const api = stubApi(() => page())
    const store = useClinicalRecordsStore()
    await store.fetchClinicalRecords(1, 5)
    await store.fetchClinicalRecordById(9)
    expect(api).toHaveBeenNthCalledWith(1, "/api/clinical-records", { method: "GET", query: { page: 1, size: 5 } })
    expect(api).toHaveBeenNthCalledWith(2, "/api/clinical-records/9", { method: "GET" })
  })
})

describe("users", () => {
  it("lists with the active, role and search filters", async () => {
    const api = stubApi(() => page())
    await useUsersStore().fetchUsers(0, 10, { isActive: false, role: "STAFF_USER", search: "  ana " })
    expect(api).toHaveBeenCalledWith("/api/users", {
      method: "GET",
      query: { page: 0, size: 10, isActive: false, role: "STAFF_USER", search: "ana" },
    })
  })

  it("resetPassword sends the new password to the user's password route", async () => {
    const api = stubApi()
    await useUsersStore().resetPassword(7, "nueva-clave-9")
    expect(api).toHaveBeenCalledWith("/api/users/7/password", { method: "PUT", body: { password: "nueva-clave-9" } })
  })

  it("update and the service commissions use the backend's routes", async () => {
    const api = stubApi(() => [])
    const store = useUsersStore()
    await store.updateUser(3, { firstName: "A" } as any)
    await store.fetchUserServiceCommissions(3)
    await store.replaceUserServiceCommissions(3, { commissions: [] })
    expect(api).toHaveBeenNthCalledWith(1, "/api/users/3", { method: "PUT", body: { firstName: "A" } })
    expect(api).toHaveBeenNthCalledWith(2, "/api/users/3/service-commissions", { method: "GET" })
    expect(api).toHaveBeenNthCalledWith(3, "/api/users/3/service-commissions", { method: "PUT", body: { commissions: [] } })
  })
})

describe("sales", () => {
  it("lists with the filters the backend accepts", async () => {
    const api = stubApi(() => page())
    await useSalesStore().fetchSales(0, 10, { branchId: 2, clientId: 4, status: "PAID", from: "2026-11-01", to: "2026-11-30" } as any)
    expect(api).toHaveBeenCalledWith("/api/sales", {
      method: "GET",
      query: { page: 0, size: 10, branchId: 2, clientId: 4, status: "PAID", from: "2026-11-01", to: "2026-11-30" },
    })
  })

  it("create, payments and cancel", async () => {
    const api = stubApi(() => ({ id: 1, items: [], payments: [] }))
    const store = useSalesStore()
    await store.createSale({ branchId: 1 } as any)
    await store.addSalePayment(5, { method: "CASH", amount: 10 } as any)
    await store.cancelSale(5)
    expect(api).toHaveBeenNthCalledWith(1, "/api/sales", { method: "POST", body: { branchId: 1 } })
    expect(api).toHaveBeenNthCalledWith(2, "/api/sales/5/payments", { method: "POST", body: { method: "CASH", amount: 10 } })
    expect(api).toHaveBeenNthCalledWith(3, "/api/sales/5/cancel", { method: "PUT" })
  })

  it("the report always sends from and to (the backend requires both) plus optional branch and user", async () => {
    const api = stubApi(() => ({}))
    const store = useSalesStore()
    await store.fetchSalesReport({ from: "2026-11-01", to: "2026-11-30", branchId: 1, userId: 2 } as any)
    expect(api).toHaveBeenCalledWith("/api/sales/report", {
      method: "GET",
      query: { from: "2026-11-01", to: "2026-11-30", branchId: 1, userId: 2 },
    })
    expect(store.reportError).toBe(false)
  })

  it("flags a failed report instead of leaving the old one", async () => {
    stubApi(() => {
      throw new Error("down")
    })
    const store = useSalesStore()
    await store.fetchSalesReport({ from: "2026-11-01", to: "2026-11-30" } as any)
    expect(store.report).toBeNull()
    expect(store.reportError).toBe(true)
    expect(store.reportLoading).toBe(false)
  })

  it("fetchSaleById rethrows so the page can show 'not found'", async () => {
    stubApi(() => {
      throw new Error("404")
    })
    const store = useSalesStore()
    await expect(store.fetchSaleById(9)).rejects.toThrow("404")
    expect(store.detail).toBeNull()
    expect(store.detailLoading).toBe(false)
  })
})

describe("appointments", () => {
  it("lists with branch, professional, client, day and status filters", async () => {
    const api = stubApi(() => page())
    await useAppointmentsStore().fetchAppointments(0, 10, { branchId: 1, userId: 2, clientId: 3, date: "2026-11-08", status: "SCHEDULED" } as any)
    expect(api).toHaveBeenCalledWith("/api/appointments", {
      method: "GET",
      query: { page: 0, size: 10, branchId: 1, userId: 2, clientId: 3, date: "2026-11-08", status: "SCHEDULED" },
    })
  })

  it("the calendar asks for year and month (the backend requires both)", async () => {
    const api = stubApi(() => ({}))
    await useAppointmentsStore().fetchAppointmentsCalendar(2026, 11, { branchId: 1 })
    expect(api).toHaveBeenCalledWith("/api/appointments/calendar", { method: "GET", query: { year: 2026, month: 11, branchId: 1 } })
  })

  it("marks a reminder as sent with POST", async () => {
    const api = stubApi(() => ({ id: 5 }))
    await useAppointmentsStore().markReminderSent(5)
    expect(api).toHaveBeenCalledWith("/api/appointments/5/reminder-sent", { method: "POST" })
  })
})

describe("reports and dashboard", () => {
  it("commission report sends from and to plus the optional filters", async () => {
    const api = stubApi(() => ({}))
    await useCommissionsStore().fetchCommissionReport({ from: "2026-11-01", to: "2026-11-30", userId: 4 } as any)
    expect(api).toHaveBeenCalledWith("/api/commissions/report", { method: "GET", query: { from: "2026-11-01", to: "2026-11-30", userId: 4 } })
  })

  it("dashboard sends only the filters given", async () => {
    const api = stubApi(() => ({}))
    const store = useDashboardStore()
    await store.fetchDashboard({})
    await store.fetchDashboard({ date: "2026-11-08", branchId: 2 } as any)
    expect(api).toHaveBeenNthCalledWith(1, "/api/dashboard", { method: "GET", query: {} })
    expect(api).toHaveBeenNthCalledWith(2, "/api/dashboard", { method: "GET", query: { date: "2026-11-08", branchId: 2 } })
  })
})
