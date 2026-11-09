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
        <div class="app-sidebar__logo-badge" :class="{ 'app-sidebar__logo-badge--salon': !!salonLogoSrc }">
          <img :src="salonLogoSrc || logoDf" :alt="brandName" class="app-sidebar__logo">
        </div>
        <span v-if="!isRail" class="app-sidebar__brand-name">{{ brandName }}</span>
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
        :append-icon="isLocked(item) ? APP_ICONS.lock : undefined"
        :title="item.title"
        :value="item.title"
        :class="{ 'app-sidebar__item--locked': isLocked(item) }"
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
import { useSubscriptionStore } from "~/store/modules/subscription"
import type { FeatureKey } from "~/interfaces/subscriptionInterfaces"
import { useAppLayout } from "~/composables/useAppLayout"
import { resolveUploadUrl } from "~/helpers/assetHelpers"
import logoDf from "~/assets/img/logo-df-icon.png"

const authStore = useAuthStore()
const subscriptionStore = useSubscriptionStore()
const { drawerOpen, sidebarRail, isMobile, toggleDrawer, handleNavClick } = useAppLayout()

const isRail = computed(() => !isMobile.value && sidebarRail.value)

const salonName = computed(() => authStore.user?.salonName || "Mi spa")
const salonLogoSrc = computed(() => resolveUploadUrl(authStore.user?.salonLogoUrl))
// A salon that uploaded its own logo sees it (with its name); otherwise the product brand, like the other DF systems.
const brandName = computed(() => (salonLogoSrc.value ? salonName.value : "DF SalonSpa"))
const canManageSalonSettings = computed(() => authStore.role === "ADMIN_USER")

const SALON_ROLES = ["ADMIN_USER", "STAFF_USER"]

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
  // The platform owner (SUPER_ADMIN) does not work inside a salon: appointments, sales and reports are the salon's own.
  { title: "Citas", icon: APP_ICONS.appointments, to: "/app/appointments", onlyFor: SALON_ROLES },
  { title: "Ventas", icon: APP_ICONS.sales, to: "/app/sales", onlyFor: SALON_ROLES },
  {
    title: "Reportes",
    icon: APP_ICONS.reports,
    to: "/app/reports",
    onlyFor: SALON_ROLES,
    feature: "reports" as FeatureKey,
  },
  {
    title: "Categorías de Servicio",
    icon: APP_ICONS.serviceCategories,
    to: "/app/service-categories",
    onlyFor: ["ADMIN_USER"],
  },
  {
    title: "Categorías de Producto",
    icon: APP_ICONS.package,
    to: "/app/product-categories",
    onlyFor: ["ADMIN_USER"],
    feature: "products" as FeatureKey,
  },
]

// A feature the salon's plan does not include stays in the menu with a lock: clicking it explains why.
const isLocked = (item: { feature?: FeatureKey }) =>
  !!item.feature && !authStore.isSuperAdmin && !subscriptionStore.hasFeature(item.feature)

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
  padding: 10px 12px;
  min-height: 72px;
}

.app-sidebar__brand--spread {
  justify-content: space-between;
}

.app-sidebar__logo-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 100%;
  overflow: hidden;
}

/* The brand icon is already a rounded colour tile with transparent corners: shown as is, no frame around it. */
.app-sidebar__logo-badge {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
}

/* A logo uploaded by the salon is not a tile, so it gets a light rounded frame. */
.app-sidebar__logo-badge--salon {
  padding: 4px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.94);
}

.app-sidebar__logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.app-sidebar__brand-name {
  font-family: var(--font-heading);
  font-size: 1.05rem;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.app-sidebar :deep(.v-list-item) {
  min-height: 42px;
  margin-bottom: 3px;
  color: rgba(255, 255, 255, 0.78);
}

.app-sidebar :deep(.v-list-item:hover) {
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
}

.app-sidebar :deep(.v-list-item-title) {
  font-size: 0.875rem;
  font-weight: 500;
}

/* Current page: papaya tint, a papaya bar on the left edge, white text and an orange icon (7.8:1 on black). */
.app-sidebar :deep(.v-list-item--active) {
  background: linear-gradient(90deg, rgba(var(--v-theme-primary), 0.26) 0%, rgba(255, 255, 255, 0.03) 100%);
  box-shadow: inset 3px 0 0 rgb(var(--v-theme-primary));
  color: #fff;
}

.app-sidebar :deep(.v-list-item--active .v-list-item-title) {
  font-weight: 600;
}

.app-sidebar :deep(.v-list-item--active .v-list-item__prepend > .v-icon) {
  color: rgb(var(--v-theme-primary));
}

.app-sidebar :deep(.v-list-item__overlay) {
  display: none;
}

.app-sidebar :deep(.v-divider) {
  border-color: rgba(255, 255, 255, 0.08);
  opacity: 1;
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

.app-sidebar__item--locked :deep(.v-list-item-title),
.app-sidebar__item--locked :deep(.v-list-item__prepend) {
  opacity: 0.68;
}
</style>
