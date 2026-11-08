import { beforeEach, describe, expect, it, vi } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import ClinicalRecordForm from "~/components/app/clinical-records/ClinicalRecordForm.vue"
import { useAuthStore } from "~/store/modules/auth"
import { useBranchesStore } from "~/store/modules/branch"
import { useClientsStore } from "~/store/modules/client"
import { useUsersStore } from "~/store/modules/user"
import { useServicesStore } from "~/store/modules/service"
import { formatDateInput, getTomorrowDate } from "~/helpers/dateTimeHelpers"
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

const yesterday = () => {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return formatDateInput(date)
}

beforeEach(() => {
  const branches = useBranchesStore()
  const clients = useClientsStore()
  const users = useUsersStore()
  const services = useServicesStore()

  for (const [store, method] of [
    [branches, "fetchBranches"],
    [clients, "fetchClients"],
    [users, "fetchUsers"],
    [services, "fetchServices"],
  ] as const) {
    vi.spyOn(store as any, method).mockResolvedValue(undefined)
    store.loading = false
  }

  branches.data = pageOf([{ id: 2, name: "Centro", salonId: 1 }]) as any
  clients.data = pageOf([{ id: 1, firstName: "Ana", lastName: "Paz", salonId: 1 }]) as any
  users.data = pageOf([{ id: 3, firstName: "Luis", lastName: "Ríos", fullName: "Luis Ríos", salonId: 1 }]) as any
  services.list = [{ id: 4, name: "Limpieza facial", price: 80, durationMinutes: 60, salonId: 1 }] as any

  useAuthStore().setAuth({ token: "t", role: "ADMIN_USER", user: { id: 9, firstName: "A", lastName: "B", role: "ADMIN_USER", salonId: 1 } })
})

const mountForm = () =>
  mountSuspended(ClinicalRecordForm, { props: { dataModalForm: { action: "create" }, clientId: 1 } })
type Wrapper = Awaited<ReturnType<typeof mountForm>>

const setSession = async (wrapper: Wrapper, date: string, time: string) => {
  wrapper.findAllComponents({ name: "AppDateField" })[0]!.vm.$emit("update:modelValue", date)
  wrapper.findAllComponents({ name: "AppTimeField" })[0]!.vm.$emit("update:modelValue", time)
  await flushPromises()
}

const assignment = { Sucursal: 2, Trabajador: 3 }

describe("ClinicalRecordForm (create)", () => {
  it("emits the record with the fields of the backend's CreateClinicalRecordRequest", async () => {
    const wrapper = await mountForm()
    await fillAll(wrapper, { ...assignment, Diagnóstico: "Acné leve", Tratamiento: "Limpieza", Observaciones: "Volver en 15 días" })
    await setSession(wrapper, yesterday(), "09:00")
    await submit(wrapper)

    const [record] = submitted(wrapper, "create") as any[]
    expect(record).toMatchObject({
      branchId: 2,
      userId: 3,
      diagnosis: "Acné leve",
      treatment: "Limpieza",
      observations: "Volver en 15 días",
      sessionDate: `${yesterday()}T09:00`,
    })
    expect(record).not.toHaveProperty("nextAppointment")
  })

  it.each(["Sucursal", "Trabajador"])("does not submit without %s", async (label) => {
    const wrapper = await mountForm()
    await fillAll(wrapper, { ...assignment, [label]: null })
    await setSession(wrapper, yesterday(), "09:00")
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(0)
    expect(errorMessages(wrapper)).toContain("Este campo es requerido")
  })

  it("does not submit without the session date and time", async () => {
    const wrapper = await mountForm()
    await fillAll(wrapper, assignment)
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(0)
  })

  it("a session cannot be in the future", async () => {
    const wrapper = await mountForm()
    await fillAll(wrapper, assignment)
    await setSession(wrapper, getTomorrowDate(), "09:00")
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(0)
  })

  describe("next appointment", () => {
    it("asks for professional and branch once it is turned on, and sends it in the shape of NextAppointmentRequest", async () => {
      const wrapper = await mountForm()
      await fillAll(wrapper, { ...assignment, "Agendar próxima cita": true })
      await setSession(wrapper, yesterday(), "09:00")
      wrapper.findAllComponents({ name: "AppDateField" })[1]!.vm.$emit("update:modelValue", getTomorrowDate())
      wrapper.findAllComponents({ name: "AppTimeField" })[1]!.vm.$emit("update:modelValue", "10:00")
      await flushPromises()

      await submit(wrapper)
      expect(submitted(wrapper, "create")).toHaveLength(0)

      const inputs = wrapper.findAllComponents(".v-input")
      const nextProfessional = inputs.filter((input) => input.props("label") === "Profesional")[0]!
      const nextBranch = inputs.filter((input) => input.props("label") === "Sucursal").at(-1)!
      nextProfessional.vm.$emit("update:modelValue", 3)
      nextBranch.vm.$emit("update:modelValue", 2)
      await flushPromises()
      await submit(wrapper)

      expect((submitted(wrapper, "create")[0] as any).nextAppointment).toEqual({
        userId: 3,
        branchId: 2,
        startAt: `${getTomorrowDate()}T10:00`,
        notes: undefined,
      })
    })
  })

  it("a STAFF_USER cannot schedule the next appointment from here", async () => {
    useAuthStore().setAuth({ token: "t", role: "STAFF_USER", user: { id: 9, firstName: "A", lastName: "B", role: "STAFF_USER", salonId: 1 } })
    const wrapper = await mountForm()
    expect(wrapper.text()).not.toContain("Agendar próxima cita")
  })
})
