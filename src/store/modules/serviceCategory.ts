import { defineStore } from 'pinia'
import type { ServiceCategory } from "~/interfaces/serviceCategoryInterfaces";
import type { PageResponse } from "~/interfaces/PageResponse";
import { normalizeTableSearch } from "~/helpers/tableSearchHelpers"

export const useServiceCategoriesStore = defineStore('service-categories', {
    state: () => ({
        data: null as PageResponse<ServiceCategory> | null,
        loading: true,
    }),

    actions: {
        async fetchServiceCategories(page = 0, size = 10, search = "") {
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

                this.data = await $api<PageResponse<ServiceCategory>>('/api/service-categories', {
                    method: 'GET',
                    query,
                })
            } catch (err) {
                console.error('Error al obtener categorías de servicios:', err)
            } finally {
                this.loading = false
            }
        },
    },
})
