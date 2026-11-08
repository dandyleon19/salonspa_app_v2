import { beforeEach, describe, expect, it, vi } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import SaleForm from "~/components/app/sales/SaleForm.vue"
import { useBranchesStore } from "~/store/modules/branch"
import { useClientsStore } from "~/store/modules/client"
import { useUsersStore } from "~/store/modules/user"
import { useSubscriptionStore } from "~/store/modules/subscription"
import { errorMessages, fill, fillAll, submit, submitted } from "../utils/forms"
import { registerPeopleEndpoints, registerRecordEndpoints } from "../utils/endpoints"

// The client and professional pickers search on the server: this is that server.
registerPeopleEndpoints(
  [
    { id: 1, firstName: "Ana", lastName: "Paz", salonId: 1 },
    { id: 150, firstName: "Zoe", lastName: "Zeta", salonId: 1 },
  ],
  [
    { id: 3, firstName: "Luis", lastName: "Ríos", fullName: "Luis Ríos", salonId: 1 },
    { id: 9, firstName: "A", lastName: "B", fullName: "A B", salonId: 1 },
  ]
)



// The service and product pickers search on the server too.
registerRecordEndpoints("/api/services", [{ id: 4, name: "Limpieza facial", price: 80, durationMinutes: 60, salonId: 1 }])
registerRecordEndpoints("/api/products", [{ id: 5, name: "Crema", price: 30, stockQuantity: 3, salonId: 1 }])

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
/** The pickers ask the mocked server for the record behind each id; its answer arrives a few milliseconds later. */
const settle = async () => {
  await wait(150)
  await flushPromises()
}

const pageOf = (content: unknown[]) => ({ content, page: 0, size: 100, totalElements: content.length, totalPages: 1 })

beforeEach(() => {
  const branches = useBranchesStore()
  const clients = useClientsStore()
  const users = useUsersStore()

  for (const [store, method] of [
    [branches, "fetchBranches"],
    [clients, "fetchClients"],
    [users, "fetchUsers"],
  ] as const) {
    vi.spyOn(store as any, method).mockResolvedValue(undefined)
    store.loading = false
  }

  branches.data = pageOf([{ id: 2, name: "Centro", salonId: 1 }]) as any
  clients.data = pageOf([{ id: 1, firstName: "Ana", lastName: "Paz", salonId: 1 }]) as any
  users.data = pageOf([{ id: 3, firstName: "Luis", lastName: "Ríos", fullName: "Luis Ríos", salonId: 1 }]) as any

  const subscription = useSubscriptionStore()
  subscription.current = { features: ["products"], blocked: false } as any
  subscription.loaded = true
})

const mountForm = () => mountSuspended(SaleForm, { props: { dataModalForm: { action: "create" } } })
type Wrapper = Awaited<ReturnType<typeof mountForm>>

const click = async (wrapper: Wrapper, text: string) => {
  const button = wrapper.findAll("button").find((candidate) => candidate.text() === text)
  if (!button) throw new Error(`No button "${text}"`)
  await button.trigger("click")
  await flushPromises()
}

/** Inputs share labels (every service line has a "Cantidad"): fill the nth one. */
const fillNth = async (wrapper: Wrapper, label: string, index: number, value: unknown) => {
  const matches = wrapper.findAllComponents(".v-input").filter((input) => String(input.props("label")).startsWith(label))
  if (!matches[index]) throw new Error(`No input #${index} labelled ${label}`)
  matches[index]!.vm.$emit("update:modelValue", value)
  await flushPromises()
}

const withServiceLine = async (wrapper: Wrapper, quantity: unknown = 2) => {
  await fillAll(wrapper, { Cliente: 1, Sucursal: 2 })
  await click(wrapper, "Agregar servicio")
  await fillNth(wrapper, "Servicio", 0, 4)
  await fillNth(wrapper, "Profesional", 0, 3)
  await fillNth(wrapper, "Cantidad", 0, quantity)
  await settle()
}

describe("SaleForm (create)", () => {
  it("emits the sale in the shape of the backend's CreateSaleRequest", async () => {
    const wrapper = await mountForm()
    await withServiceLine(wrapper, 2)
    await submit(wrapper)

    const [sale] = submitted(wrapper, "create") as any[]
    expect(sale).toMatchObject({ clientId: 1, branchId: 2, items: [{ serviceId: 4, userId: 3, quantity: 2 }] })
    expect(sale.soldAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
    expect(sale).not.toHaveProperty("payments")
    expect(sale).not.toHaveProperty("discountAmount")
  })

  it("takes the unit price from the chosen service and from the chosen product", async () => {
    const wrapper = await mountForm()
    await withServiceLine(wrapper, 2)
    await click(wrapper, "Agregar producto")
    await fillNth(wrapper, "Producto", 0, 5)
    await settle()
    await fillNth(wrapper, "Cantidad", 1, 1)
    await submit(wrapper)

    const [sale] = submitted(wrapper, "create") as any[]
    expect(sale.items).toEqual([
      expect.objectContaining({ serviceId: 4, quantity: 2, unitPrice: 80 }),
      expect.objectContaining({ productId: 5, quantity: 1, unitPrice: 30 }),
    ])
  })

  it("does not let a service be added before a client is chosen", async () => {
    const wrapper = await mountForm()
    const add = wrapper.findAll("button").find((button) => button.text() === "Agregar servicio")!
    expect(add.attributes("disabled")).toBeDefined()
  })

  it.each(["Cliente", "Sucursal"])("does not submit without %s", async (label) => {
    const wrapper = await mountForm()
    await withServiceLine(wrapper)
    await fill(wrapper, label, null)
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(0)
  })

  it("does not submit a sale with no items", async () => {
    const wrapper = await mountForm()
    await fillAll(wrapper, { Cliente: 1, Sucursal: 2 })
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(0)
  })

  describe("quantity of a service (Integer, above 0 in the backend)", () => {
    it.each([
      [0, "Debe ser mayor a 0"],
      [-1, "Debe ser mayor a 0"],
      [1.5, "Debe ser un número entero"],
      ["", "Este campo es requerido"],
    ])("refuses %j", async (quantity, message) => {
      const wrapper = await mountForm()
      await withServiceLine(wrapper, quantity)
      await submit(wrapper)
      expect(submitted(wrapper, "create")).toHaveLength(0)
      expect(errorMessages(wrapper)).toContain(message)
    })
  })

  describe("products", () => {
    it("sells a product by id and quantity", async () => {
      const wrapper = await mountForm()
      await fillAll(wrapper, { Cliente: 1, Sucursal: 2 })
      await click(wrapper, "Agregar producto")
      await fillNth(wrapper, "Producto", 0, 5)
      await settle()
      await fillNth(wrapper, "Cantidad", 0, 2)
      await submit(wrapper)
      expect((submitted(wrapper, "create")[0] as any).items).toEqual([expect.objectContaining({ productId: 5, quantity: 2 })])
    })

    it("cannot sell more than the stock", async () => {
      const wrapper = await mountForm()
      await fillAll(wrapper, { Cliente: 1, Sucursal: 2 })
      await click(wrapper, "Agregar producto")
      await fillNth(wrapper, "Producto", 0, 5)
      await settle()
      await fillNth(wrapper, "Cantidad", 0, 4)
      await submit(wrapper)
      expect(submitted(wrapper, "create")).toHaveLength(0)
      expect(errorMessages(wrapper)).toContain("Solo hay 3 disponibles")
    })
  })

  describe("payments (the backend asks for an amount above 0, a method and a reference of 100 characters at most)", () => {
    it("sends the payments with their method and a trimmed reference", async () => {
      const wrapper = await mountForm()
      await withServiceLine(wrapper, 1)
      await click(wrapper, "Agregar pago")
      await fillNth(wrapper, "Monto", 0, 50)
      await fillNth(wrapper, "Método", 0, "YAPE")
      await fillNth(wrapper, "Referencia", 0, "  op-123  ")
      await submit(wrapper)

      expect((submitted(wrapper, "create")[0] as any).payments).toEqual([
        expect.objectContaining({ amount: 50, paymentMethod: "YAPE", reference: "op-123" }),
      ])
    })

    it("refuses a payment of 0", async () => {
      const wrapper = await mountForm()
      await withServiceLine(wrapper, 1)
      await click(wrapper, "Agregar pago")
      await fillNth(wrapper, "Monto", 0, 0)
      await submit(wrapper)
      expect(submitted(wrapper, "create")).toHaveLength(0)
      expect(errorMessages(wrapper)).toContain("Debe ser mayor a 0")
    })

    it("the reference accepts 100 characters and no more", async () => {
      const wrapper = await mountForm()
      await withServiceLine(wrapper, 1)
      await click(wrapper, "Agregar pago")
      await fillNth(wrapper, "Monto", 0, 50)
      await fillNth(wrapper, "Referencia", 0, "x".repeat(100))
      await submit(wrapper)
      expect(submitted(wrapper, "create")).toHaveLength(1)

      await fillNth(wrapper, "Referencia", 0, "x".repeat(101))
      await submit(wrapper)
      expect(submitted(wrapper, "create")).toHaveLength(1)
    })

    it("the payments cannot add up to more than the sale", async () => {
      const wrapper = await mountForm()
      await withServiceLine(wrapper, 1)
      await click(wrapper, "Agregar pago")
      await fillNth(wrapper, "Monto", 0, 5000)
      await submit(wrapper)
      expect(submitted(wrapper, "create")).toHaveLength(0)
    })
  })
})
