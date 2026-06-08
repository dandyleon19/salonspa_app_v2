import { defineStore } from 'pinia'
import type { User } from "~/interfaces/userInterfaces";

export const useAuthStore = defineStore('auth', {
    state: () => ({
        role: null as string | null,
        token: null as string | null,
        user: null as User | null
    }),

    getters: {
        isSuperAdmin: (state) => state.role === 'SUPER_ADMIN',
        isAdmin: (state) => state.role === 'ADMIN_USER',
        isStaff: (state) => state.role === 'STAFF_USER',
    },

    actions: {
        setAuth(data: any) {
            this.role = data.role
            this.token = data.token

            if (!data.user) {
                this.user = null
                return
            }

            const user = data.user
            this.user = {
                ...user,
                fullName:
                    user.fullName ||
                    [user.firstName, user.lastName].filter(Boolean).join(" ").trim(),
            }
        },

        logout() {
            this.role = null
            this.token = null
            this.user = null
        }
    }
})