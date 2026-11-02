<template>
  <div class="dashboard">
    <!-- Welcome card: who you are and today's date on the left; the main actions on the right. -->
    <v-card class="dashboard-welcome" rounded="xl" elevation="0">
      <v-card-text class="dashboard-welcome__body">
        <div class="dashboard-welcome__identity">
          <v-avatar size="64" color="primary" class="dashboard-welcome__avatar">
            <span class="text-h6 font-weight-bold text-on-primary">{{ userInitials }}</span>
          </v-avatar>

          <div class="dashboard-welcome__text">
            <p class="dashboard-welcome__eyebrow">Super administrador</p>
            <h1 class="dashboard-welcome__title">{{ greeting }}, {{ firstName }}</h1>
            <p class="dashboard-welcome__salon">
              <v-icon icon="tabler:world" size="16" />
              Panel de la plataforma
            </p>
            <p class="dashboard-welcome__date">{{ dateLabel }}</p>
          </div>
        </div>

        <div class="dashboard-welcome__tools">
          <v-btn to="/app/users" variant="tonal" color="primary" prepend-icon="tabler:users">
            Usuarios
          </v-btn>
          <v-btn to="/app/salons" color="primary" prepend-icon="tabler:building-store" class="dashboard-welcome__action">
            Gestionar salones
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <section class="dashboard-kpis" aria-label="Indicadores de la plataforma">
      <DashboardStatCard
        v-for="kpi in kpis"
        :key="kpi.key"
        :label="kpi.label"
        :value="kpi.value"
        :icon="kpi.icon"
        :color="kpi.color"
        :caption="kpi.caption"
        :to="kpi.to"
        :loading="subscriptionsLoading"
      />
    </section>

    <section class="dashboard-pulse" aria-label="Actividad de la plataforma">
      <div v-for="item in pulseStats" :key="item.key" class="dashboard-pulse__item">
        <span class="dashboard-pulse__icon"><v-icon :icon="item.icon" size="18" /></span>
        <span class="dashboard-pulse__text">
          <span class="dashboard-pulse__label">{{ item.label }}</span>
          <v-skeleton-loader v-if="activityLoading" type="text" width="40" />
          <span v-else class="dashboard-pulse__value">{{ item.value }}</span>
        </span>
      </div>
    </section>

    <div class="dashboard-split dashboard-split--main">
      <DashboardPanel
        title="Requieren atención"
        subtitle="Pagos vencidos, planes por vencer y salones bloqueados"
        to="/app/salons"
        action-label="Ir a salones"
      >
        <AppSkeletonTransition>
          <v-skeleton-loader v-if="subscriptionsLoading" key="attention-skeleton" type="list-item-two-line@4" />
          <DashboardEmpty
            v-else-if="!attentionRows.length"
            key="attention-empty"
            icon="tabler:circle-check"
            title="Todo al día"
            hint="Ningún salón tiene pagos vencidos, planes por vencer ni bloqueos."
          />
          <ul v-else key="attention-list" class="superadmin-list">
            <li v-for="row in attentionRows" :key="row.salonId" class="superadmin-list__item">
              <span class="superadmin-list__badge" :class="`superadmin-list__badge--${row.tone}`">
                <v-icon :icon="row.icon" size="18" />
              </span>

              <div class="superadmin-list__text">
                <span class="superadmin-list__name">{{ row.name }}</span>
                <span class="superadmin-list__detail">{{ row.detail }}</span>
              </div>

              <v-chip size="small" variant="tonal" :color="row.tone">{{ row.label }}</v-chip>
            </li>
          </ul>
        </AppSkeletonTransition>
      </DashboardPanel>

      <DashboardPanel title="Estado de las suscripciones" :subtitle="`${salons.length} salón${salons.length === 1 ? '' : 'es'} en total`">
        <AppSkeletonTransition>
          <v-skeleton-loader v-if="subscriptionsLoading" key="status-skeleton" type="image" height="260" />
          <DashboardEmpty
            v-else-if="!salons.length"
            key="status-empty"
            icon="tabler:building-store"
            title="Aún no hay salones"
            hint="Crea el primero desde la sección Salones."
          />
          <DashboardDonut v-else key="status-donut" :segments="statusSegments" center-label="salones" />
        </AppSkeletonTransition>
      </DashboardPanel>
    </div>

    <div class="dashboard-split dashboard-split--main">
      <DashboardPanel
        title="Pruebas gratuitas"
        subtitle="Cuánto le queda a cada salón en su prueba"
        to="/app/salons"
        action-label="Gestionar"
      >
        <AppSkeletonTransition>
          <v-skeleton-loader v-if="subscriptionsLoading" key="trials-skeleton" type="list-item-two-line@3" />
          <DashboardEmpty
            v-else-if="!trialRows.length"
            key="trials-empty"
            icon="tabler:hourglass-empty"
            title="No hay pruebas en curso"
            hint="Los salones nuevos aparecerán aquí hasta que contraten un plan."
          />
          <ul v-else key="trials-list" class="superadmin-list">
            <li v-for="row in trialRows" :key="row.salonId" class="superadmin-trial">
              <div class="superadmin-trial__line">
                <span class="superadmin-list__name">{{ row.name }}</span>
                <span class="superadmin-trial__state" :class="{ 'superadmin-trial__state--urgent': row.urgent }">
                  {{ row.state }}
                </span>
              </div>
              <div class="superadmin-trial__track" role="presentation">
                <div
                  class="superadmin-trial__fill"
                  :class="{ 'superadmin-trial__fill--urgent': row.urgent }"
                  :style="{ width: `${row.percent}%` }"
                />
              </div>
              <span class="superadmin-list__detail">{{ row.detail }}</span>
            </li>
          </ul>
        </AppSkeletonTransition>
      </DashboardPanel>

      <DashboardPanel title="Planes" subtitle="Qué plan tiene cada salón">
        <AppSkeletonTransition>
          <v-skeleton-loader v-if="subscriptionsLoading" key="plans-skeleton" type="image" height="260" />
          <DashboardEmpty
            v-else-if="!salons.length"
            key="plans-empty"
            icon="tabler:layout-grid"
            title="Sin datos de planes"
          />
          <DashboardDonut v-else key="plans-donut" :segments="planSegments" center-label="salones" />
        </AppSkeletonTransition>
      </DashboardPanel>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import type { SubscriptionInfo } from "~/interfaces/subscriptionInterfaces"
import { formatDaysLeft } from "~/interfaces/subscriptionInterfaces"
import { formatDateDisplay, getTodayDate } from "~/helpers/dateTimeHelpers"
import { useAuthStore } from "~/store/modules/auth"
import { useSubscriptionStore } from "~/store/modules/subscription"
import { useDashboardStore } from "~/store"

const authStore = useAuthStore()
const subscriptionStore = useSubscriptionStore()
const dashboardStore = useDashboardStore()

/** A paid plan that ends within this many days is "about to expire"; a trial within TRIAL_ENDING_DAYS, "ending". */
const EXPIRING_SOON_DAYS = 7
const TRIAL_ENDING_DAYS = 3

const subscriptionsReady = ref(false)

// ---------------------------------------------------------------- header

const firstName = computed(
  () => authStore.user?.firstName || authStore.user?.fullName?.split(" ")[0] || "Admin"
)

const userInitials = computed(() => {
  const user = authStore.user
  if (!user) return "U"
  const first = user.firstName?.charAt(0) ?? ""
  const last = user.lastName?.charAt(0) ?? ""
  return `${first}${last}`.toUpperCase() || "U"
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return "Buenos días"
  if (hour < 19) return "Buenas tardes"
  return "Buenas noches"
})

const dateLabel = computed(() => {
  const label = new Date(`${getTodayDate()}T12:00:00`).toLocaleDateString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
})

// ---------------------------------------------------------------- subscriptions

const salons = computed<SubscriptionInfo[]>(() => subscriptionStore.all)
const subscriptionsLoading = computed(() => !subscriptionsReady.value || subscriptionStore.allLoading)

const isExpiringSoon = (item: SubscriptionInfo) =>
  item.status === "ACTIVE" && item.daysRemaining !== null && item.daysRemaining <= EXPIRING_SOON_DAYS

const isTrialEnding = (item: SubscriptionInfo) =>
  item.status === "TRIAL" && !item.trialPending && item.daysRemaining !== null && item.daysRemaining <= TRIAL_ENDING_DAYS

const salonName = (item: SubscriptionInfo) => item.salonName || `Salón #${item.salonId}`

/** Most urgent first: blocked, overdue, trial about to end, plan about to expire. */
const attentionRows = computed(() => {
  const rows: {
    salonId: number | null
    name: string
    label: string
    detail: string
    tone: "error" | "warning" | "info"
    icon: string
    severity: number
    days: number
  }[] = []

  for (const item of salons.value) {
    const name = salonName(item)
    const plan = item.planName ? `Plan ${item.planName}` : "Sin plan"

    if (item.status === "SUSPENDED") {
      rows.push({ salonId: item.salonId, name, label: "Suspendido", detail: item.notes ? `Motivo: ${item.notes}` : plan, tone: "error", icon: "tabler:lock", severity: 0, days: 0 })
    } else if (item.status === "EXPIRED") {
      rows.push({ salonId: item.salonId, name, label: "Bloqueado", detail: `${plan} · venció y no pagó`, tone: "error", icon: "tabler:lock", severity: 0, days: 0 })
    } else if (item.status === "PAST_DUE") {
      const grace = item.daysRemaining ?? 0
      rows.push({ salonId: item.salonId, name, label: "Pago vencido", detail: `${plan} · ${grace <= 0 ? "último día de gracia" : `${formatDaysLeft(grace)} de gracia`}`, tone: "warning", icon: "tabler:alert-triangle", severity: 1, days: grace })
    } else if (isTrialEnding(item)) {
      const left = item.daysRemaining ?? 0
      rows.push({ salonId: item.salonId, name, label: left <= 0 ? "Termina hoy" : `Quedan ${formatDaysLeft(left)}`, detail: "Prueba gratuita por terminar", tone: "info", icon: "tabler:hourglass", severity: 2, days: left })
    } else if (isExpiringSoon(item)) {
      const left = item.daysRemaining ?? 0
      const until = item.currentPeriodEnd ? ` (${formatDateDisplay(item.currentPeriodEnd)})` : ""
      rows.push({ salonId: item.salonId, name, label: left <= 0 ? "Vence hoy" : `Vence en ${formatDaysLeft(left)}`, detail: `${plan}${until}`, tone: "warning", icon: "tabler:calendar-due", severity: 3, days: left })
    }
  }

  return rows.sort((a, b) => a.severity - b.severity || a.days - b.days)
})

const trialRows = computed(() =>
  salons.value
    .filter((item) => item.status === "TRIAL")
    .map((item) => {
      const total = item.trialDays ?? 14
      const left = item.daysRemaining ?? total
      const pending = !!item.trialPending
      const used = pending ? 0 : Math.max(0, Math.min(total, total - left))

      return {
        salonId: item.salonId,
        name: salonName(item),
        state: pending ? "Sin iniciar" : left <= 0 ? "Termina hoy" : `Quedan ${formatDaysLeft(left)}`,
        detail: pending
          ? `${total} días · empieza al primer ingreso de un usuario`
          : `${total} días de prueba${item.trialEndsAt ? ` · hasta ${formatDateDisplay(item.trialEndsAt)}` : ""}`,
        percent: pending ? 0 : Math.max(4, Math.round((used / total) * 100)),
        urgent: !pending && left <= TRIAL_ENDING_DAYS,
        sort: pending ? 1000 : left,
      }
    })
    .sort((a, b) => a.sort - b.sort)
)

const kpis = computed(() => {
  const list = salons.value
  const active = list.filter((item) => item.status === "ACTIVE")
  const inTrial = list.filter((item) => item.status === "TRIAL")
  const blocked = list.filter((item) => item.blocked)

  return [
    {
      key: "salons",
      label: "Salones registrados",
      value: list.length,
      caption: `${list.filter((item) => item.planName).length} con plan asignado`,
      icon: "tabler:building-store",
      color: "primary",
      to: "/app/salons",
    },
    {
      key: "active",
      label: "Con plan activo",
      value: active.length,
      caption: `${active.filter((item) => !item.currentPeriodEnd).length} sin vencimiento`,
      icon: "tabler:circle-check",
      color: "success",
      to: "/app/salons",
    },
    {
      key: "trial",
      label: "En prueba gratuita",
      value: inTrial.length,
      caption: `${inTrial.filter((item) => item.trialPending).length} aún sin iniciar`,
      icon: "tabler:hourglass",
      color: "info",
      to: "/app/salons",
    },
    {
      key: "attention",
      label: "Requieren atención",
      value: attentionRows.value.length,
      caption: `${blocked.length} bloqueado${blocked.length === 1 ? "" : "s"}`,
      icon: "tabler:alert-triangle",
      color: "warning",
      to: "/app/salons",
    },
  ]
})

// ---------------------------------------------------------------- distributions

const statusSegments = computed(() => {
  const list = salons.value
  const count = (predicate: (item: SubscriptionInfo) => boolean) => list.filter(predicate).length

  return [
    { key: "active", label: "Activos", value: count((i) => i.status === "ACTIVE" && !isExpiringSoon(i)), color: "rgb(var(--v-theme-success))" },
    { key: "expiring", label: "Por vencer", value: count((i) => i.status === "PAST_DUE" || isExpiringSoon(i)), color: "rgb(var(--v-theme-warning))" },
    { key: "trial", label: "En prueba", value: count((i) => i.status === "TRIAL" && !i.trialPending), color: "rgb(var(--v-theme-info))" },
    { key: "pending", label: "Prueba sin iniciar", value: count((i) => i.status === "TRIAL" && !!i.trialPending), color: "#8A8F98" },
    { key: "blocked", label: "Bloqueados", value: count((i) => i.blocked), color: "rgb(var(--v-theme-error))" },
  ]
})

const PLAN_COLORS = ["rgb(var(--v-theme-primary))", "rgb(var(--v-theme-info))", "#7C3AED", "rgb(var(--v-theme-success))", "#8A8F98"]

const planSegments = computed(() => {
  const byPlan = new Map<string, number>()
  for (const item of salons.value) {
    const plan = item.planName ?? "Sin plan"
    byPlan.set(plan, (byPlan.get(plan) ?? 0) + 1)
  }

  return [...byPlan.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([plan, value], index) => ({
      key: plan,
      label: plan,
      value,
      color: plan === "Sin plan" ? "#8A8F98" : PLAN_COLORS[index % (PLAN_COLORS.length - 1)],
    }))
})

// ---------------------------------------------------------------- platform activity (the API adds up every salon for a SUPER_ADMIN)

const activityLoading = computed(() => dashboardStore.loading || !dashboardStore.data)
const pulseStats = computed(() => {
  const data = dashboardStore.data
  return [
    { key: "users", label: "Usuarios activos", value: data?.activeUsers ?? 0, icon: "tabler:users-group" },
    { key: "clients", label: "Clientes en la plataforma", value: data?.totalClients ?? 0, icon: "tabler:user-heart" },
    { key: "appointments", label: "Citas del mes (todos los salones)", value: data?.monthAppointments ?? 0, icon: "tabler:calendar-month" },
  ]
})

onMounted(async () => {
  await Promise.allSettled([
    subscriptionStore.fetchAll().finally(() => {
      subscriptionsReady.value = true
    }),
    dashboardStore.fetchDashboard({ date: getTodayDate() }),
  ])
})
</script>

<style scoped>
.superadmin-list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

.superadmin-list__item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
}

.superadmin-list__item:last-child {
  border-bottom: 0;
}

.superadmin-list__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 12px;
}

.superadmin-list__badge--error {
  color: var(--ink-error);
  background: rgba(var(--v-theme-error), 0.1);
}

.superadmin-list__badge--warning {
  color: var(--ink-warning);
  background: rgba(var(--v-theme-warning), 0.16);
}

.superadmin-list__badge--info {
  color: var(--ink-info);
  background: rgba(var(--v-theme-info), 0.12);
}

.superadmin-list__text {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
}

.superadmin-list__name {
  overflow: hidden;
  font-size: 0.875rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(var(--v-theme-on-surface), 0.92);
}

.superadmin-list__detail {
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.superadmin-trial {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
}

.superadmin-trial:last-child {
  border-bottom: 0;
}

.superadmin-trial__line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.superadmin-trial__state {
  flex-shrink: 0;
  font-size: 0.8125rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ink-info);
}

.superadmin-trial__state--urgent {
  color: var(--ink-warning);
}

.superadmin-trial__track {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.07);
}

.superadmin-trial__fill {
  height: 100%;
  border-radius: 999px;
  background: rgb(var(--v-theme-info));
  transition: width 0.4s ease;
}

.superadmin-trial__fill--urgent {
  background: rgb(var(--v-theme-warning));
}
</style>
