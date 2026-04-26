<template>
    <v-app>
        <v-navigation-drawer color="sidebar" v-model="drawer" :rail="rail" permanent @click="rail = false"
            class="transition-all duration-300">
            <!-- Header -->
            <v-list-item prepend-avatar="https://cdn.vuetifyjs.com/images/logos/logo.svg" title="Marite Salon & Spa">
                <template #append>
                    <v-btn variant="text" icon="mdi-chevron-left" @click.stop="rail = !rail" />
                </template>
            </v-list-item>

            <v-divider />

            <!-- Menú -->
            <v-list density="compact" nav>
                <v-list-item v-for="(item, i) in items" :key="i" :prepend-icon="item.icon" :title="item.title"
                    :value="item.title" link :to="item.to" />
            </v-list>
        </v-navigation-drawer>

        <v-main>
            <NavBar />
            <v-container>
                <slot />
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { ref } from "vue";
import NavBar from "~/components/app/shared/NavBar.vue";

const drawer = ref<boolean>(true);
const rail = ref<boolean>(false);

const items = [
    { title: "Dashboard", icon: "mdi-view-dashboard", to: "/app" },
    { title: "Salones", icon: "mdi-domain", to: "/app/salons" },
    { title: "Sucursales", icon: "mdi-account-cog", to: "/app/branches" },
    { title: "Usuarios", icon: "mdi-account-cog", to: "/app/users" },
    { title: "Clientes", icon: "mdi-account", to: "/app/clients" },
    { title: "Historiales Clínicos", icon: "mdi-folder-heart-outline", to: "/app/clinical-records" },
    /*{ title: "Reportes", icon: "mdi-file-chart", to: "/app/reports" },
    { title: "Ajustes", icon: "mdi-cog", to: "/app/settings" },*/
];
</script>
