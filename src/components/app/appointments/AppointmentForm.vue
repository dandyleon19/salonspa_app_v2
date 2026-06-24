<template>
  <AppSkeletonTransition>
    <AppFormSkeleton
      v-if="isFormLoading"
      key="appointment-form-skeleton"
      :sections="2"
      :fields-per-section="4"
    />
    <v-form
      v-else
      key="appointment-form-content"
      ref="appointmentFormRef"
      v-model="isValid"
      class="app-form"
      lazy-validation
      @submit.prevent="onSubmit"
    >
    <AppFormSection title="Cita" subtitle="Fecha, hora y notas">
      <v-row dense>
        <v-col cols="12" md="6">
          <AppDateField
            v-model="appointmentDate"
            label="Fecha de la cita"
            required
            :min="getTodayDate()"
          />
        </v-col>
        <v-col cols="12" md="6">
          <AppTimeField
            v-model="appointmentTime"
            :related-date="appointmentDate"
            label="Hora de la cita"
            required
            min-now
          />
        </v-col>
        <v-col v-if="estimatedEndTimeLabel" cols="12">
          <v-alert type="info" variant="tonal" density="compact" rounded="lg">
            Hora estimada de fin: <strong>{{ estimatedEndTimeLabel }}</strong>
            ({{ selectedDurationMinutes }} min{{ selectedService ? "" : ", duración por defecto" }})
          </v-alert>
        </v-col>
        <v-col v-if="isUpdateMode && currentStatus" cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-1">Estado actual</p>
          <v-chip
            :color="getAppointmentStatusColor(currentStatus)"
            variant="tonal"
            rounded="pill"
            size="small"
          >
            {{ getAppointmentStatusLabel(currentStatus) }}
          </v-chip>
        </v-col>
        <v-col
          v-if="isUpdateMode && currentStatus === 'CANCELLED' && cancellationReasonDisplay"
          cols="12"
        >
          <v-alert type="warning" variant="tonal" density="compact" rounded="lg">
            Motivo de cancelación: {{ cancellationReasonDisplay }}
          </v-alert>
        </v-col>
        <v-col cols="12">
          <v-textarea
            v-model="appointment.notes"
            v-bind="textarea"
            label="Notas"
            rows="2"
          />
        </v-col>
      </v-row>
    </AppFormSection>

    <AppFormSection title="Asignación" subtitle="Cliente, profesional, sucursal y servicio del mismo salón">
      <v-row dense>
        <v-col cols="12" md="6">
          <v-select
            v-model="appointment.clientId"
            v-bind="select"
            label="Cliente"
            :items="clientsList"
            item-title="label"
            item-value="value"
            :disabled="isUpdateMode"
            :rules="[rules.required]"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="appointment.userId"
            v-bind="select"
            label="Profesional"
            :items="usersList"
            item-title="label"
            item-value="value"
            :disabled="!appointment.clientId"
            :rules="[rules.required]"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="appointment.branchId"
            v-bind="select"
            label="Sucursal"
            :items="branchesList"
            item-title="label"
            item-value="value"
            :disabled="!appointment.clientId"
            :rules="[rules.required]"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="appointment.serviceId"
            v-bind="select"
            label="Servicio"
            :items="servicesList"
            item-title="label"
            item-value="value"
            :disabled="!appointment.clientId"
            clearable
          />
        </v-col>
        <v-col v-if="appointment.clientId && clientSalonId" cols="12">
          <p class="text-caption text-medium-emphasis mb-0">
            Solo se muestran sucursales y servicios del mismo salón que el cliente seleccionado.
          </p>
        </v-col>
      </v-row>
    </AppFormSection>

    <AppFormActions>
      <v-btn
        type="submit"
        color="primary"
        variant="flat"
        rounded="lg"
        class="app-form-btn--primary"
        :loading="loadingAppointment"
      >
        {{ actionLabel }}
      </v-btn>
    </AppFormActions>
    </v-form>
  </AppSkeletonTransition>
</template>

<script setup lang="ts">
import { validationRules as rules } from "~/helpers/validationFormRules"
import {
  combineDateAndTime,
  getTodayDate,
  isDateTimeAfterNow,
  splitIsoDateTime,
} from "~/helpers/dateTimeHelpers"
import {
  belongsToSalon,
  formatEstimatedEndTime,
  getServiceDurationMinutes,
} from "~/helpers/appointmentHelpers"
import type {
  Appointment,
  AppointmentStatus,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  appointmentDataModalForm,
} from "~/interfaces/appointmentInterfaces"
import {
  getAppointmentStatusColor,
  getAppointmentStatusLabel,
} from "~/interfaces/appointmentInterfaces"
import {
  useBranchesStore,
  useClientsStore,
  useUsersStore,
} from "~/store"
import { useServicesStore } from "~/store/modules/service"

const { textarea, select } = useFormFields()

const branchesStore = useBranchesStore()
const clientsStore = useClientsStore()
const usersStore = useUsersStore()
const servicesStore = useServicesStore()

const props = defineProps<{
  dataModalForm: appointmentDataModalForm
}>()

const emit = defineEmits<{
  (e: "create", appointment: CreateAppointmentRequest): void
  (e: "update", appointment: UpdateAppointmentRequest & { id: number | string }): void
}>()

const isValid = ref(false)
const appointmentFormRef = ref<any>(null)
const loadingAppointment = ref(false)
const appointmentDate = ref("")
const appointmentTime = ref("")
const currentStatus = ref<AppointmentStatus | undefined>()
const cancellationReasonDisplay = ref("")

const appointment = ref<{
  id?: number | string
  clientId: number | string | null
  userId: number | string | null
  branchId: number | string | null
  serviceId: number | string | null
  notes: string
}>({
  clientId: null,
  userId: null,
  branchId: null,
  serviceId: null,
  notes: "",
})

const isUpdateMode = computed(() => props.dataModalForm.action === "update")

const isFormLoading = useFormLoading({
  action: computed(() => props.dataModalForm.action),
  stores: [branchesStore, clientsStore, usersStore, servicesStore],
  recordLoading: loadingAppointment,
})

const selectedClient = computed(() =>
  (clientsStore.data?.content ?? []).find(
    (client) => String(client.id) === String(appointment.value.clientId)
  )
)

const clientSalonId = computed(() => selectedClient.value?.salonId ?? null)

const servicesItems = computed(() => servicesStore.services)

const selectedService = computed(() =>
  servicesItems.value.find(
    (service) => String(service.id) === String(appointment.value.serviceId)
  ) ?? null
)

const selectedDurationMinutes = computed(() =>
  getServiceDurationMinutes(selectedService.value)
)

const estimatedEndTimeLabel = computed(() => {
  if (!appointmentDate.value || !appointmentTime.value) return ""

  const startAt = combineDateAndTime(appointmentDate.value, appointmentTime.value)
  return formatEstimatedEndTime(startAt, selectedDurationMinutes.value)
})

const actionLabel = computed(() => {
  switch (props.dataModalForm.action) {
    case "create":
      return "Crear cita"
    case "update":
      return "Guardar cambios"
    default:
      return "Guardar"
  }
})

const branchesList = computed(() => {
  const options: { value: string | number | null; label: string }[] = [
    { value: null, label: "Seleccione una sucursal..." },
  ]
  ;(branchesStore.data?.content ?? [])
    .filter((branch) => belongsToSalon(branch, clientSalonId.value))
    .forEach((branch) =>
      options.push({ value: branch.id ?? null, label: branch.name })
    )
  return options
})

const clientsList = computed(() => {
  const options: { value: string | number | null; label: string }[] = [
    { value: null, label: "Seleccione un cliente..." },
  ]
  ;(clientsStore.data?.content ?? []).forEach((client) =>
    options.push({
      value: client.id ?? null,
      label: `${client.firstName} ${client.lastName}`.trim(),
    })
  )
  return options
})

const usersList = computed(() => {
  const options: { value: string | number | null; label: string }[] = [
    { value: null, label: "Seleccione un profesional..." },
  ]
  ;(usersStore.data?.content ?? []).forEach((user) =>
    options.push({
      value: user.id ?? null,
      label: user.fullName || `${user.firstName} ${user.lastName}`.trim(),
    })
  )
  return options
})

const servicesList = computed(() => {
  const options: { value: string | number | null; label: string }[] = [
    { value: null, label: "Seleccione un servicio..." },
  ]
  servicesItems.value
    .filter((service) => belongsToSalon(service, clientSalonId.value))
    .forEach((service) =>
      options.push({ value: service.id ?? null, label: service.name })
    )
  return options
})

const isOptionAvailable = (
  value: string | number | null,
  options: { value: string | number | null; label: string }[]
) => {
  if (value == null || value === "") return true
  return options.some((option) => String(option.value) === String(value))
}

const resetForm = () => {
  appointment.value = {
    clientId: null,
    userId: null,
    branchId: null,
    serviceId: null,
    notes: "",
  }
  currentStatus.value = undefined
  cancellationReasonDisplay.value = ""
  appointmentDate.value = ""
  appointmentTime.value = ""
  appointmentFormRef.value?.resetValidation()
}

const applyAppointment = (data: Appointment) => {
  const { date, time } = splitIsoDateTime(data.startAt)

  appointment.value = {
    id: data.id,
    clientId: data.clientId ?? null,
    userId: data.userId ?? null,
    branchId: data.branchId ?? null,
    serviceId: data.serviceId ?? null,
    notes: data.notes ?? "",
  }
  currentStatus.value = data.status
  cancellationReasonDisplay.value = data.cancellationReason ?? ""
  appointmentDate.value = date
  appointmentTime.value = time
}

async function loadAppointment() {
  if (!props.dataModalForm.rowId) return
  if (loadingAppointment.value) return
  if (String(appointment.value.id) === String(props.dataModalForm.rowId)) {
    return
  }

  try {
    loadingAppointment.value = true
    const { $api } = useNuxtApp()
    const data = await $api<Appointment>(`/api/appointments/${props.dataModalForm.rowId}`)
    applyAppointment(data)
  } catch (err) {
    console.error(err)
  } finally {
    loadingAppointment.value = false
  }
}

const onSubmit = async () => {
  const valid = await appointmentFormRef.value?.validate()
  if (!valid.valid) return

  if (!isDateTimeAfterNow(appointmentDate.value, appointmentTime.value)) {
    return
  }

  if (props.dataModalForm.action === "create") {
    const payload: CreateAppointmentRequest = {
      clientId: Number(appointment.value.clientId),
      userId: Number(appointment.value.userId),
      branchId: Number(appointment.value.branchId),
      startAt: combineDateAndTime(appointmentDate.value, appointmentTime.value),
      notes: appointment.value.notes?.trim() || undefined,
    }

    if (appointment.value.serviceId) {
      payload.serviceId = Number(appointment.value.serviceId)
    }

    emit("create", payload)
    return
  }

  const payload: UpdateAppointmentRequest = {
    userId: Number(appointment.value.userId),
    branchId: Number(appointment.value.branchId),
    startAt: combineDateAndTime(appointmentDate.value, appointmentTime.value),
    notes: appointment.value.notes?.trim() || undefined,
  }

  if (appointment.value.serviceId) {
    payload.serviceId = Number(appointment.value.serviceId)
  }

  emit("update", {
    id: appointment.value.id!,
    ...payload,
  })
}

watch(
  () => props.dataModalForm,
  (form) => {
    if (form.action === "create") {
      resetForm()
      return
    }

    if (form.action === "update" && form.rowId) {
      loadAppointment()
    }
  },
  { immediate: true, deep: true }
)

watch(clientSalonId, () => {
  if (!appointment.value.clientId) return

  if (!isOptionAvailable(appointment.value.branchId, branchesList.value)) {
    appointment.value.branchId = null
  }

  if (!isOptionAvailable(appointment.value.serviceId, servicesList.value)) {
    appointment.value.serviceId = null
  }
})

onMounted(() => {
  branchesStore.fetchBranches(0, 100)
  clientsStore.fetchClients(0, 100)
  usersStore.fetchUsers(0, 100)
  servicesStore.fetchServices()
})
</script>
