import { defineStore } from 'pinia'
import type { Salon } from '~/interfaces/salonInterfaces';
import type { PageResponse } from "~/interfaces/PageResponse";

export const useSalonsStore = defineStore('salons', {
    state: () => ({
        data: null as PageResponse<Salon> | null,
        loading: true,
    }),

    actions: {
        async fetchSalons(page: number = 0, size: number = 10) {
            this.loading = true
            try {
                const { $api } = useNuxtApp()
                this.data = await $api('/api/salons', {
                    method: 'GET',
                    query: {
                        page,
                        size,
                    },
                })
            } catch (err) {
                console.error('Error al obtener salones:', err)
            } finally {
                this.loading = false
            }
        },
    },
})