import { beforeEach, describe, expect, it, vi } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import AppointmentForm from "~/components/app/appointments/AppointmentForm.vue"
import { useBranchesStore } from "~/store/modules/branch"
import { useClientsStore } from "~/store/modules/client"
import { useUsersStore } from "~/store/modules/user"
import { useServicesStore } from "~/store/modules/service"
import { getTomorrowDate } from "~/helpers/dateTimeHelpers"
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

const pageOf = (content: unknown[]) => ({ content, page: 0, size: 100, totalElements: content.length, totalPages: 1 })

beforeEach(() => {
  const branches = useBranchesStore()
  const clients = useClientsStore()
  const users = useUsersStore()
  const services = useServicesStore()

  // The form loads its lists when it opens; here they are already there.
  vi.spyOn(branches, "fetchBranches").mockResolvedValue(undefined as any)
  vi.spyOn(clients, "fetchClients").mockResolvedValue(undefined as any)
  vi.spyOn(users, "fetchUsers").mockResolvedValue(undefined as any)
  vi.spyOn(services, "fetchServices").mockResolvedValue(undefined as any)

  branches.data = pageOf([{ id: 2, name: "Centro", salonId: 1 }]) as any
  clients.data = pageOf([{ id: 1, firstName: "Ana", lastName: "Paz", salonId: 1 }]) as any
  users.data = pageOf([{ id: 3, firstName: "Luis", lastName: "Ríos", fullName: "Luis Ríos", salonId: 1 }]) as any
  services.list = [{ id: 4, name: "Limpieza facial", price: 80, durationMinutes: 60, salonId: 1 }] as any
  for (const store of [branches, clients, users, services]) store.loading = false
})

const mountForm = () => mountSuspended(AppointmentForm, { props: { dataModalForm: { action: "create" } } })

const setWhen = async (wrapper: Awaited<ReturnType<typeof mountForm>>, date: string, time: string) => {
  wrapper.findComponent({ name: "AppDateField" }).vm.$emit("update:modelValue", date)
  wrapper.findComponent({ name: "AppTimeField" }).vm.$emit("update:modelValue", time)
  await flushPromises()
}

const people = { Cliente: 1, Profesional: 3, Sucursal: 2 }

describe("AppointmentForm (create)", () => {
  it("emits the appointment in the shape of the backend's CreateAppointmentRequest", async () => {
    const wrapper = await mountForm()
    await fillAll(wrapper, people)
    await setWhen(wrapper, getTomorrowDate(), "10:00")
    await submit(wrapper)

    expect(submitted(wrapper, "create")).toEqual([
      { clientId: 1, userId: 3, branchId: 2, startAt: `${getTomorrowDate()}T10:00`, notes: undefined },
    ])
  })

  it("a client that is not among the first 100 can be chosen (the picker searches the server)", async () => {
    const wrapper = await mountForm()
    await fillAll(wrapper, { ...people, Cliente: 150 })
    await setWhen(wrapper, getTomorrowDate(), "10:00")
    await submit(wrapper)
    expect(submitted(wrapper, "create")[0]).toMatchObject({ clientId: 150 })
  })

  it.each(["Cliente", "Profesional", "Sucursal"])("does not submit without %s", async (label) => {
    const wrapper = await mountForm()
    await fillAll(wrapper, { ...people, [label]: null })
    await setWhen(wrapper, getTomorrowDate(), "10:00")
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(0)
    expect(errorMessages(wrapper)).toContain("Este campo es requerido")
  })

  it("does not submit without a date and time", async () => {
    const wrapper = await mountForm()
    await fillAll(wrapper, people)
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(0)
  })

  it("the service is optional; when chosen it goes as serviceId", async () => {
    const wrapper = await mountForm()
    await fillAll(wrapper, { ...people, Servicio: 4 })
    await setWhen(wrapper, getTomorrowDate(), "10:00")
    await submit(wrapper)
    expect(submitted(wrapper, "create")[0]).toMatchObject({ serviceId: 4 })
  })

  it("notes are trimmed, and blank notes are not sent", async () => {
    const wrapper = await mountForm()
    await fillAll(wrapper, { ...people, Notas: "  Piel sensible  " })
    await setWhen(wrapper, getTomorrowDate(), "10:00")
    await submit(wrapper)
    expect(submitted(wrapper, "create")[0]).toMatchObject({ notes: "Piel sensible" })

    await fill(wrapper, "Notas", "   ")
    await submit(wrapper)
    expect((submitted(wrapper, "create")[1] as any).notes).toBeUndefined()
  })

  describe("deposit (the backend asks for an amount above 0 and a payment method)", () => {
    it("sends the amount and the method, CASH when none was chosen", async () => {
      const wrapper = await mountForm()
      await fillAll(wrapper, { ...people, "Monto del adelanto": 20 })
      await setWhen(wrapper, getTomorrowDate(), "10:00")
      await submit(wrapper)
      expect(submitted(wrapper, "create")[0]).toMatchObject({ depositAmount: 20, depositPaymentMethod: "CASH" })

      await fill(wrapper, "Método de pago del adelanto", "YAPE")
      await submit(wrapper)
      expect(submitted(wrapper, "create")[1]).toMatchObject({ depositAmount: 20, depositPaymentMethod: "YAPE" })
    })

    it("no deposit means neither amount nor method are sent", async () => {
      const wrapper = await mountForm()
      await fillAll(wrapper, people)
      await setWhen(wrapper, getTomorrowDate(), "10:00")
      await submit(wrapper)
      const [payload] = submitted(wrapper, "create") as any[]
      expect(payload).not.toHaveProperty("depositAmount")
      expect(payload).not.toHaveProperty("depositPaymentMethod")
    })

    it.each([-5, 10.555])("refuses a deposit of %s", async (amount) => {
      const wrapper = await mountForm()
      await fillAll(wrapper, { ...people, "Monto del adelanto": amount })
      await setWhen(wrapper, getTomorrowDate(), "10:00")
      await submit(wrapper)
      expect(submitted(wrapper, "create")).toHaveLength(0)
    })
  })
})
