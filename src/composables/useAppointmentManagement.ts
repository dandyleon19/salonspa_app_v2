import type { ComputedRef, InjectionKey, Ref } from "vue"
import type {
  Appointment,
  AppointmentStatus,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  appointmentDataModalForm,
} from "~/interfaces/appointmentInterfaces"
import { useAppointmentsStore } from "~/store"
import { useAuthStore } from "~/store/modules/auth"
import { splitIsoDateTime } from "~/helpers/dateTimeHelpers"
import { formatDateDisplay, formatTimeDisplay } from "~/helpers/dateTimeHelpers"

type RefreshHandler = () => void | Promise<void>

export interface AppointmentManagementContext {
  canManageAppointments: ComputedRef<boolean>
  loading: Ref<boolean>
  openCreate: () => void
  openEdit: (appointmentId: number | string) => void
  openDelete: (appointment: Appointment) => void
  openStatusChange: (appointment: Appointment, status: AppointmentStatus) => void
  registerRefresh: (handler: RefreshHandler) => void
}

const appointmentManagementKey: InjectionKey<AppointmentManagementContext> =
  Symbol("appointmentManagement")

export function provideAppointmentManagement() {
  const appointmentsStore = useAppointmentsStore()
  const authStore = useAuthStore()
  const { notifyCreated, notifyUpdated, notifyDeleted, notifyError } =
    useApiNotification()

  const loading = ref(false)
  const openAppointmentDrawer = ref(false)
  const showDeleteDialog = ref(false)
  const showStatusDialog = ref(false)
  const appointmentToRemove = ref<Appointment>()
  const pendingStatusChange = ref<{
    appointment: Appointment
    status: AppointmentStatus
  } | null>(null)
  const dataModalForm = ref<appointmentDataModalForm>({ action: "create" })

  const refreshHandler = ref<RefreshHandler | null>(null)

  const canManageAppointments = computed(() => authStore.canManageAppointments)

  const pendingStatusSummary = computed(() => {
    const pending = pendingStatusChange.value
    if (!pending) return ""

    const { appointment } = pending
    const client = appointment.clientName || `#${appointment.clientId}`
    const { date, time } = splitIsoDateTime(appointment.startAt)
    const dateLabel = formatDateDisplay(date)
    const timeLabel = formatTimeDisplay(time)

    return `(${client} · ${dateLabel} ${timeLabel})`
  })

  const registerRefresh = (handler: RefreshHandler) => {
    refreshHandler.value = handler
  }

  const refreshView = async () => {
    if (refreshHandler.value) {
      await refreshHandler.value()
    }
  }

  const openCreate = () => {
    if (!canManageAppointments.value) return
    dataModalForm.value = { action: "create" }
    openAppointmentDrawer.value = true
  }

  const openEdit = (appointmentId: number | string) => {
    if (!canManageAppointments.value) return
    dataModalForm.value = {
      action: "update",
      rowId: appointmentId,
    }
    openAppointmentDrawer.value = true
  }

  const openDelete = (appointment: Appointment) => {
    if (!canManageAppointments.value) return
    appointmentToRemove.value = appointment
    showDeleteDialog.value = true
  }

  const openStatusChange = (
    appointment: Appointment,
    status: AppointmentStatus
  ) => {
    if (!canManageAppointments.value || appointment.id == null) return
    pendingStatusChange.value = { appointment, status }
    showStatusDialog.value = true
  }

  const closeAppointmentDrawer = () => {
    openAppointmentDrawer.value = false
    dataModalForm.value = { action: "create" }
    refreshView()
  }

  const handleConfirmStatusChange = async ({
    cancellationReason,
  }: {
    cancellationReason?: string
  }) => {
    const pending = pendingStatusChange.value
    if (!pending?.appointment.id) return

    try {
      await appointmentsStore.updateAppointmentStatus(
        pending.appointment.id,
        pending.status,
        cancellationReason
      )
      notifyUpdated("estado de la cita")
      await refreshView()
    } catch (err) {
      notifyError(err, "actualizar el estado de la cita")
    } finally {
      pendingStatusChange.value = null
    }
  }

  watch(showStatusDialog, (open) => {
    if (!open) pendingStatusChange.value = null
  })

  const handleCreateAppointment = async (
    appointment: CreateAppointmentRequest
  ) => {
    try {
      loading.value = true
      const { $api } = useNuxtApp()
      await $api("/api/appointments", {
        method: "POST",
        body: appointment,
      })
      notifyCreated("cita")
      closeAppointmentDrawer()
    } catch (err) {
      notifyError(err, "crear la cita")
    } finally {
      loading.value = false
    }
  }

  const handleUpdateAppointment = async (
    appointment: UpdateAppointmentRequest & { id: number | string }
  ) => {
    try {
      loading.value = true
      const { $api } = useNuxtApp()
      const { id, ...body } = appointment
      await $api(`/api/appointments/${id}`, {
        method: "PUT",
        body,
      })
      notifyUpdated("cita")
      closeAppointmentDrawer()
    } catch (err) {
      notifyError(err, "actualizar la cita")
    } finally {
      loading.value = false
    }
  }

  const handleDeleteAppointment = async () => {
    try {
      loading.value = true
      const { $api } = useNuxtApp()
      await $api(`/api/appointments/${appointmentToRemove.value?.id}`, {
        method: "DELETE",
      })
      notifyDeleted("cita")
      await refreshView()
    } catch (err) {
      notifyError(err, "eliminar la cita")
    } finally {
      loading.value = false
    }
  }

  const context: AppointmentManagementContext = {
    canManageAppointments,
    loading,
    openCreate,
    openEdit,
    openDelete,
    openStatusChange,
    registerRefresh,
  }

  provide(appointmentManagementKey, context)

  return {
    ...context,
    openAppointmentDrawer,
    showDeleteDialog,
    showStatusDialog,
    appointmentToRemove,
    dataModalForm,
    pendingStatusSummary,
    closeAppointmentDrawer,
    handleConfirmStatusChange,
    handleCreateAppointment,
    handleUpdateAppointment,
    handleDeleteAppointment,
  }
}

export function useAppointmentManagement() {
  const context = inject(appointmentManagementKey)
  if (!context) {
    throw new Error(
      "useAppointmentManagement debe usarse dentro de provideAppointmentManagement"
    )
  }
  return context
}
