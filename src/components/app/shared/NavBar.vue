<template>
    <v-app-bar color="navbar" :elevation="2" rounded>
        <template v-slot:prepend>
            <v-app-bar-nav-icon></v-app-bar-nav-icon>
        </template>

        <v-app-bar-title>Marite Salon & Spa</v-app-bar-title>

        <template v-slot:append>
            <v-menu location="bottom end" offset="8">
                <template #activator="{ props }">
                    <v-btn
                        v-bind="props"
                        variant="text"
                        class="text-white text-none"
                    >
                        <v-avatar size="32" color="white" class="mr-2">
                            <span class="text-primary text-caption font-weight-bold">
                                {{ userInitials }}
                            </span>
                        </v-avatar>
                        <span v-if="userName" class="d-none d-sm-inline">{{ userName }}</span>
                        <v-icon end>mdi-chevron-down</v-icon>
                    </v-btn>
                </template>

                <v-list min-width="220" rounded="lg">
                    <v-list-item>
                        <v-list-item-title class="font-weight-medium">
                            {{ userName }}
                        </v-list-item-title>
                        <v-list-item-subtitle>{{ userEmail }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-divider class="my-1" />

                    <v-list-item
                        prepend-icon="mdi-logout"
                        title="Cerrar sesión"
                        @click="handleLogout"
                    />
                </v-list>
            </v-menu>
        </template>
    </v-app-bar>
</template>

<script setup lang="ts">
import { useAuthStore } from "~/store/modules/auth"

const authStore = useAuthStore()
const { logout } = useAuth()

const userName = computed(() => {
    const user = authStore.user
    if (!user) return ""

    return (
        user.fullName ||
        [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
        user.email ||
        ""
    )
})

const userEmail = computed(() => authStore.user?.email ?? "")

const userInitials = computed(() => {
    const user = authStore.user
    if (!user) return "?"

    const first = user.firstName?.charAt(0) ?? ""
    const last = user.lastName?.charAt(0) ?? ""
    const initials = `${first}${last}`.toUpperCase()

    if (initials) return initials

    return user.email?.charAt(0).toUpperCase() ?? "?"
})

const handleLogout = async () => {
    await logout()
}
</script>
