import { defineStore } from 'pinia'
import type { Branch } from "~/interfaces/salonInterfaces";
import type { PageResponse } from "~/interfaces/PageResponse";
import { normalizeTableSearch } from "~/helpers/tableSearchHelpers"

export const useBranchesStore = defineStore('branches', {
    state: () => ({
        data: null as PageResponse<Branch> | null,
        loading: true,
    }),

    actions: {
        async fetchBranches(page: number = 0, size: number = 10, search = "") {
            this.loading = true
            try {
                const { $api } = useNuxtApp()
                const query: Record<string, number | string> = {
                    page,
                    size,
                }

                const normalizedSearch = normalizeTableSearch(search)
                if (normalizedSearch) {
                    query.search = normalizedSearch
                }

                this.data = await $api('/api/branches', {
                    method: 'GET',
                    query,
                })
            } catch (err) {
                console.error('Error al obtener sucursales:', err)
            } finally {
                this.loading = false
            }
        },
    },
})