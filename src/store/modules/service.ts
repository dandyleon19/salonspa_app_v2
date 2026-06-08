import { defineStore } from 'pinia'
import type { Service } from "~/interfaces/serviceInterfaces";

export const useServicesStore = defineStore('service', {
    state: () => ({
        list: [] as Service[],
        loading: false,
    }),

    actions: {
        async fetchServices() {
            this.loading = true
            try {
                const { $api } = useNuxtApp()
                const res: any = await $api('/api/services', {
                    method: 'GET',
                })
                this.list = res
            } catch (err) {
                console.error('Error al obtener servicios:', err)
            } finally {
                this.loading = false
            }
        },
    },
})