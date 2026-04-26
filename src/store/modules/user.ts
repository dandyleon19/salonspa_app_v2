import { defineStore } from 'pinia'
import type { User } from "~/interfaces/userInterfaces";
import type { ResponseInterface } from "~/interfaces/appInterfaces";

export const useUsersStore = defineStore('users', {
    state: () => ({
        list: [] as User[],
        loading: false,
    }),

    actions: {
        async fetchUsers() {
            this.loading = true
            try {
                const { $api } = useNuxtApp()
                const res: any = await $api('/api/users', {
                    method: 'GET',
                })
                this.list = res
            } catch (err) {
                console.error('Error al obtener usuarios:', err)
            } finally {
                this.loading = false
            }
        },
    },
})