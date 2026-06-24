import { defineStore } from 'pinia'
import type { Service } from "~/interfaces/serviceInterfaces"
import type { PageResponse } from "~/interfaces/PageResponse"

function normalizeServicesResponse(res: unknown): Service[] {
    if (Array.isArray(res)) {
        return res
    }

    if (res && typeof res === "object" && "content" in res) {
        return (res as PageResponse<Service>).content ?? []
    }

    return []
}

export const useServicesStore = defineStore('service', {
    state: () => ({
        list: [] as Service[],
        loading: false,
    }),

    getters: {
        services: (state): Service[] => normalizeServicesResponse(state.list),
    },

    actions: {
        async fetchServices(page = 0, size = 100) {
            this.loading = true
            try {
                const { $api } = useNuxtApp()
                const res = await $api<Service[] | PageResponse<Service>>('/api/services', {
                    method: 'GET',
                    query: { page, size },
                })
                this.list = normalizeServicesResponse(res)
            } catch (err) {
                console.error('Error al obtener servicios:', err)
                this.list = []
            } finally {
                this.loading = false
            }
        },
    },
})