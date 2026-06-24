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
    <template #item.clientLabel="{ item }">
      <button
        type="button"
        class="appointment-client-cell"
        :class="{ 'appointment-client-cell--empty': item.clientLabel === '—' }"
        :disabled="item.clientLabel === '—'"
        @click="openClientContact(item)"
      >
        <span class="appointment-client-cell__name">{{ item.clientLabel }}</span>
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
  useClientsStore,
  useUsersStore,
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
  splitIsoDateTime,
} from "~/helpers/dateTimeHelpers"

const appointmentsStore = useAppointmentsStore()
const branchesStore = useBranchesStore()
const clientsStore = useClientsStore()
const usersStore = useUsersStore()
const authStore = useAuthStore()
const management = useAppointmentManagement()

const showClientContactModal = ref(false)
const selectedClientAppointment = ref<Appointment | null>(null)

const currentPage = ref(1)
const itemsPerPage = ref(10)
const activeFilters = ref<AppointmentFilters>({})

const canManageAppointments = computed(() => authStore.canManageAppointments)

const baseHeaders: TableHeader[] = [
  { title: "ID", key: "id" },
  { title: "Cliente", key: "clientLabel" },
  { title: "Profesional", key: "userLabel" },
  { title: "Sucursal", key: "branchLabel" },
  { title: "Servicio", key: "serviceLabel" },
  { title: "Inicio", key: "startAtDate" },
  { title: "Hora inicio", key: "startAtTime" },
  { title: "Hora fin", key: "endAtTime" },
  { title: "Estado", key: "statusLabel" },
  { title: "Notas", key: "notes" },
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
  APPOINTMENT_STATUS_ACTION_ICONS[status] ?? "mdi-circle-outline"

const getStatusActionColor = (status: AppointmentStatus) =>
  APPOINTMENT_STATUS_ACTION_COLORS[status] ?? "primary"

const getAppointmentRowOptions = (
  item: Appointment & { statusActions?: AppointmentStatus[] }
): TableRowOption[] => {
  const statusOptions: TableRowOption[] = (item.statusActions ?? []).map(
    (status) => ({
      action: `status:${status}`,
      icon: getStatusActionIcon(status),
      color: getStatusActionColor(status),
      title: getStatusActionLabel(status),
    })
  )

  return [
    ...statusOptions,
    {
      action: "update",
      color: "primary",
      icon: "mdi-pencil",
      title: "Editar",
    },
    {
      action: "delete",
      color: "error",
      icon: "mdi-delete",
      title: "Eliminar",
    },
  ]
}

const getAppointmentRowClass = (item: Appointment & { statusActions?: AppointmentStatus[] }) =>
  isInactiveAppointmentStatus(item.status) ? "app-table__row--muted" : ""

const appointmentChipColumns: TableChipColumn[] = [
  {
    key: "branchLabel",
    icon: "mdi-store-outline",
    class: "app-table__chip--branch",
  },
  {
    key: "serviceLabel",
    icon: "mdi-spa-outline",
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
  {
    type: "searchable-select",
    label: "Cliente",
    key: "clientId",
    items: (clientsStore.data?.content ?? []).map((client) => ({
      title: `${client.firstName} ${client.lastName}`.trim(),
      value: Number(client.id),
    })),
  },
  {
    type: "searchable-select",
    label: "Profesional",
    key: "userId",
    items: (usersStore.data?.content ?? []).map((user) => ({
      title: user.fullName || `${user.firstName} ${user.lastName}`.trim(),
      value: Number(user.id),
    })),
  },
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

const handleApplyFilters = (values: Record<string, unknown>) => {
  const nextFilters = normalizeAppointmentFilters(values)

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
  await Promise.all([
    branchesStore.fetchBranches(0, 100),
    clientsStore.fetchClients(0, 100),
    usersStore.fetchUsers(0, 100),
    fetchAppointments(),
  ])
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
}
</style>
