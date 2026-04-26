import { defineStore } from 'pinia'
import type { Salon } from '~/interfaces/salonInterfaces';

export const useSalonsStore = defineStore('salons', {
    state: () => ({
        list: [] as Salon[],
        loading: false,
    }),

    actions: {
        async fetchSalons() {
            this.loading = true
            try {
                const { $api } = useNuxtApp()
                const res: any = await $api('/api/salons', {
                    method: 'GET',
                })
                this.list = res
            } catch (err) {
                console.error('Error al obtener salones:', err)
            } finally {
                this.loading = false
            }
        },
    },
})