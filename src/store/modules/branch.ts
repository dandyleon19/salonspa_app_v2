import { defineStore } from 'pinia'
import type { Branch } from "~/interfaces/salonInterfaces";
import type { PageResponse } from "~/interfaces/PageResponse";

export const useBranchesStore = defineStore('branches', {
    state: () => ({
        data: null as PageResponse<Branch> | null,
        loading: false,
    }),

    actions: {
        async fetchBranches(page: number = 0, size: number = 10) {
            this.loading = true
            try {
                const { $api } = useNuxtApp()
                this.data = await $api('/api/branches', {
                    method: 'GET',
                    query: {
                        page,
                        size,
                    },
                })
            } catch (err) {
                console.error('Error al obtener sucursales:', err)
            } finally {
                this.loading = false
            }
        },
    },
})