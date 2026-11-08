import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import RemoteSelect from "~/components/app/shared/RemoteSelect.vue"
import InfiniteSentinel from "~/components/app/shared/InfiniteSentinel.vue"
import { recordQueryEndpoint } from "../utils/endpoints"

// 150 clients: the first 20 come in the first page, the rest can only be found by searching.
const everyone = Array.from({ length: 150 }, (_, index) => ({
  id: index + 1,
  firstName: index === 149 ? "Zoe" : `Cliente${index + 1}`,
  lastName: index === 149 ? "Zeta" : "Prueba",
  salonId: 1,
}))

const list = recordQueryEndpoint("/api/clients", (query) => {
  const term = (query.search ?? "").toLowerCase()
  const matches = term ? everyone.filter((item) => `${item.firstName} ${item.lastName}`.toLowerCase().includes(term)) : everyone
  const size = Number(query.size ?? 20)
  const page = Number(query.page ?? 0)
  return {
    content: matches.slice(page * size, (page + 1) * size),
    page,
    size,
    totalElements: matches.length,
    totalPages: Math.max(1, Math.ceil(matches.length / size)),
  }
})
const byId = recordQueryEndpoint("/api/clients/150", () => everyone[149])
const users = recordQueryEndpoint("/api/users", () => ({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }))
const ownUser = recordQueryEndpoint("/api/users/9", () => ({ id: 9, firstName: "Ana", lastName: "Paz", fullName: "Ana Paz" }))

beforeEach(() => {
  list.reset()
  byId.reset()
  users.reset()
  ownUser.reset()
})

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** The requests go through the mocked server, which answers a few milliseconds later. */
const settle = async () => {
  await wait(150)
  await flushPromises()
}

const mountPicker = (props: Record<string, unknown> = {}) =>
  mountSuspended(RemoteSelect, { props: { modelValue: null, kind: "client", label: "Cliente", ...props } })

const optionTitles = (wrapper: Awaited<ReturnType<typeof mountPicker>>) =>
  (wrapper.findComponent({ name: "VAutocomplete" }).props("items") as Array<{ title: string }>).map((item) => item.title)

describe("RemoteSelect (clients and professionals searched on the server)", () => {
  it("shows the first page of results when it opens, not every record", async () => {
    const wrapper = await mountPicker()
    await settle()
    expect(list.queries[0]).toMatchObject({ page: "0", size: "20" })
    expect(list.queries[0]).not.toHaveProperty("search")
    expect(optionTitles(wrapper)).toHaveLength(20)
    expect(optionTitles(wrapper)).not.toContain("Zoe Zeta")
  })

  it("finds a record that is not in the first page by searching for it", async () => {
    const wrapper = await mountPicker()
    await flushPromises()

    wrapper.findComponent({ name: "VAutocomplete" }).vm.$emit("update:search", "zeta")
    await wait(450)
    await flushPromises()

    expect(list.queries.at(-1)).toMatchObject({ search: "zeta" })
    expect(optionTitles(wrapper)).toEqual(["Zoe Zeta"])
  })

  it("searches only after the user stops typing", async () => {
    const wrapper = await mountPicker()
    await flushPromises()
    list.reset()

    const input = wrapper.findComponent({ name: "VAutocomplete" })
    input.vm.$emit("update:search", "z")
    input.vm.$emit("update:search", "ze")
    input.vm.$emit("update:search", "zet")
    await wait(450)
    await flushPromises()

    expect(list.queries).toHaveLength(1)
    expect(list.queries[0]).toMatchObject({ search: "zet" })
  })

  describe("scrolling down", () => {
    it("loads the next 20 each time the end of the list is reached, until there are no more", async () => {
      const wrapper = await mountPicker()
      await settle()
      expect(optionTitles(wrapper)).toHaveLength(20)

      const picker = wrapper.vm as unknown as { loadMore: () => Promise<void> }
      await picker.loadMore()
      await settle()
      expect(list.queries.at(-1)).toMatchObject({ page: "1", size: "20" })
      expect(optionTitles(wrapper)).toHaveLength(40)
      expect(optionTitles(wrapper)[20]).toBe("Cliente21 Prueba")

      for (let page = 2; page < 8; page++) {
        await picker.loadMore()
        await settle()
      }
      expect(optionTitles(wrapper)).toHaveLength(150)
      expect(new Set(optionTitles(wrapper)).size).toBe(150)

      // Nothing left: asking again sends no request.
      const requests = list.queries.length
      await picker.loadMore()
      await settle()
      expect(list.queries).toHaveLength(requests)
    })

    it("keeps scrolling inside the same search", async () => {
      const wrapper = await mountPicker()
      await settle()

      wrapper.findComponent({ name: "VAutocomplete" }).vm.$emit("update:search", "cliente1")
      await wait(450)
      await flushPromises()
      const firstPage = optionTitles(wrapper).length
      expect(firstPage).toBe(20)

      await (wrapper.vm as unknown as { loadMore: () => Promise<void> }).loadMore()
      await settle()
      expect(list.queries.at(-1)).toMatchObject({ search: "cliente1", page: "1" })
      expect(optionTitles(wrapper).length).toBeGreaterThan(firstPage)
      expect(optionTitles(wrapper).every((title) => title.toLowerCase().includes("cliente1"))).toBe(true)
    })

    it("does not ask for more when the search fits in one page", async () => {
      const wrapper = await mountPicker()
      await settle()
      wrapper.findComponent({ name: "VAutocomplete" }).vm.$emit("update:search", "zeta")
      await wait(450)
      await flushPromises()

      const requests = list.queries.length
      await (wrapper.vm as unknown as { loadMore: () => Promise<void> }).loadMore()
      await settle()
      expect(list.queries).toHaveLength(requests)
    })
  })

  describe("the end-of-list marker", () => {
    const original = globalThis.IntersectionObserver
    afterEach(() => {
      globalThis.IntersectionObserver = original
    })

    it("says 'visible' when it scrolls into view, and not while it is out of view", async () => {
      let notify: ((entries: Array<{ isIntersecting: boolean }>) => void) | null = null
      const observe = vi.fn()
      const disconnect = vi.fn()
      globalThis.IntersectionObserver = class {
        constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
          notify = callback
        }
        observe = observe
        disconnect = disconnect
      } as unknown as typeof IntersectionObserver

      const wrapper = await mountSuspended(InfiniteSentinel)
      expect(observe).toHaveBeenCalled()

      notify!([{ isIntersecting: false }])
      expect(wrapper.emitted("visible")).toBeUndefined()

      notify!([{ isIntersecting: true }])
      expect(wrapper.emitted("visible")).toHaveLength(1)

      wrapper.unmount()
      expect(disconnect).toHaveBeenCalled()
    })
  })

  it("picking a record updates v-model", async () => {
    const wrapper = await mountPicker()
    await flushPromises()
    wrapper.findComponent({ name: "VAutocomplete" }).vm.$emit("update:modelValue", 3)
    expect(wrapper.emitted("update:modelValue")).toEqual([[3]])
  })

  it("an id set from code (an appointment being edited) is asked to the server and handed to the parent", async () => {
    const wrapper = await mountPicker({ modelValue: 150 })
    await settle()

    expect(byId.queries).toHaveLength(1)
    expect(wrapper.emitted("select")?.at(-1)?.[0]).toMatchObject({ id: 150, firstName: "Zoe", salonId: 1 })
    expect(optionTitles(wrapper)).toContain("Zoe Zeta")
  })

  it("emits null when the choice is cleared", async () => {
    const wrapper = await mountPicker({ modelValue: 150 })
    await flushPromises()
    await wrapper.setProps({ modelValue: null })
    await flushPromises()
    expect(wrapper.emitted("select")?.at(-1)).toEqual([null])
  })

  it("a disabled picker lists nothing but still shows the record it holds", async () => {
    const wrapper = await mountPicker({ kind: "user", label: "Trabajador", modelValue: 9, disabled: true })
    await settle()

    expect(users.queries).toHaveLength(0)
    expect(ownUser.queries).toHaveLength(1)
    expect(optionTitles(wrapper)).toEqual(["Ana Paz"])
    expect(wrapper.emitted("select")?.at(-1)?.[0]).toMatchObject({ id: 9 })
  })

  it("uses the validation rules it is given", async () => {
    const wrapper = await mountPicker({ rules: [(value: unknown) => !!value || "Este campo es requerido"] })
    await flushPromises()
    expect(wrapper.findComponent({ name: "VAutocomplete" }).props("rules")).toHaveLength(1)
  })
})
