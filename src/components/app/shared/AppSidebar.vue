<template>
  <v-navigation-drawer
    v-model="drawerOpen"
    color="sidebar"
    class="app-sidebar transition-all duration-300"
    :rail="!isMobile && sidebarRail"
    :permanent="!isMobile"
    :temporary="isMobile"
    :width="280"
    :rail-width="72"
  >
    <div v-if="isRail" class="app-sidebar__brand-rail">
      <v-avatar size="40" rounded="lg" color="white" class="app-sidebar__logo">
        <v-img :src="logoMarite" alt="Marité Salon & Spa" contain />
      </v-avatar>
    </div>

    <v-list-item
      v-else
      class="app-sidebar__brand app-font-heading"
      :nav="false"
      :ripple="false"
      title="Marite Salon & Spa"
      subtitle="Panel de gestión"
    >
      <template #prepend>
        <v-avatar size="40" rounded="lg" color="white" class="app-sidebar__logo">
          <v-img :src="logoMarite" alt="Marité Salon & Spa" contain />
        </v-avatar>
      </template>

      <template v-if="isMobile" #append>
        <v-btn
          icon="mdi-close"
          variant="text"
          aria-label="Cerrar menú"
          @click="toggleDrawer"
        />
      </template>
    </v-list-item>

    <v-divider />

    <v-list density="compact" nav class="app-sidebar__nav">
      <v-list-item
        v-for="(item, i) in filteredItems"
        :key="i"
        :prepend-icon="item.icon"
        :title="item.title"
        :value="item.title"
        link
        :to="item.to"
        rounded="lg"
        @click="handleNavClick"
        @mouseenter="prefetchSidebarRoute(item.to)"
      />
    </v-list>

    <template v-if="!isMobile" #append>
      <v-divider />
      <v-list density="compact" nav class="app-sidebar__footer">
        <v-list-item
          :prepend-icon="sidebarRail ? 'mdi-chevron-double-right' : 'mdi-chevron-double-left'"
          :title="sidebarRail ? 'Expandir menú' : 'Contraer menú'"
          rounded="lg"
          @click.stop="toggleRail"
        />
      </v-list>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import logoMarite from "~/assets/img/logo-marite.png"
import { useAuthStore } from "~/store/modules/auth"
import { useAppLayout } from "~/composables/useAppLayout"

const authStore = useAuthStore()
const { drawerOpen, sidebarRail, isMobile, toggleDrawer, toggleRail, handleNavClick } =
  useAppLayout()

const isRail = computed(() => !isMobile.value && sidebarRail.value)

const items = [
  { title: "Dashboard", icon: "mdi-view-dashboard-outline", to: "/app" },
  { title: "Salones", icon: "mdi-spa-outline", to: "/app/salons", onlyFor: ["SUPER_ADMIN"] },
  {
    title: "Sucursales",
    icon: "mdi-source-branch",
    to: "/app/branches",
    onlyFor: ["SUPER_ADMIN", "ADMIN_USER"],
  },
  {
    title: "Usuarios",
    icon: "mdi-account-cog-outline",
    to: "/app/users",
    onlyFor: ["SUPER_ADMIN", "ADMIN_USER"],
  },
  { title: "Clientes", icon: "mdi-account-heart-outline", to: "/app/clients", onlyFor: ["ADMIN_USER"] },
  { title: "Citas", icon: "mdi-calendar-clock-outline", to: "/app/appointments" },
  {
    title: "Categorías de Servicio",
    icon: "mdi-tag-multiple-outline",
    to: "/app/service-categories",
    onlyFor: ["ADMIN_USER"],
  },
]

const filteredItems = computed(() =>
  items.filter((item) => !item.onlyFor || item.onlyFor.includes(authStore.role as string))
)

const prefetchSidebarRoute = (to: string) => {
  preloadRouteComponents(to)
}
</script>

<style scoped>
.app-sidebar__brand-rail {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
  min-height: 72px;
}

.app-sidebar__logo {
  flex-shrink: 0;
}

.app-sidebar__brand :deep(.v-list-item-subtitle) {
  opacity: 0.72;
}

.app-sidebar__nav {
  flex: 1;
}

.app-sidebar__footer {
  padding-bottom: 8px;
}

.app-sidebar :deep(.v-list-item--active) {
  background: rgba(255, 255, 255, 0.1);
}

.app-sidebar :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
}
</style>
