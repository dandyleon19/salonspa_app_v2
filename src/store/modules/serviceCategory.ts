import { defineStore } from 'pinia'
import type { ServiceCategory } from "~/interfaces/serviceCategoryInterfaces";
import type { PageResponse } from "~/interfaces/PageResponse";

export const useServiceCategoriesStore = defineStore('service-categories', {
    state: () => ({
        data: null as PageResponse<ServiceCategory> | null,
        loading: false,
    }),

    actions: {
        async fetchServiceCategories(page = 0, size = 10) {
            this.loading = true
            try {
                const { $api } = useNuxtApp()
                this.data = await $api<PageResponse<ServiceCategory>>('/api/service-categories', {
                    method: 'GET',
                    query: {
                        page,
                        size,
                    },
                })
            } catch (err) {
                console.error('Error al obtener categorías de servicios:', err)
            } finally {
                this.loading = false
            }
        },
    },
})
