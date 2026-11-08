import { describe, expect, it } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import ClientForm from "~/components/app/clients/ClientForm.vue"
import BranchForm from "~/components/app/branches/BranchForm.vue"
import SalonForm from "~/components/app/salons/SalonForm.vue"
import ServiceCategoryForm from "~/components/app/service-categories/ServiceCategoryForm.vue"
import ProductCategoryForm from "~/components/app/product-categories/ProductCategoryForm.vue"
import { useClientsStore } from "~/store/modules/client"
import { useBranchesStore } from "~/store/modules/branch"
import { useSalonsStore } from "~/store/modules/salon"
import { useServiceCategoriesStore } from "~/store/modules/serviceCategory"
import { useProductCategoriesStore } from "~/store/modules/productCategory"
import { errorMessages, fill, fillAll, submit, submitted } from "../utils/forms"

/** The forms show a skeleton while their list store is loading; a spec starts with the store ready. */
const ready = (store: { loading: boolean; data: any }, records: unknown[] = []) => {
  store.loading = false
  store.data = { content: records, page: 0, size: 10, totalElements: records.length, totalPages: 1 }
}

describe("ClientForm", () => {
  const mountForm = (action: "create" | "update" = "create", records: unknown[] = [], rowId?: number) => {
    ready(useClientsStore(), records)
    return mountSuspended(ClientForm, { props: { dataModalForm: { action, rowId } } })
  }

  it("requires first and last name, not made only of spaces", async () => {
    const wrapper = await mountForm()
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(0)
    expect(errorMessages(wrapper)).toContain("Este campo es requerido")

    await fillAll(wrapper, { Nombres: "   ", Apellidos: "Paz" })
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(0)
  })

  it("emits the client with the fields of the backend's CreateClientRequest", async () => {
    const wrapper = await mountForm()
    await fillAll(wrapper, { Nombres: "Ana", Apellidos: "Paz", "Nro de documento": "12345678", "Teléfono / Celular": "987654321", "Correo electrónico": "ana@correo.pe" })
    await submit(wrapper)

    const [client] = submitted(wrapper, "create") as any[]
    expect(client).toMatchObject({
      firstName: "Ana",
      lastName: "Paz",
      documentNumber: "12345678",
      phone: "987654321",
      email: "ana@correo.pe",
    })
    // Only fields the backend knows (id and salon are set by the server).
    const allowed = ["firstName", "lastName", "documentNumber", "phone", "email", "birthDate", "gender", "clinicalRecords"]
    expect(Object.keys(client).filter((key) => !allowed.includes(key))).toEqual([])
  })

  it("the email is optional, but a malformed one is refused (the backend's @Email would answer 400)", async () => {
    const wrapper = await mountForm()
    await fillAll(wrapper, { Nombres: "Ana", Apellidos: "Paz" })
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(1)

    await fill(wrapper, "Correo electrónico", "sin-arroba")
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(1)
    expect(errorMessages(wrapper)).toContain("Correo inválido")
  })

  it.each([
    ["Nombres", 100],
    ["Apellidos", 100],
    ["Nro de documento", 20],
    ["Teléfono / Celular", 20],
    ["Correo electrónico", 100],
  ])("%s accepts %i characters and no more (client columns are VARCHAR)", async (label, max) => {
    const wrapper = await mountForm()
    await fillAll(wrapper, { Nombres: "Ana", Apellidos: "Paz" })
    const value = label === "Correo electrónico" ? `${"x".repeat(max - 10)}@correo.pe` : "x".repeat(max)

    await fill(wrapper, label, value)
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(1)

    await fill(wrapper, label, `${value}x`)
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(1)
  })

  it("loads the client being edited from the list", async () => {
    const wrapper = await mountForm("update", [{ id: 4, firstName: "Luis", lastName: "Ríos", email: "l@r.pe", clinicalRecords: [] }], 4)
    await submit(wrapper)
    expect(submitted(wrapper, "update")).toEqual([expect.objectContaining({ id: 4, firstName: "Luis", lastName: "Ríos" })])
  })
})

describe("BranchForm", () => {
  const mountForm = () => {
    ready(useBranchesStore())
    return mountSuspended(BranchForm, { props: { dataModalForm: { action: "create" } } })
  }
  const valid = { Nombre: "Centro", Dirección: "Av. Lima 123", Ciudad: "Lima" }

  it("requires name, address and city", async () => {
    for (const missing of Object.keys(valid)) {
      const wrapper = await mountForm()
      await fillAll(wrapper, { ...valid, [missing]: "" })
      await submit(wrapper)
      expect(submitted(wrapper, "create")).toHaveLength(0)
    }
  })

  it("emits name, address and city", async () => {
    const wrapper = await mountForm()
    await fillAll(wrapper, valid)
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toEqual([expect.objectContaining({ name: "Centro", address: "Av. Lima 123", city: "Lima" })])
  })

  it.each([
    ["Nombre", 50],
    ["Dirección", 100],
    ["Ciudad", 100],
  ])("%s accepts %i characters and no more (the backend's @Size)", async (label, max) => {
    const wrapper = await mountForm()
    await fillAll(wrapper, valid)
    await fill(wrapper, label, "x".repeat(max))
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(1)

    await fill(wrapper, label, "x".repeat(max + 1))
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(1)
  })
})

describe("SalonForm", () => {
  const mountForm = () => {
    ready(useSalonsStore())
    return mountSuspended(SalonForm, { props: { dataModalForm: { action: "create" } } })
  }
  const valid = {
    "Nombre del salón": "Spa Luna",
    "Razón social": "Spa Luna SAC",
    "Dirección fiscal": "Av. Lima 123",
    RUC: "20123456789",
    Teléfono: "987654321",
  }

  it("requires every field", async () => {
    for (const missing of Object.keys(valid)) {
      const wrapper = await mountForm()
      await fillAll(wrapper, { ...valid, [missing]: "" })
      await submit(wrapper)
      expect(submitted(wrapper, "create")).toHaveLength(0)
    }
  })

  it("emits the fields of the backend's CreateSalonRequest", async () => {
    const wrapper = await mountForm()
    await fillAll(wrapper, valid)
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toEqual([
      expect.objectContaining({
        name: "Spa Luna",
        socialReason: "Spa Luna SAC",
        fiscalAddress: "Av. Lima 123",
        rucNumber: "20123456789",
        phone: "987654321",
      }),
    ])
  })

  it.each([
    ["Nombre del salón", 100],
    ["Razón social", 100],
    ["Dirección fiscal", 100],
    ["RUC", 20],
    ["Teléfono", 20],
  ])("%s accepts %i characters and no more", async (label, max) => {
    const wrapper = await mountForm()
    await fillAll(wrapper, valid)
    await fill(wrapper, label, "x".repeat(max))
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(1)

    await fill(wrapper, label, "x".repeat(max + 1))
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(1)
  })
})

describe.each([
  ["ServiceCategoryForm", ServiceCategoryForm, () => useServiceCategoriesStore()],
  ["ProductCategoryForm", ProductCategoryForm, () => useProductCategoriesStore()],
] as const)("%s", (_name, Component, useStore) => {
  const mountForm = () => {
    ready(useStore() as any)
    return mountSuspended(Component as any, { props: { dataModalForm: { action: "create" } } })
  }

  it("requires a name", async () => {
    const wrapper = await mountForm()
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(0)
    expect(errorMessages(wrapper)).toContain("Este campo es requerido")
  })

  it("emits name and both descriptions", async () => {
    const wrapper = await mountForm()
    await fillAll(wrapper, { "Nombre de la categoría": "Faciales", "Descripción corta": "Rostro", "Descripción detallada": "Tratamientos del rostro" })
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toEqual([
      expect.objectContaining({ name: "Faciales", description: "Rostro", longDescription: "Tratamientos del rostro" }),
    ])
  })

  it("the name accepts 100 characters and no more (the backend's @Size)", async () => {
    const wrapper = await mountForm()
    await fill(wrapper, "Nombre de la categoría", "x".repeat(100))
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(1)

    await fill(wrapper, "Nombre de la categoría", "x".repeat(101))
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(1)
  })
})
