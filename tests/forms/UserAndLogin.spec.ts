import { beforeEach, describe, expect, it, vi } from "vitest"
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime"
import UserForm from "~/components/app/users/UserForm.vue"
import LoginForm from "~/components/LoginForm.vue"
import { useAuthStore } from "~/store/modules/auth"
import { useUsersStore } from "~/store/modules/user"
import { useSubscriptionStore } from "~/store/modules/subscription"
import { errorMessages, fill, fillAll, findInput, submit, submitted } from "../utils/forms"
import { registerRecordEndpoints } from "../utils/endpoints"

// The salon picker (only the platform admin sees it) searches on the server: this is that server.
registerRecordEndpoints("/api/salons", [{ id: 1, name: "Spa Luna" }])

const { loginMock, successMock, errorMock, navigateToMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  successMock: vi.fn(),
  errorMock: vi.fn(),
  navigateToMock: vi.fn(),
}))

mockNuxtImport("useAuth", () => () => ({ login: loginMock, logout: vi.fn() }))
mockNuxtImport("useNotification", () => () => ({ success: successMock, error: errorMock, show: vi.fn() }))
mockNuxtImport("navigateTo", () => navigateToMock)

type Role = "SUPER_ADMIN" | "ADMIN_USER" | "STAFF_USER"

describe("UserForm", () => {
  const signIn = (role: Role) =>
    useAuthStore().setAuth({ token: "t", role, user: { id: 1, firstName: "Yo", lastName: "Mismo", role, salonId: 1 } })

  const mountForm = (action: "create" | "update" | "changePassword" = "create", records: unknown[] = [], rowId?: number) => {
    const users = useUsersStore()
    users.loading = false
    users.data = { content: records, page: 0, size: 10, totalElements: records.length, totalPages: 1 } as any
    // No plan feature loaded as available: the per-service commissions block (it calls the API) stays out of these specs.
    const subscription = useSubscriptionStore()
    subscription.current = { features: [], blocked: false } as any
    subscription.loaded = true
    return mountSuspended(UserForm, { props: { dataModalForm: { action, rowId } } })
  }

  const person = { Nombres: "Ana", Apellidos: "Paz", Correo: "ana@salon.pe", "Comisión general (%)": "10", Contraseña: "clave-segura-1", "Confirmar contraseña": "clave-segura-1" }

  beforeEach(() => signIn("ADMIN_USER"))

  it("emits the user to create; a new worker is STAFF_USER by default", async () => {
    const wrapper = await mountForm()
    await fillAll(wrapper, person)
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toEqual([
      expect.objectContaining({
        firstName: "Ana",
        lastName: "Paz",
        email: "ana@salon.pe",
        commissionPercentage: "10",
        password: "clave-segura-1",
        role: "STAFF_USER",
      }),
    ])
  })

  it.each(["Nombres", "Apellidos", "Correo", "Comisión general (%)", "Contraseña", "Confirmar contraseña"])(
    "does not submit without %s",
    async (label) => {
      const wrapper = await mountForm()
      await fillAll(wrapper, person)
      await fill(wrapper, label, "")
      await submit(wrapper)
      expect(submitted(wrapper, "create")).toHaveLength(0)
    }
  )

  it("rejects an invalid email", async () => {
    const wrapper = await mountForm()
    await fillAll(wrapper, { ...person, Correo: "ana@" })
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(0)
    expect(errorMessages(wrapper)).toContain("Correo inválido")
  })

  // The backend (CreateUserRequest) asks for 8 to 255 characters; the form used to accept 6.
  it("rejects a password under 8 characters, like the backend does", async () => {
    const wrapper = await mountForm()
    await fillAll(wrapper, { ...person, Contraseña: "1234567", "Confirmar contraseña": "1234567" })
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(0)
    expect(errorMessages(wrapper)).toContain("Debe tener al menos 8 caracteres")

    await fillAll(wrapper, { Contraseña: "12345678", "Confirmar contraseña": "12345678" })
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(1)
  })

  it("the confirmation has to match", async () => {
    const wrapper = await mountForm()
    await fillAll(wrapper, { ...person, "Confirmar contraseña": "otra-clave-99" })
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(0)
    expect(errorMessages(wrapper)).toContain("Las contraseñas no coinciden")
  })

  it.each([
    ["-1", false],
    ["100.5", false],
    ["abc", false],
    ["0", true],
    ["100", true],
    ["12.5", true],
  ])("commission %j is %s (the backend asks for 0 to 100)", async (value, accepted) => {
    const wrapper = await mountForm()
    await fillAll(wrapper, { ...person, "Comisión general (%)": value })
    await submit(wrapper)
    expect(submitted(wrapper, "create")).toHaveLength(accepted ? 1 : 0)
  })

  it("names and email accept 255 characters and no more", async () => {
    for (const label of ["Nombres", "Apellidos"]) {
      const wrapper = await mountForm()
      await fillAll(wrapper, person)
      await fill(wrapper, label, "x".repeat(255))
      await submit(wrapper)
      expect(submitted(wrapper, "create")).toHaveLength(1)
      await fill(wrapper, label, "x".repeat(256))
      await submit(wrapper)
      expect(submitted(wrapper, "create")).toHaveLength(1)
    }
  })

  it("only a SUPER_ADMIN chooses the salon of a new worker", async () => {
    const admin = await mountForm()
    expect(() => findInput(admin, "Salón")).toThrow()

    signIn("SUPER_ADMIN")
    const superAdmin = await mountForm()
    expect(findInput(superAdmin, "Salón")).toBeTruthy()
    await fillAll(superAdmin, person)
    await submit(superAdmin)
    expect(submitted(superAdmin, "create")).toHaveLength(0)

    await fill(superAdmin, "Salón", 1)
    await submit(superAdmin)
    expect(submitted(superAdmin, "create")[0]).toMatchObject({ salonId: 1 })
  })

  it("update asks no password and keeps the user's data", async () => {
    const wrapper = await mountForm("update", [
      { id: 7, firstName: "Luis", lastName: "Ríos", email: "luis@salon.pe", isActive: true, role: "STAFF_USER", commissionPercentage: 15 },
    ], 7)
    expect(wrapper.findAllComponents(".v-input").map((input) => String(input.props("label")))).not.toContain("Contraseña")
    await submit(wrapper)
    expect(submitted(wrapper, "update")).toEqual([
      expect.objectContaining({ id: 7, firstName: "Luis", email: "luis@salon.pe", role: "STAFF_USER", commissionPercentage: 15 }),
    ])
  })

  it("the SUPER_ADMIN account keeps SUPER_ADMIN as its only role", async () => {
    const wrapper = await mountForm("update", [
      { id: 2, firstName: "Dueño", lastName: "Plataforma", email: "owner@x.pe", isActive: true, role: "SUPER_ADMIN", commissionPercentage: 0 },
    ], 2)
    const roles = (findInput(wrapper, "Rol").props("items") as Array<{ value: string }>).map((item) => item.value)
    expect(roles).toEqual(["SUPER_ADMIN"])
  })

  it("changePassword only asks for the new password and its confirmation", async () => {
    const wrapper = await mountForm("changePassword", [
      { id: 7, firstName: "Luis", lastName: "Ríos", email: "luis@salon.pe", isActive: true, role: "STAFF_USER", commissionPercentage: 15 },
    ], 7)
    const labels = wrapper.findAllComponents(".v-input").map((input) => String(input.props("label")))
    expect(labels).toEqual(["Contraseña", "Confirmar contraseña"])

    await fillAll(wrapper, { Contraseña: "1234567", "Confirmar contraseña": "1234567" })
    await submit(wrapper)
    expect(submitted(wrapper, "changePassword")).toHaveLength(0)

    await fillAll(wrapper, { Contraseña: "nueva-clave-9", "Confirmar contraseña": "nueva-clave-9" })
    await submit(wrapper)
    expect(submitted(wrapper, "changePassword")).toEqual([expect.objectContaining({ id: 7, password: "nueva-clave-9" })])
  })
})

describe("LoginForm", () => {
  const mountForm = () => mountSuspended(LoginForm)

  beforeEach(() => {
    loginMock.mockReset()
    successMock.mockReset()
    errorMock.mockReset()
    navigateToMock.mockReset()
  })

  const signInButton = (wrapper: Awaited<ReturnType<typeof mountForm>>) => wrapper.find("button[type='submit']")

  it("keeps the button disabled until both fields are valid", async () => {
    const wrapper = await mountForm()
    expect(signInButton(wrapper).attributes("disabled")).toBeDefined()

    await fill(wrapper, "Correo", "no-es-correo")
    await fill(wrapper, "Contraseña", "x")
    expect(signInButton(wrapper).attributes("disabled")).toBeDefined()

    await fill(wrapper, "Correo", "ana@salon.pe")
    expect(signInButton(wrapper).attributes("disabled")).toBeUndefined()
  })

  it("does not call the API when the form is invalid", async () => {
    const wrapper = await mountForm()
    await fill(wrapper, "Correo", "ana@salon.pe")
    await submit(wrapper)
    expect(loginMock).not.toHaveBeenCalled()
  })

  it("signs in with the typed credentials and goes to /app", async () => {
    vi.useFakeTimers()
    try {
      loginMock.mockResolvedValue({ user: { fullName: "Ana Paz" } })
      const wrapper = await mountForm()
      await fillAll(wrapper, { Correo: "ana@salon.pe", Contraseña: "clave-segura-1" })

      await wrapper.find("form").trigger("submit")
      await vi.advanceTimersByTimeAsync(1000)

      expect(loginMock).toHaveBeenCalledWith("ana@salon.pe", "clave-segura-1")
      expect(successMock).toHaveBeenCalledWith("Bienvenido, Ana Paz", "Inicio de sesión exitoso")
      expect(navigateToMock).toHaveBeenCalledWith("/app")
    } finally {
      vi.useRealTimers()
    }
  })

  it("shows the API's message when the credentials are wrong and lets the user try again", async () => {
    loginMock.mockRejectedValue({ data: { message: "Credenciales inválidas" } })
    const wrapper = await mountForm()
    await fillAll(wrapper, { Correo: "ana@salon.pe", Contraseña: "mala" })
    await submit(wrapper)

    expect(errorMock).toHaveBeenCalledWith("Credenciales inválidas", "Error al iniciar sesión")
    expect(navigateToMock).not.toHaveBeenCalled()
    expect(signInButton(wrapper).attributes("disabled")).toBeUndefined()
  })

  it("falls back to a generic message when the API sends none", async () => {
    loginMock.mockRejectedValue(new Error("network"))
    const wrapper = await mountForm()
    await fillAll(wrapper, { Correo: "ana@salon.pe", Contraseña: "x" })
    await submit(wrapper)
    expect(errorMock.mock.calls[0]![0]).toContain("No se pudo iniciar sesión")
  })
})
