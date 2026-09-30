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
    <div class="app-sidebar__brand" :class="{ 'app-sidebar__brand--spread': !isRail && isMobile }">
      <div class="app-sidebar__logo-wrap">
        <img
          v-if="salonLogoSrc"
          :src="salonLogoSrc"
          :alt="salonName"
          class="app-sidebar__logo"
        >
        <div v-else class="app-sidebar__logo-placeholder">
          <v-icon size="24">{{ APP_ICONS.store }}</v-icon>
        </div>
      </div>

      <v-btn
        v-if="!isRail && isMobile"
        :icon="APP_ICONS.close"
        variant="text"
        aria-label="Cerrar menú"
        @click="toggleDrawer"
      />
    </div>

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

    <template v-if="canManageSalonSettings">
      <v-divider />
      <v-list density="compact" nav class="app-sidebar__footer">
        <v-list-item
          :prepend-icon="APP_ICONS.settings"
          title="Configuración"
          value="Configuración"
          link
          to="/app/settings"
          rounded="lg"
          @click="handleNavClick"
          @mouseenter="prefetchSidebarRoute('/app/settings')"
        />
      </v-list>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { APP_ICONS } from "~/constants/appIcons"
import { useAuthStore } from "~/store/modules/auth"
import { useAppLayout } from "~/composables/useAppLayout"
import { resolveUploadUrl } from "~/helpers/assetHelpers"

const authStore = useAuthStore()
const { drawerOpen, sidebarRail, isMobile, toggleDrawer, handleNavClick } = useAppLayout()

const isRail = computed(() => !isMobile.value && sidebarRail.value)

const salonName = computed(() => authStore.user?.salonName || "Mi spa")
const salonLogoSrc = computed(() => resolveUploadUrl(authStore.user?.salonLogoUrl))
const canManageSalonSettings = computed(() => authStore.role === "ADMIN_USER")

const items = [
  { title: "Dashboard", icon: APP_ICONS.dashboard, to: "/app" },
  { title: "Salones", icon: APP_ICONS.salons, to: "/app/salons", onlyFor: ["SUPER_ADMIN"] },
  {
    title: "Sucursales",
    icon: APP_ICONS.branches,
    to: "/app/branches",
    onlyFor: ["SUPER_ADMIN", "ADMIN_USER"],
  },
  {
    title: "Usuarios",
    icon: APP_ICONS.users,
    to: "/app/users",
    onlyFor: ["SUPER_ADMIN", "ADMIN_USER"],
  },
  { title: "Clientes", icon: APP_ICONS.clients, to: "/app/clients", onlyFor: ["ADMIN_USER"] },
  { title: "Citas", icon: APP_ICONS.appointments, to: "/app/appointments" },
  { title: "Ventas", icon: APP_ICONS.sales, to: "/app/sales" },
  { title: "Reportes", icon: APP_ICONS.reports, to: "/app/reports" },
  {
    title: "Categorías de Servicio",
    icon: APP_ICONS.serviceCategories,
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
.app-sidebar__brand {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  min-height: 72px;
}

.app-sidebar__brand--spread {
  justify-content: space-between;
}

.app-sidebar__logo-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  overflow: hidden;
}

.app-sidebar__logo {
  height: 48px;
  max-height: 100%;
  width: auto;
  max-width: 100%;
  object-fit: contain;
}

.app-sidebar__logo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.75);
}

.app-sidebar__nav {
  flex: 1;
}

.app-sidebar__footer {
  flex: 0 0 auto;
  padding-bottom: 8px;
}

.app-sidebar__footer :deep(.v-list-item-title) {
  opacity: 0.82;
}

.app-sidebar :deep(.v-list-item--active) {
  background: rgba(255, 255, 255, 0.1);
}

.app-sidebar :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
}

.app-sidebar :deep(.v-list-item__prepend > .v-icon) {
  color: rgba(255, 255, 255, 0.82);
  opacity: 1;
  margin-inline-end: 8px;
}
</style>
