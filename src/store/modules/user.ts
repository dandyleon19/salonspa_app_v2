import { defineStore } from 'pinia'
import type { UpdateUserRequest, User, UserFilters } from "~/interfaces/userInterfaces";
import type { PageResponse } from '~/interfaces/PageResponse';
import { normalizeTableSearch } from "~/helpers/tableSearchHelpers"

export const useUsersStore = defineStore('users', {
    state: () => ({
        data: null as PageResponse<User> | null,
        loading: true,
    }),

    actions: {
        async fetchUsers(page = 0, size = 10, filters: UserFilters = {}) {
            this.loading = true
            try {
                const { $api } = useNuxtApp()
                const query: Record<string, number | string | boolean> = {
                    page,
                    size,
                }

                if (filters.isActive !== undefined) {
                    query.isActive = filters.isActive
                }

  if (filters.role) {
    query.role = filters.role
  }

  if (filters.search) {
    query.search = normalizeTableSearch(filters.search)
  }

                this.data = await $api<PageResponse<User>>('/api/users', {
                    method: 'GET',
                    query,
                })
            } catch (err) {
                console.error('Error al obtener usuarios:', err)
            } finally {
                this.loading = false
            }
        },

        async updateUser(id: number | string, payload: UpdateUserRequest) {
            const { $api } = useNuxtApp()
            await $api(`/api/users/${id}`, {
                method: "PUT",
                body: payload,
            })
        },
    },
})