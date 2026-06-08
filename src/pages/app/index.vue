<template>
  <div class="dashboard">
    <v-card class="dashboard__welcome mb-4" rounded="xl" elevation="0">
      <v-card-text class="pa-5 pa-md-6">
        <div class="d-flex align-center justify-space-between flex-wrap ga-4">
          <div class="d-flex align-center ga-4">
            <v-avatar size="64" color="primary" class="dashboard__avatar">
              <span class="text-h6 font-weight-bold text-white">
                {{ userInitials }}
              </span>
            </v-avatar>

            <div>
              <p class="text-overline text-medium-emphasis mb-1">
                {{ roleLabel }}
              </p>
              <h1 class="text-h5 text-md-h4 font-weight-bold mb-1">
                Bienvenida, {{ userName }}
              </h1>
              <p v-if="salonName" class="text-body-2 text-medium-emphasis mb-0">
                {{ salonName }}
              </p>
              <p class="text-caption text-medium-emphasis mt-2 mb-0">
                {{ currentDate }}
              </p>
            </div>
          </div>

          <!-- <v-chip
            v-if="commissionLabel"
            color="primary"
            variant="tonal"
            prepend-icon="mdi-percent"
          >
            {{ commissionLabel }}
          </v-chip> -->
        </div>
      </v-card-text>
    </v-card>

    <v-row class="mb-4">
      <v-col
        v-for="stat in visibleStats"
        :key="stat.key"
        cols="12"
        sm="6"
        :lg="statCols"
      >
        <DashboardStatCard
          :label="stat.label"
          :value="stat.value"
          :icon="stat.icon"
          :color="stat.color"
          :loading="loading"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="7">
        <v-row>
          <v-col v-if="showClientsSection" cols="12" md="6">
            <v-card class="dashboard__panel" rounded="xl" elevation="0">
              <v-card-title class="d-flex align-center justify-space-between py-4 px-5">
                <div>
                  <p class="text-subtitle-1 font-weight-bold mb-0">Últimos clientes</p>
                  <p class="text-caption text-medium-emphasis mb-0">Registros recientes</p>
                </div>
                <v-btn
                  v-if="authStore.isAdmin"
                  to="/app/clients"
                  variant="text"
                  color="primary"
                  size="small"
                >
                  Ver todos
                </v-btn>
              </v-card-title>
              <v-divider />
              <v-card-text class="pa-0">
                <v-skeleton-loader v-if="loading" type="list-item-three-line@3" class="pa-4" />
                <div v-else-if="!recentClients.length" class="dashboard__empty pa-6">
                  <p class="text-body-2 text-medium-emphasis mb-0">No hay clientes registrados</p>
                </div>
                <v-list v-else lines="two" class="py-0">
                  <v-list-item
                    v-for="client in recentClients"
                    :key="client.id"
                    :to="`/app/clients/${client.id}/clinical-records`"
                    rounded="lg"
                    class="mx-2 my-1"
                  >
                    <template #prepend>
                      <v-avatar color="primary" variant="tonal" size="36">
                        <span class="text-caption font-weight-bold">
                          {{ getClientInitials(client) }}
                        </span>
                      </v-avatar>
                    </template>
                    <v-list-item-title class="font-weight-medium">
                      {{ client.firstName }} {{ client.lastName }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      {{ client.email || client.phone || "Sin contacto" }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col v-if="showClinicalSection" cols="12" :md="showClientsSection ? 6 : 12">
            <v-card class="dashboard__panel" rounded="xl" elevation="0">
              <v-card-title class="py-4 px-5">
                <p class="text-subtitle-1 font-weight-bold mb-0">Historiales recientes</p>
                <p class="text-caption text-medium-emphasis mb-0">Últimas sesiones clínicas</p>
              </v-card-title>
              <v-divider />
              <v-card-text class="pa-4">
                <v-skeleton-loader v-if="loading" type="list-item-two-line@3" />
                <div v-else-if="!recentClinicalRecords.length" class="dashboard__empty">
                  <p class="text-body-2 text-medium-emphasis mb-0">No hay historiales registrados</p>
                </div>
                <div v-else class="d-flex flex-column ga-2">
                  <v-card
                    v-for="record in recentClinicalRecords"
                    :key="record.id"
                    class="dashboard__record-item pa-3"
                    variant="flat"
                    rounded="lg"
                  >
                    <p class="text-caption text-medium-emphasis mb-1">
                      {{ formatDate(record.sessionDate) }}
                    </p>
                    <p class="text-body-2 font-weight-medium mb-2">
                      {{ record.diagnosis || "Sin diagnóstico" }}
                    </p>
                    <div class="d-flex flex-wrap ga-2">
                      <v-chip size="x-small" variant="tonal" prepend-icon="mdi-account-outline">
                        {{ record.userName || "—" }}
                      </v-chip>
                      <v-chip size="x-small" variant="tonal" prepend-icon="mdi-store-outline">
                        {{ record.branchName || "—" }}
                      </v-chip>
                    </div>
                  </v-card>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <v-col cols="12" lg="5">
        <!-- <v-card class="dashboard__panel mb-4" rounded="xl" elevation="0">
          <v-card-title class="py-4 px-5">
            <p class="text-subtitle-1 font-weight-bold mb-0">Accesos rápidos</p>
            <p class="text-caption text-medium-emphasis mb-0">Ir directo a cada módulo</p>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4">
            <v-row dense>
              <v-col
                v-for="action in quickActions"
                :key="action.to"
                cols="6"
              >
                <v-card
                  :to="action.to"
                  class="dashboard__quick-action pa-4 text-center"
                  variant="flat"
                  rounded="lg"
                >
                  <v-avatar :color="action.color" variant="tonal" size="40" class="mb-2">
                    <v-icon :icon="action.icon" size="20" />
                  </v-avatar>
                  <p class="text-body-2 font-weight-medium mb-0">{{ action.title }}</p>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card> -->

        <v-card
          v-if="showCategoriesSection"
          class="dashboard__panel"
          rounded="xl"
          elevation="0"
        >
          <v-card-title class="d-flex align-center justify-space-between py-4 px-5">
            <div>
              <p class="text-subtitle-1 font-weight-bold mb-0">Categorías de servicio</p>
              <p class="text-caption text-medium-emphasis mb-0">Catálogo del salón</p>
            </div>
            <v-btn to="/app/service-categories" variant="text" color="primary" size="small">
              Ver todas
            </v-btn>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-0">
            <v-skeleton-loader v-if="loading" type="list-item-two-line@3" class="pa-4" />
            <div v-else-if="!serviceCategories.length" class="dashboard__empty pa-6">
              <p class="text-body-2 text-medium-emphasis mb-0">No hay categorías registradas</p>
            </div>
            <v-list v-else lines="two" class="py-0">
              <v-list-item
                v-for="category in serviceCategoriesPreview"
                :key="category.id"
                rounded="lg"
                class="mx-2 my-1"
              >
                <template #prepend>
                  <v-avatar color="primary" variant="tonal" size="36">
                    <v-icon size="18">mdi-spa-outline</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-medium">
                  {{ category.name }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ category.services?.length ?? 0 }} servicio{{ (category.services?.length ?? 0) === 1 ? "" : "s" }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import type { PageResponse } from "~/interfaces/PageResponse"
import type { Client } from "~/interfaces/clientInterfaces"
import type { ClinicalRecord } from "~/interfaces/clinicalRecordInterfaces"
import type { ServiceCategory } from "~/interfaces/serviceCategoryInterfaces"
import { useAuthStore } from "~/store/modules/auth"

definePageMeta({
  layout: "app",
})

const authStore = useAuthStore()

const loading = ref(true)
const totals = ref({
  salons: 0,
  branches: 0,
  users: 0,
  clients: 0,
  categories: 0,
  clinicalRecords: 0,
})

const recentClients = ref<Client[]>([])
const recentClinicalRecords = ref<ClinicalRecord[]>([])
const serviceCategories = ref<ServiceCategory[]>([])

const userName = computed(() =>
  authStore.user?.fullName ||
  [authStore.user?.firstName, authStore.user?.lastName].filter(Boolean).join(" ") ||
  "Usuario"
)

const userInitials = computed(() => {
  const user = authStore.user
  if (!user) return "U"
  const first = user.firstName?.charAt(0) ?? ""
  const last = user.lastName?.charAt(0) ?? ""
  return `${first}${last}`.toUpperCase() || "U"
})

const salonName = computed(() => (authStore.user as any)?.salonName ?? "")

const roleLabel = computed(() => {
  if (authStore.isSuperAdmin) return "Super administrador"
  if (authStore.isAdmin) return "Administrador"
  if (authStore.isStaff) return "Personal"
  return "Usuario"
})

const commissionLabel = computed(() => {
  const value = authStore.user?.commissionPercentage
  if (value === undefined || value === null || value === "") return ""
  return `Comisión ${value}%`
})

const currentDate = computed(() =>
  new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
)

const showClientsSection = computed(() => authStore.isAdmin)
const showClinicalSection = computed(() => authStore.isAdmin || authStore.isStaff)
const showCategoriesSection = computed(() => authStore.isAdmin)

const statCols = computed(() => {
  const count = visibleStats.value.length
  if (count <= 3) return 4
  return 3
})

const visibleStats = computed(() => {
  if (authStore.isSuperAdmin) {
    return [
      { key: "salons", label: "Salones", value: totals.value.salons, icon: "mdi-domain", color: "primary" },
      { key: "branches", label: "Sucursales", value: totals.value.branches, icon: "mdi-store-outline", color: "info" },
      { key: "users", label: "Usuarios", value: totals.value.users, icon: "mdi-account-group-outline", color: "success" },
    ]
  }

  if (authStore.isAdmin) {
    return [
      { key: "clients", label: "Clientes", value: totals.value.clients, icon: "mdi-account-outline", color: "primary" },
      { key: "users", label: "Usuarios", value: totals.value.users, icon: "mdi-account-group-outline", color: "success" },
      { key: "branches", label: "Sucursales", value: totals.value.branches, icon: "mdi-store-outline", color: "info" },
      { key: "categories", label: "Categorías", value: totals.value.categories, icon: "mdi-spa-outline", color: "warning" },
    ]
  }

  return [
    { key: "clinicalRecords", label: "Historiales", value: totals.value.clinicalRecords, icon: "mdi-clipboard-pulse-outline", color: "primary" },
    { key: "branches", label: "Sucursales", value: totals.value.branches, icon: "mdi-store-outline", color: "info" },
  ]
})

const quickActions = computed(() => {
  const actions = [
    { title: "Dashboard", icon: "mdi-view-dashboard", to: "/app", color: "primary", onlyFor: [] as string[] },
    { title: "Salones", icon: "mdi-domain", to: "/app/salons", color: "primary", onlyFor: ["SUPER_ADMIN"] },
    { title: "Sucursales", icon: "mdi-store-outline", to: "/app/branches", color: "info", onlyFor: ["SUPER_ADMIN", "ADMIN_USER"] },
    { title: "Usuarios", icon: "mdi-account-cog-outline", to: "/app/users", color: "success", onlyFor: ["SUPER_ADMIN", "ADMIN_USER"] },
    { title: "Clientes", icon: "mdi-account-outline", to: "/app/clients", color: "primary", onlyFor: ["ADMIN_USER"] },
    { title: "Categorías", icon: "mdi-spa-outline", to: "/app/service-categories", color: "warning", onlyFor: ["ADMIN_USER"] },
  ]

  return actions.filter((action) => {
    if (!action.onlyFor.length) return false
    return action.onlyFor.includes(authStore.role as string)
  })
})

const serviceCategoriesPreview = computed(() => serviceCategories.value.slice(0, 5))

const fetchTotal = async (endpoint: string): Promise<number> => {
  const { $api } = useNuxtApp()
  const res = await $api<PageResponse<unknown>>(endpoint, {
    method: "GET",
    query: { page: 0, size: 1 },
  })
  return res.totalElements ?? 0
}

const getClientInitials = (client: Client) => {
  const first = client.firstName?.charAt(0) ?? ""
  const last = client.lastName?.charAt(0) ?? ""
  return `${first}${last}`.toUpperCase() || "C"
}

const formatDate = (date?: string) => {
  if (!date) return "Sin fecha"
  return new Date(date).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const sortClinicalRecords = (records: ClinicalRecord[]) =>
  [...records].sort((a, b) => {
    const dateA = a.sessionDate ? new Date(a.sessionDate).getTime() : 0
    const dateB = b.sessionDate ? new Date(b.sessionDate).getTime() : 0
    return dateB - dateA
  })

const loadDashboard = async () => {
  loading.value = true
  const { $api } = useNuxtApp()

  try {
    const tasks: Promise<void>[] = []

    if (authStore.isSuperAdmin) {
      tasks.push(
        fetchTotal("/api/salons").then((v) => { totals.value.salons = v }),
        fetchTotal("/api/branches").then((v) => { totals.value.branches = v }),
        fetchTotal("/api/users").then((v) => { totals.value.users = v }),
      )
    }

    if (authStore.isAdmin) {
      tasks.push(
        fetchTotal("/api/clients").then((v) => { totals.value.clients = v }),
        fetchTotal("/api/users").then((v) => { totals.value.users = v }),
        fetchTotal("/api/branches").then((v) => { totals.value.branches = v }),
        $api<ServiceCategory[]>("/api/service-categories", { method: "GET" }).then((res) => {
          const list = Array.isArray(res) ? res : []
          serviceCategories.value = list
          totals.value.categories = list.length
        }),
        $api<PageResponse<Client>>("/api/clients", {
          method: "GET",
          query: { page: 0, size: 5 },
        }).then((res) => {
          recentClients.value = res.content ?? []
        }),
        $api<ClinicalRecord[]>("/api/clinical-records", { method: "GET" }).then((res) => {
          const list = Array.isArray(res) ? res : []
          totals.value.clinicalRecords = list.length
          recentClinicalRecords.value = sortClinicalRecords(list).slice(0, 5)
        }),
      )
    }

    if (authStore.isStaff) {
      tasks.push(
        fetchTotal("/api/branches").then((v) => { totals.value.branches = v }),
        $api<ClinicalRecord[]>("/api/clinical-records", { method: "GET" }).then((res) => {
          const list = Array.isArray(res) ? res : []
          totals.value.clinicalRecords = list.length
          recentClinicalRecords.value = sortClinicalRecords(list).slice(0, 5)
        }),
      )
    }

    await Promise.allSettled(tasks)
  } catch (err) {
    console.error("Error al cargar dashboard:", err)
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>

<style scoped>
.dashboard {
  max-width: 1280px;
  margin: 0 auto;
}

.dashboard__welcome {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.08) 0%,
    rgba(var(--v-theme-surface), 1) 55%
  );
}

.dashboard__avatar {
  box-shadow: 0 8px 20px rgba(235, 88, 137, 0.25);
}

.dashboard__panel {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  height: 100%;
}

.dashboard__empty {
  text-align: center;
}

.dashboard__record-item {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.dashboard__quick-action {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  color: inherit;
}

.dashboard__quick-action:hover {
  border-color: rgba(var(--v-theme-primary), 0.35);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
}
</style>
