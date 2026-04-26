import { defineStore } from 'pinia'
import type { Client } from '~/interfaces/clientInterfaces';

export const useClientsStore = defineStore('clients', {
    state: () => ({
        list: [] as Client[],
        loading: false,
    }),

    actions: {
        async fetchClients() {
            this.loading = true
            try {
                const { $api } = useNuxtApp()
                const res: any = await $api('/api/clients', {
                    method: 'GET',
                })
                this.list = res
            } catch (err) {
                console.error('Error al obtener clientes:', err)
            } finally {
                this.loading = false
            }
        },
    },
})