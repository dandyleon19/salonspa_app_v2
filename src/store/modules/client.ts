import { defineStore } from 'pinia'
import type { Client } from '~/interfaces/clientInterfaces';
import type { PageResponse } from "~/interfaces/PageResponse";
import { normalizeTableSearch } from "~/helpers/tableSearchHelpers"

export const useClientsStore = defineStore('clients', {
    state: () => ({
        data: null as PageResponse<Client> | null,
        loading: true,
    }),

    actions: {
        async fetchClients(page = 0, size = 10, search = "") {
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

                this.data = await $api<PageResponse<Client>>('/api/clients', {
                    method: 'GET',
                    query,
                })
            } catch (err) {
                console.error('Error al obtener clientes:', err)
            } finally {
                this.loading = false
            }
        },
    },
})