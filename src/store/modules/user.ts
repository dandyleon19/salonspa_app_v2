import { defineStore } from 'pinia'
import type { User } from "~/interfaces/userInterfaces";
import type { PageResponse } from '~/interfaces/PageResponse';

export const useUsersStore = defineStore('users', {
    state: () => ({
        data: null as PageResponse<User> | null,
        loading: false,
    }),

    actions: {
        async fetchUsers(page = 0, size = 10) {
            this.loading = true
            try {
                const { $api } = useNuxtApp()
                this.data = await $api<PageResponse<User>>('/api/users', {
                    method: 'GET',
                    query: {
                        page,
                        size,
                    },
                })
            } catch (err) {
                console.error('Error al obtener usuarios:', err)
            } finally {
                this.loading = false
            }
        },
    },
})