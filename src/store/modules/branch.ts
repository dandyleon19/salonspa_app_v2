import { defineStore } from 'pinia'
import type { Branch } from "~/interfaces/salonInterfaces";

export const useBranchesStore = defineStore('branches', {
    state: () => ({
        list: [] as Branch[],
        loading: false,
    }),

    actions: {
        async fetchBranches() {
            this.loading = true
            try {
                const { $api } = useNuxtApp()
                const res: any = await $api('/api/branches', {
                    method: 'GET',
                })
                this.list = res
            } catch (err) {
                console.error('Error al obtener sucursales:', err)
            } finally {
                this.loading = false
            }
        },
    },
})