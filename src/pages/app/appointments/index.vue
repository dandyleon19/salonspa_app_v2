<template>
  <AppTable
    title="Citas"
    subtitle="Lista de citas registradas"
    :headers="tableHeaders"
    :row-options="tableRowOptions"
    :get-row-options="getAppointmentRowOptions"
    :filters="tableFilters"
    :items="appointmentsList"
    :chip-columns="appointmentChipColumns"
    :item-class="getAppointmentRowClass"
    :loading="loadingAppointmentsList"
    :page="currentPage"
    :items-per-page="itemsPerPage"
    :total-items="totalItems"
    :show-create-button="false"
    :show-export-button="canManageAppointments"
    :show-search="false"
    hide-page-title
    @update:pagination="handlePagination"
    @handle-export-button="handleExportData"
    @handle-update-filters="handleApplyFilters"
    @handle-row-action-button="handleRowActionButton"
  >
    <template #summary>
      <span class="appointments-quick__label">Atajos</span>
      <v-chip
        size="small"
        :variant="activeQuickFilter === 'today' ? 'flat' : 'tonal'"
        color="primary"
        class="appointments-quick__chip"
        @click="applyQuickDateFilter(activeQuickFilter === 'today' ? null : 'today')"
      >
        Hoy
      </v-chip>
      <v-chip
        size="small"
        :variant="activeQuickFilter === 'tomorrow' ? 'flat' : 'tonal'"
        color="primary"
        class="appointments-quick__chip"
        @click="applyQuickDateFilter(activeQuickFilter === 'tomorrow' ? null : 'tomorrow')"
      >
        Mañana
      </v-chip>
      <v-btn
        v-if="activeQuickFilter"
        variant="text"
        size="x-small"
        class="text-none"
        @click="applyQuickDateFilter(null)"
      >
        Quitar filtro
      </v-btn>
    </template>

    <template #item.scheduleLabel="{ item }">
      <div class="appointment-schedule">
        <span class="appointment-schedule__date">{{ item.startAtDate }}</span>
        <span class="appointment-schedule__time text-caption text-medium-emphasis">{{ item.timeRangeLabel }}</span>
      </div>
    </template>

    <template #item.clientLabel="{ item }">
      <button
        type="button"
        class="appointment-client-cell"
        :class="{ 'appointment-client-cell--empty': item.clientLabel === '—' }"
        :disabled="item.clientLabel === '—'"
        @click="openClientContact(item)"
      >
        <span class="appointment-client-cell__name">
          {{ item.clientLabel }}
          <v-icon
            v-if="item.notes && item.notes !== '—'"
            size="14"
            class="appointment-client-cell__notes"
            :title="item.notes"
          >tabler:notes</v-icon>
        </span>
        <span
          v-if="item.clientPhone"
          class="appointment-client-cell__phone text-caption text-medium-emphasis"
        >
          {{ item.clientPhone }}
        </span>
      </button>
    </template>
  </AppTable>

  <AppointmentClientContactModal
    v-model="showClientContactModal"
    :appointment="selectedClientAppointment"
  />
</template>

<script setup lang="ts">
import { ref } from "vue"
import type { FilterOption, TableChipColumn, TableHeader, TableRowOption } from "~/interfaces/tableInterfaces"
import type {
  Appointment,
  AppointmentFilters,
  AppointmentStatus,
} from "~/interfaces/appointmentInterfaces"
import {
  APPOINTMENT_STATUS_ACTION_COLORS,
  APPOINTMENT_STATUS_ACTION_ICONS,
  APPOINTMENT_STATUS_ACTION_LABELS,
  APPOINTMENT_STATUS_OPTIONS,
  getAppointmentStatusActions,
  getAppointmentStatusColor,
  getAppointmentStatusLabel,
  isInactiveAppointmentStatus,
} from "~/interfaces/appointmentInterfaces"
import {
  useAppointmentsStore,
  useBranchesStore,
} from "~/store"
import { useAuthStore } from "~/store/modules/auth"
import { useAppointmentManagement } from "~/composables/useAppointmentManagement"
import {
  areAppointmentFiltersEqual,
  normalizeAppointmentFilters,
} from "~/helpers/appointmentHelpers"
import {
  formatDateDisplay,
  formatTimeDisplay,
  getTodayDate,
  getTomorrowDate,
  splitIsoDateTime,
} from "~/helpers/dateTimeHelpers"
import { buildWhatsAppReminderLink } from "~/helpers/whatsappHelpers"

const appointmentsStore = useAppointmentsStore()
const branchesStore = useBranchesStore()
const authStore = useAuthStore()
const management = useAppointmentManagement()

const showClientContactModal = ref(false)
const selectedClientAppointment = ref<Appointment | null>(null)

const currentPage = ref(1)
const itemsPerPage = ref(10)
const activeFilters = ref<AppointmentFilters>({})
const activeQuickFilter = ref<"today" | "tomorrow" | null>(null)

const canManageAppointments = computed(() => authStore.canManageAppointments)
const salonName = computed(() => (authStore.user as any)?.salonName ?? "")

const baseHeaders: TableHeader[] = [
  { title: "ID", key: "id" },
  { title: "Cliente", key: "clientLabel" },
  { title: "Profesional", key: "userLabel" },
  { title: "Sucursal", key: "branchLabel" },
  { title: "Servicio", key: "serviceLabel" },
  { title: "Fecha y hora", key: "scheduleLabel" },
  { title: "Estado", key: "statusLabel" },
  // The notes are a small icon next to the client in the table (its tooltip); in a card they are a field.
  { title: "Notas", key: "notes", cardOnly: true },
]

const manageRowOptions: TableRowOption[] = []

const tableHeaders = computed<TableHeader[]>(() => {
  if (!canManageAppointments.value) {
    return baseHeaders
  }

  return [
    ...baseHeaders,
    { title: "Acciones", key: "actions", sortable: false },
  ]
})

const tableRowOptions = computed<TableRowOption[]>(() =>
  canManageAppointments.value ? manageRowOptions : []
)

const getStatusActionLabel = (status: AppointmentStatus) =>
  APPOINTMENT_STATUS_ACTION_LABELS[status] ?? getAppointmentStatusLabel(status)

const getStatusActionIcon = (status: AppointmentStatus) =>
  APPOINTMENT_STATUS_ACTION_ICONS[status] ?? "tabler:circle"

const getStatusActionColor = (status: AppointmentStatus) =>
  APPOINTMENT_STATUS_ACTION_COLORS[status] ?? "primary"

const isAppointmentUpcoming = (item: Appointment) =>
  new Date(item.startAt).getTime() > Date.now() && !isInactiveAppointmentStatus(item.status)

const getAppointmentRowOptions = (
  item: Appointment & { statusActions?: AppointmentStatus[] }
): TableRowOption[] => {
  // On phones and tablets the first status action (the one that moves the appointment forward) and "Editar" stay in
  // the row; the others go to the "more actions" sheet.
  const statusOptions: TableRowOption[] = (item.statusActions ?? []).map(
    (status, index) => ({
      action: `status:${status}`,
      icon: getStatusActionIcon(status),
      color: getStatusActionColor(status),
      title: getStatusActionLabel(status),
      primary: index === 0,
    })
  )

  const reminderOptions: TableRowOption[] =
    item.clientPhone && isAppointmentUpcoming(item)
      ? [
          {
            action: "whatsapp",
            color: "success",
            icon: "tabler:brand-whatsapp",
            title: "Recordar por WhatsApp",
          },
        ]
      : []

  return [
    ...statusOptions,
    ...reminderOptions,
    {
      action: "update",
      color: "primary",
      icon: "tabler:pencil",
      title: "Editar",
      primary: true,
    },
    {
      action: "delete",
      color: "error",
      icon: "tabler:trash",
      title: "Eliminar",
    },
  ]
}

const getAppointmentRowClass = (item: Appointment & { statusActions?: AppointmentStatus[] }) =>
  isInactiveAppointmentStatus(item.status) ? "app-table__row--muted" : ""

const appointmentChipColumns: TableChipColumn[] = [
  {
    key: "branchLabel",
    icon: "tabler:building-store",
    class: "app-table__chip--branch",
  },
  {
    key: "serviceLabel",
    icon: "tabler:flower",
    class: "app-table__chip--service",
  },
  {
    key: "statusLabel",
    color: (item) => getAppointmentStatusColor(item.status),
  },
]

const tableFilters = computed<FilterOption[]>(() => [
  {
    type: "date",
    label: "Fecha",
    key: "date",
    items: [],
  },
  // The platform admin does not manage clients (the API refuses them), so there is nothing to filter by.
  ...(authStore.isSuperAdmin
    ? []
    : [{ type: "remote-select" as const, kind: "client" as const, label: "Cliente", key: "clientId", items: [] }]),
  ...(canManageAppointments.value
    ? [{ type: "remote-select" as const, kind: "user" as const, label: "Profesional", key: "userId", items: [] }]
    : []),
  {
    type: "select",
    label: "Sucursal",
    key: "branchId",
    items: (branchesStore.data?.content ?? []).map((branch) => ({
      title: branch.name,
      value: Number(branch.id),
    })),
  },
  {
    type: "select",
    label: "Estado",
    key: "status",
    items: APPOINTMENT_STATUS_OPTIONS.map((option) => ({
      title: option.label,
      value: option.value,
    })),
  },
])

const resolveLabel = (
  id?: number | string,
  name?: string,
  fallback = "—"
) => {
  if (name) return name
  if (id == null || id === "") return fallback
  return `#${id}`
}

// "9:00 AM" and "9:30 AM" become "9:00 – 9:30 AM"; across noon both periods stay ("11:30 AM – 12:30 PM").
const formatTimeRange = (start: string, end: string) => {
  if (!end || end === "—") return start
  const [startClock, startPeriod] = start.split(" ")
  const [, endPeriod] = end.split(" ")
  return startPeriod && startPeriod === endPeriod ? `${startClock} – ${end}` : `${start} – ${end}`
}

const appointmentsList = computed(() => {
  return (appointmentsStore.data?.content ?? []).map((appointment: Appointment) => {
    const { date: startDate, time: startTime } = splitIsoDateTime(appointment.startAt)
    const { time: endTime } = splitIsoDateTime(appointment.endAt)

    return {
      ...appointment,
      clientLabel: resolveLabel(appointment.clientId, appointment.clientName),
      userLabel: resolveLabel(appointment.userId, appointment.userName),
      branchLabel: resolveLabel(appointment.branchId, appointment.branchName),
      serviceLabel: resolveLabel(appointment.serviceId, appointment.serviceName),
      startAtDate: formatDateDisplay(startDate),
      startAtTime: formatTimeDisplay(startTime),
      endAtTime: formatTimeDisplay(endTime),
      timeRangeLabel: formatTimeRange(formatTimeDisplay(startTime), formatTimeDisplay(endTime)),
      scheduleLabel: `${formatDateDisplay(startDate)} · ${formatTimeRange(formatTimeDisplay(startTime), formatTimeDisplay(endTime))}`,
      statusLabel: getAppointmentStatusLabel(appointment.status),
      statusActions: getAppointmentStatusActions(appointment.status),
      notes: appointment.notes || "—",
    }
  })
})

const totalItems = computed(() => appointmentsStore.data?.totalElements ?? 0)
const loadingAppointmentsList = computed(() => appointmentsStore.loading)

const fetchAppointments = async () => {
  await appointmentsStore.fetchAppointments(
    currentPage.value - 1,
    itemsPerPage.value,
    activeFilters.value
  )
}

const openClientContact = (appointment: Appointment) => {
  selectedClientAppointment.value = appointment
  showClientContactModal.value = true
}

watch(showClientContactModal, (open) => {
  if (!open) selectedClientAppointment.value = null
})

const handleRowActionButton = (appointment: Appointment, action: string) => {
  if (!canManageAppointments.value) return

  if (action === "whatsapp") {
    const link = buildWhatsAppReminderLink(appointment, salonName.value)
    if (link) {
      window.open(link, "_blank", "noopener")
      if (appointment.id != null) {
        appointmentsStore.markReminderSent(appointment.id).catch((err) => {
          console.error("Error al registrar el recordatorio enviado:", err)
        })
      }
    }
    return
  }

  if (action.startsWith("status:")) {
    const status = action.slice("status:".length) as AppointmentStatus
    management.openStatusChange(appointment, status)
    return
  }

  switch (action) {
    case "update":
      if (appointment.id != null) {
        management.openEdit(appointment.id)
      }
      break

    case "delete":
      management.openDelete(appointment)
      break

    default:
      break
  }
}

const handleExportData = () => {
  console.log("Exportar citas")
}

const syncActiveQuickFilter = (date?: string) => {
  if (date === getTodayDate()) {
    activeQuickFilter.value = "today"
  } else if (date === getTomorrowDate()) {
    activeQuickFilter.value = "tomorrow"
  } else {
    activeQuickFilter.value = null
  }
}

const handleApplyFilters = (values: Record<string, unknown>) => {
  const nextFilters = normalizeAppointmentFilters(values)

  syncActiveQuickFilter(nextFilters.date)

  if (areAppointmentFiltersEqual(activeFilters.value, nextFilters)) {
    return
  }

  activeFilters.value = nextFilters
  currentPage.value = 1
  fetchAppointments()
}

const applyQuickDateFilter = (kind: "today" | "tomorrow" | null) => {
  const date =
    kind === "today" ? getTodayDate() : kind === "tomorrow" ? getTomorrowDate() : undefined

  const nextFilters = normalizeAppointmentFilters({ ...activeFilters.value, date })
  activeQuickFilter.value = kind

  if (areAppointmentFiltersEqual(activeFilters.value, nextFilters)) {
    return
  }

  activeFilters.value = nextFilters
  currentPage.value = 1
  fetchAppointments()
}

const handlePagination = async ({
  page,
  itemsPerPage: newItemsPerPage,
}: {
  page: number
  itemsPerPage: number
}) => {
  currentPage.value = page
  itemsPerPage.value = newItemsPerPage
  await fetchAppointments()
}

onMounted(async () => {
  management.registerRefresh(fetchAppointments)
  await Promise.all([branchesStore.fetchBranches(0, 100), fetchAppointments()])
})
</script>

<style scoped>
.appointment-client-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  max-width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.appointment-client-cell:hover:not(:disabled) .appointment-client-cell__name {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
}

.appointment-client-cell--empty,
.appointment-client-cell:disabled {
  cursor: default;
}

.appointment-client-cell__name {
  font-weight: 600;
  line-height: 1.3;
  transition: color 0.2s ease;
}

.appointment-client-cell__phone {
  line-height: 1.2;
}

:deep(.v-data-table__tbody td:has(.appointment-client-cell)) {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  min-width: 11.5rem;
  max-width: 16rem !important;
}

.appointment-client-cell__notes {
  margin-left: 0.25rem;
  vertical-align: -2px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

/* In a card the notes are a field of their own. */
.app-card .appointment-client-cell__notes {
  display: none;
}

.appointment-schedule {
  display: flex;
  flex-direction: column;
  gap: 2px;
  white-space: nowrap;
}

.appointments-quick__label {
  margin-right: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.appointments-quick__chip {
  font-weight: 600;
  cursor: pointer;
}
</style>
