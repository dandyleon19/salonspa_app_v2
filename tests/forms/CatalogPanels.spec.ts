import { beforeEach, describe, expect, it } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import ManageProducts from "~/components/app/product-categories/ManageProducts.vue"
import ManageServices from "~/components/app/service-categories/ManageServices.vue"
import ProductStockDialog from "~/components/app/product-categories/ProductStockDialog.vue"
import { errorMessages, fill, fillAll } from "../utils/forms"
import { recordEndpoint } from "../utils/endpoints"

const click = async (wrapper: any, text: string) => {
  const button = wrapper.findAll("button").find((candidate: any) => candidate.text() === text)
  if (!button) throw new Error(`No button "${text}"`)
  await button.trigger("click")
  await flushPromises()
}

const submitForm = async (wrapper: any) => {
  await wrapper.find("form").trigger("submit")
  await flushPromises()
  await flushPromises()
}


const products = recordEndpoint("/api/products", "POST", (body) => ({ id: 11, ...body }))
const services = recordEndpoint("/api/services", "POST", (body) => ({ id: 21, ...body }))
const stock = recordEndpoint("/api/products/11/stock-movements", "POST", {})
recordEndpoint("/api/products/11/stock-movements", "GET", { content: [], page: 0, totalPages: 1 })

beforeEach(() => {
  products.reset()
  services.reset()
  stock.reset()
})

describe("ManageProducts (the products of a category)", () => {
  const mountPanel = async () => {
    const wrapper = await mountSuspended(ManageProducts, { props: { dataModalForm: { action: "products", rowId: 5, products: [] } as any } })
    await click(wrapper, "Nuevo producto")
    return wrapper
  }
  const valid = { "Nombre del producto": "Crema hidratante", Precio: "35.5", "Stock disponible": "10", "Alerta de stock bajo": "3" }

  it("creates the product in the category with the backend's CreateProductRequest fields", async () => {
    const wrapper = await mountPanel()
    await fillAll(wrapper, valid)
    await submitForm(wrapper)

    expect(products.bodies).toHaveLength(1)
    expect(products.bodies[0]).toEqual({
      name: "Crema hidratante",
      description: "",
      longDescription: "",
      isActive: true,
      price: 35.5,
      stockQuantity: 10,
      lowStockThreshold: 3,
      categoryId: 5,
    })
  })

  it.each(["Nombre del producto", "Precio", "Stock disponible", "Alerta de stock bajo"])("does not create without %s", async (label) => {
    const wrapper = await mountPanel()
    await fillAll(wrapper, valid)
    await fill(wrapper, label, "")
    await submitForm(wrapper)
    expect(products.bodies).toHaveLength(0)
    expect(errorMessages(wrapper)).toContain("Este campo es requerido")
  })

  it.each([
    ["-1", "Debe ser mayor o igual a 0"],
    ["10.555", "Máximo 2 decimales"],
    ["123456789", "Máximo 8 dígitos enteros"],
  ])("refuses the price %j (NUMERIC(10, 2) in the database)", async (price, message) => {
    const wrapper = await mountPanel()
    await fillAll(wrapper, { ...valid, Precio: price })
    await submitForm(wrapper)
    expect(products.bodies).toHaveLength(0)
    expect(errorMessages(wrapper)).toContain(message)
  })

  it("the stock must be a whole number, not negative", async () => {
    const wrapper = await mountPanel()
    for (const stock of ["1.5", "-2"]) {
      await fillAll(wrapper, { ...valid, "Stock disponible": stock })
      await submitForm(wrapper)
    }
    expect(products.bodies).toHaveLength(0)
  })

  it("name accepts 150 characters and no more", async () => {
    const wrapper = await mountPanel()
    await fillAll(wrapper, { ...valid, "Nombre del producto": "x".repeat(151) })
    await submitForm(wrapper)
    expect(products.bodies).toHaveLength(0)

    await fill(wrapper, "Nombre del producto", "x".repeat(150))
    await submitForm(wrapper)
    expect(products.bodies).toHaveLength(1)
  })
})

describe("ManageServices (the services of a category)", () => {
  const mountPanel = async () => {
    const wrapper = await mountSuspended(ManageServices, { props: { dataModalForm: { action: "services", rowId: 6, services: [] } as any } })
    await click(wrapper, "Nuevo servicio")
    return wrapper
  }
  const valid = { "Nombre del servicio": "Limpieza facial", Precio: "80", Duración: 60 }

  it("creates the service in the category with the backend's CreateServiceRequest fields", async () => {
    const wrapper = await mountPanel()
    await fillAll(wrapper, valid)
    await submitForm(wrapper)

    expect(services.bodies).toHaveLength(1)
    expect(services.bodies[0]).toMatchObject({
      name: "Limpieza facial",
      price: 80,
      durationMinutes: 60,
      isActive: true,
      categoryId: 6,
    })
  })

  it.each(["Nombre del servicio", "Precio", "Duración"])("does not create without %s", async (label) => {
    const wrapper = await mountPanel()
    await fillAll(wrapper, valid)
    await fill(wrapper, label, label === "Duración" ? null : "")
    await submitForm(wrapper)
    expect(services.bodies).toHaveLength(0)
  })

  it.each([
    ["-5", "Debe ser mayor o igual a 0"],
    ["10.999", "Máximo 2 decimales"],
    ["123456789", "Máximo 8 dígitos enteros"],
  ])("refuses the price %j", async (price, message) => {
    const wrapper = await mountPanel()
    await fillAll(wrapper, { ...valid, Precio: price })
    await submitForm(wrapper)
    expect(services.bodies).toHaveLength(0)
    expect(errorMessages(wrapper)).toContain(message)
  })
})

describe("ProductStockDialog", () => {
  const mountDialog = async () => {
    const wrapper = await mountSuspended(ProductStockDialog, {
      props: { modelValue: true, product: { id: 11, name: "Crema", stockQuantity: 10 } as any },
      attachTo: document.body,
    })
    await flushPromises()
    return wrapper
  }
  const press = async (wrapper: any) => {
    await wrapper.findComponent({ name: "VForm" }).trigger("submit")
    await flushPromises()
    await flushPromises()
  }

  it("a restock sends the quantity as a positive whole number", async () => {
    const wrapper = await mountDialog()
    await fill(wrapper, "¿Cuántas unidades llegaron?", 5)
    await fill(wrapper, "Motivo", "  Compra al proveedor ")
    await press(wrapper)

    expect(stock.bodies[0]).toEqual({
      movementType: "RESTOCK",
      quantityDelta: 5,
      reason: "Compra al proveedor",
    })
    expect(wrapper.emitted("updated")?.[0]?.[0]).toMatchObject({ id: 11, stockQuantity: 15 })
  })

  it.each([0, -3, 1.5, ""])("refuses to restock %j (the backend's quantityDelta is an Integer)", async (quantity) => {
    const wrapper = await mountDialog()
    await fill(wrapper, "¿Cuántas unidades llegaron?", quantity)
    await press(wrapper)
    expect(stock.bodies).toHaveLength(0)
  })

  it("the reason accepts 255 characters and no more", async () => {
    const wrapper = await mountDialog()
    await fill(wrapper, "¿Cuántas unidades llegaron?", 1)
    await fill(wrapper, "Motivo", "x".repeat(256))
    await press(wrapper)
    expect(stock.bodies).toHaveLength(0)

    await fill(wrapper, "Motivo", "x".repeat(255))
    await press(wrapper)
    expect(stock.bodies).toHaveLength(1)
  })
})
