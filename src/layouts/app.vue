<template>
  <v-app>
    <v-navigation-drawer color="sidebar" v-model="drawer" :rail="rail" permanent @click="rail = false"
                         class="transition-all duration-300">
      <!-- Header -->
        <v-list-item
            prepend-avatar="https://cdn.vuetifyjs.com/images/logos/logo.svg"
            title="Marite Salon & Spa"
            class="app-font-heading"
        >
        <template #append>
          <v-btn variant="text" icon="mdi-chevron-left" @click.stop="rail = !rail"/>
        </template>
      </v-list-item>

      <v-divider/>

      <!-- Menú -->
      <v-list density="compact" nav>
        <v-list-item
            v-for="(item, i) in filteredItems"
            :key="i"
            :prepend-icon="item.icon"
            :title="item.title"
            :value="item.title"
            link
            :to="item.to"
        />
      </v-list>
    </v-navigation-drawer>

    <v-main class="app-layout-main">
      <NavBar/>
      <v-container class="app-layout-container" fluid>
        <slot/>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from "vue";
import NavBar from "~/components/app/shared/NavBar.vue";
import { useAuthStore } from "~/store/modules/auth";

const drawer = ref<boolean>(true);
const rail = ref<boolean>(false);

const authStore = useAuthStore()

const items = [
  {title: "Dashboard", icon: "mdi-view-dashboard", to: "/app"},
  {title: "Salones", icon: "mdi-domain", to: "/app/salons", onlyFor: ["SUPER_ADMIN"]},
  {title: "Sucursales", icon: "mdi-account-cog", to: "/app/branches", onlyFor: ["SUPER_ADMIN", "ADMIN_USER"]},
  {title: "Usuarios", icon: "mdi-account-cog", to: "/app/users", onlyFor: ["SUPER_ADMIN", "ADMIN_USER"]},
  {title: "Clientes", icon: "mdi-account", to: "/app/clients", onlyFor: ["ADMIN_USER"]},
  {title: "Citas", icon: "mdi-calendar-clock", to: "/app/appointments"},
  {title: "Categorías de Servicio", icon: "mdi-account", to: "/app/service-categories", onlyFor: ["ADMIN_USER"]},
  /*{ title: "Historiales Clínicos", icon: "mdi-folder-heart-outline", to: "/app/clinical-records" },
  { title: "Reportes", icon: "mdi-file-chart", to: "/app/reports" },
  { title: "Ajustes", icon: "mdi-cog", to: "/app/settings" },*/
];

const filteredItems = computed(() => {
  return items.filter(item => {
    if (!item.onlyFor) {
      return true
    }
    return item.onlyFor.includes(authStore.role as string)
  })
})
</script>

<style scoped>
.app-layout-main {
  background: rgb(var(--v-theme-surface));
}

.app-layout-container {
  width: 100%;
  padding-top: 8px;
  padding-bottom: 24px;
}
</style>
