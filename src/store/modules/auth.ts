import { defineStore } from 'pinia'
import type { User } from "~/interfaces/userInterfaces";
import { useSubscriptionStore } from "~/store/modules/subscription"


const resolveAuthRole = (state: {
    role: string | null
    user: User | null
}) => state.role ?? state.user?.role ?? null

export const useAuthStore = defineStore('auth', {
    state: () => ({
        role: null as string | null,
        token: null as string | null,
        user: null as User | null
    }),

    getters: {
        effectiveRole: (state) => resolveAuthRole(state),
        isSuperAdmin: (state) => resolveAuthRole(state) === 'SUPER_ADMIN',
        isAdmin: (state) => resolveAuthRole(state) === 'ADMIN_USER',
        isStaff: (state) => resolveAuthRole(state) === 'STAFF_USER',
        canManageAppointments: (state) => {
            const role = resolveAuthRole(state)
            return role === 'ADMIN_USER' || role === 'SUPER_ADMIN'
        },
        canManageSales: (state) => {
            const role = resolveAuthRole(state)
            return role === 'ADMIN_USER' || role === 'SUPER_ADMIN'
        },
    },

    actions: {
        setAuth(data: any) {
            this.token = data.token

            if (!data.user) {
                this.user = null
                this.role = data.role ?? null
                return
            }

            const user = data.user
            this.user = {
                ...user,
                fullName:
                    user.fullName ||
                    [user.firstName, user.lastName].filter(Boolean).join(" ").trim(),
            }
            // The user's own role (read from the database) wins over the one in the token, which can be a day old if
            // an admin has changed the role since.
            this.role = user.role ?? data.role ?? null
        },

        logout() {
            this.role = null
            this.token = null
            this.user = null
            // The next user may belong to another salon: never reuse this one's plan.
            useSubscriptionStore().reset()
        }
    }
})