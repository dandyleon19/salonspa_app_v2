import { defineStore } from 'pinia'
import type { ServiceCategory } from "~/interfaces/serviceCategoryInterfaces";

export const useServiceCategoriesStore = defineStore('service-categories', {
    state: () => ({
        list: [] as ServiceCategory[],
        loading: false,
    }),

    actions: {
        async fetchServiceCategories() {
            this.loading = true
            try {
                const { $api } = useNuxtApp()
                const res: any = await $api('/api/service-categories', {
                    method: 'GET',
                })
                this.list = res
            } catch (err) {
                console.error('Error al obtener categorías de servicios:', err)
            } finally {
                this.loading = false
            }
        },
    },
})