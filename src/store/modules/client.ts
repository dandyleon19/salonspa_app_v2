import { defineStore } from 'pinia'
import type { Client } from '~/interfaces/clientInterfaces';
import type { PageResponse } from "~/interfaces/PageResponse";

export const useClientsStore = defineStore('clients', {
    state: () => ({
        data: null as PageResponse<Client> | null,
        loading: false,
    }),

    actions: {
        async fetchClients(page = 0, size = 10) {
            this.loading = true
            try {
                const { $api } = useNuxtApp()
                this.data = await $api<PageResponse<Client>>('/api/clients', {
                    method: 'GET',
                    query: {
                        page,
                        size,
                    },
                })
            } catch (err) {
                console.error('Error al obtener clientes:', err)
            } finally {
                this.loading = false
            }
        },
    },
})