<template>
  <AppSkeletonTransition>
    <AppFormSkeleton
      v-if="isFormLoading"
      key="clinical-record-form-skeleton"
      :sections="3"
      :fields-per-section="3"
    />
    <v-form
      v-else
      key="clinical-record-form-content"
      ref="clinicalRecordFormRef"
      v-model="isValid"
      class="app-form"
      lazy-validation
      @submit.prevent="onSubmit"
    >
    <AppFormSection title="Sesión" subtitle="Fecha y hora de atención">
      <v-row dense>
        <v-col cols="12" md="6">
          <AppDateField
            v-model="sessionDate"
            label="Fecha de sesión"
            required
            max-today
          />
        </v-col>
        <v-col cols="12" md="6">
          <AppTimeField
            v-model="sessionTime"
            :related-date="sessionDate"
            label="Hora de sesión"
            required
            max-now
          />
        </v-col>
      </v-row>
    </AppFormSection>

    <AppFormSection title="Detalle clínico" subtitle="Diagnóstico, tratamiento y notas">
      <v-row dense>
        <v-col cols="12">
          <v-textarea
            v-model="clinicalRecord.diagnosis"
            v-bind="textarea"
            label="Diagnóstico"
          />
        </v-col>
        <v-col cols="12">
          <v-textarea
            v-model="clinicalRecord.treatment"
            v-bind="textarea"
            label="Tratamiento"
          />
        </v-col>
        <v-col cols="12">
          <v-textarea
            v-model="clinicalRecord.observations"
            v-bind="textarea"
            label="Observaciones"
            rows="2"
          />
        </v-col>
      </v-row>
    </AppFormSection>

    <AppFormSection title="Asignación" subtitle="Sucursal, especialista y servicio">
      <v-row dense>
        <v-col cols="12" md="6">
          <v-select
            v-model="clinicalRecord.branchId"
            v-bind="select"
            label="Sucursal"
            :items="branchesList"
            item-title="label"
            item-value="value"
            :rules="[rules.required]"
          />
        </v-col>
        <v-col cols="12" md="6">
          <RemoteSelect
            v-model="clinicalRecord.userId"
            kind="user"
            label="Trabajador"
            :disabled="isStaffUser"
            :rules="[rules.required]"
          />
        </v-col>
        <v-col cols="12">
          <RemoteSelect
            v-model="clinicalRecord.serviceId"
            kind="service"
            label="Servicio asociado"
            :salon-id="clientSalonId"
            @select="recordService = $event as Service | null"
          />
        </v-col>
      </v-row>
    </AppFormSection>

    <AppFormSection
      v-if="!isStaffUser"
      title="Próxima cita"
      subtitle="Agendar seguimiento al guardar el expediente"
    >
      <v-row dense>
        <v-col cols="12">
          <v-switch
            v-model="scheduleNextAppointment"
            color="primary"
            label="Agendar próxima cita"
            hide-details
          />
        </v-col>

        <template v-if="scheduleNextAppointment">
          <v-col cols="12" md="6">
            <AppDateField
              v-model="nextAppointmentDate"
              label="Fecha de la próxima cita"
              required
              :min="getTodayDate()"
            />
          </v-col>
          <v-col cols="12" md="6">
            <AppTimeField
              v-model="nextAppointmentTime"
              :related-date="nextAppointmentDate"
              label="Hora de la próxima cita"
              required
              min-now
            />
          </v-col>
          <v-col v-if="nextEstimatedEndTimeLabel" cols="12">
            <v-alert type="info" variant="tonal" density="compact" rounded="lg">
              Hora estimada de fin: <strong>{{ nextEstimatedEndTimeLabel }}</strong>
              ({{ nextDurationMinutes }} min)
            </v-alert>
          </v-col>
          <v-col cols="12" md="6">
            <RemoteSelect
              v-model="nextAppointment.userId"
              kind="user"
              label="Profesional"
              :disabled="isStaffUser"
              :rules="scheduleNextAppointment ? [rules.required] : []"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="nextAppointment.branchId"
              v-bind="select"
              label="Sucursal"
              :items="filteredBranchesList"
              item-title="label"
              item-value="value"
              :rules="scheduleNextAppointment ? [rules.required] : []"
            />
          </v-col>
          <v-col cols="12">
            <RemoteSelect
              v-model="nextAppointment.serviceId"
              kind="service"
              label="Servicio"
              :salon-id="clientSalonId"
              hint="Si se omite, se usará el servicio del expediente"
              persistent-hint
              @select="nextService = $event as Service | null"
            />
          </v-col>
          <v-col cols="12">
            <v-textarea
              v-model="nextAppointment.notes"
              v-bind="textarea"
              label="Notas de la próxima cita"
              rows="2"
            />
          </v-col>
        </template>
      </v-row>
    </AppFormSection>

    <AppFormActions>
      <v-btn
        type="submit"
        color="primary"
        variant="flat"
        rounded="lg"
        class="app-form-btn--primary"
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
import { useClinicalRecordsStore } from "~/store/modules/clinicalRecord"
import type { ClinicalRecord, clinicalRecordDataModalForm } from "~/interfaces/clinicalRecordInterfaces"
import type { NextAppointmentRequest } from "~/interfaces/appointmentInterfaces"
import type { Client } from "~/interfaces/clientInterfaces"
import { useBranchesStore } from "~/store"
import type { Service } from "~/interfaces/serviceInterfaces"
import { useAuthStore } from "~/store/modules/auth"

const { textarea, select, autocomplete } = useFormFields()

const clinicalRecordsStore = useClinicalRecordsStore()
const branchesStore = useBranchesStore()
const authStore = useAuthStore()

const isStaffUser = computed(() => authStore.isStaff)

const props = defineProps<{
  dataModalForm: clinicalRecordDataModalForm
  clientId?: string | number
}>()

const emit = defineEmits<{
  (e: "create" | "update" | "clinicalRecords", clinicalRecord: ClinicalRecord): void
}>()

const { error: notifyError } = useNotification()

const isValid = ref(false)
const clinicalRecordFormRef = ref<any>(null)
const loadingRecord = ref(false)
const sessionDate = ref("")
const sessionTime = ref("")
const scheduleNextAppointment = ref(false)
const nextAppointmentDate = ref("")
const nextAppointmentTime = ref("")

const clinicalRecord = ref<ClinicalRecord>({
  diagnosis: "",
  treatment: "",
  observations: "",
  sessionDate: "",
  userId: "",
  branchId: "",
  serviceId: "",
})

const nextAppointment = ref<{
  userId: string | number | null
  branchId: string | number | null
  serviceId: string | number | null
  notes: string
}>({
  userId: null,
  branchId: null,
  serviceId: null,
  notes: "",
})

const resolvedClientId = computed(
  () => props.clientId ?? clinicalRecord.value.clientId ?? null
)

// The client of the record, asked to the server by id (only its salon is needed, to offer that salon's branches
// and services).
const selectedClient = ref<Client | null>(null)

watch(
  resolvedClientId,
  async (id) => {
    selectedClient.value = null
    if (id == null || id === "") return

    try {
      const { $api } = useNuxtApp()
      const client = await $api<Client>(`/api/clients/${id}`, { method: "GET" })
      if (String(resolvedClientId.value) === String(id)) selectedClient.value = client
    } catch (err) {
      console.error("Error al obtener el cliente:", err)
    }
  },
  { immediate: true }
)

const clientSalonId = computed(() => selectedClient.value?.salonId ?? null)

// Set by the service pickers (they search the services on the server) once they know the chosen ones.
const recordService = ref<Service | null>(null)
const nextService = ref<Service | null>(null)

// The next appointment lasts what its own service lasts, or what the record's service does when it has none.
const nextSelectedService = computed(() => nextService.value ?? recordService.value)

const nextDurationMinutes = computed(() =>
  getServiceDurationMinutes(nextSelectedService.value)
)

const nextEstimatedEndTimeLabel = computed(() => {
  if (!nextAppointmentDate.value || !nextAppointmentTime.value) return ""

  const startAt = combineDateAndTime(nextAppointmentDate.value, nextAppointmentTime.value)
  return formatEstimatedEndTime(startAt, nextDurationMinutes.value)
})

const actionLabel = computed(() => {
  switch (props.dataModalForm.action) {
    case "create":
      return "Crear historial"
    case "update":
      return "Guardar cambios"
    default:
      return "Guardar"
  }
})

const isFormLoading = useFormLoading({
  action: computed(() => props.dataModalForm.action),
  stores: [branchesStore],
  recordLoading: loadingRecord,
})

const filteredBranchesList = computed(() => {
  const options: { value: string | null; label: string }[] = [
    { value: null, label: "Seleccione una sucursal..." },
  ]
  ;(branchesStore.data?.content ?? [])
    .filter((branch) => belongsToSalon(branch, clientSalonId.value))
    .forEach((branch) =>
      options.push({ value: branch.id ?? null, label: branch.name })
    )
  return options
})

const branchesList = computed(() => filteredBranchesList.value)

const resetNextAppointment = () => {
  scheduleNextAppointment.value = false
  nextAppointmentDate.value = ""
  nextAppointmentTime.value = ""
  nextAppointment.value = {
    userId: null,
    branchId: null,
    serviceId: null,
    notes: "",
  }
}

const applyNextAppointment = (data?: NextAppointmentRequest | ClinicalRecord["nextAppointment"]) => {
  if (!data || typeof data !== "object" || !("startAt" in data)) {
    resetNextAppointment()
    return
  }

  const { date, time } = splitIsoDateTime(data.startAt)
  scheduleNextAppointment.value = true
  nextAppointmentDate.value = date
  nextAppointmentTime.value = time
  nextAppointment.value = {
    userId: data.userId ?? null,
    branchId: data.branchId ?? null,
    serviceId: data.serviceId ?? null,
    notes: data.notes ?? "",
  }
}

async function loadClinicalRecord() {
  if (!props.dataModalForm.rowId) return
  if (loadingRecord.value) return
  if (String(clinicalRecord.value.id) === String(props.dataModalForm.rowId)) return

  try {
    loadingRecord.value = true
    const found = await clinicalRecordsStore.fetchClinicalRecordById(props.dataModalForm.rowId)
    clinicalRecord.value = { ...found } as ClinicalRecord

    const { date, time } = splitIsoDateTime(found?.sessionDate)
    sessionDate.value = date
    sessionTime.value = time
    applyNextAppointment(found?.nextAppointment)
  } catch (err) {
    console.error(err)
  } finally {
    loadingRecord.value = false
  }
}

const buildNextAppointmentPayload = (): NextAppointmentRequest | undefined => {
  if (!scheduleNextAppointment.value) return undefined

  const payload: NextAppointmentRequest = {
    userId: Number(nextAppointment.value.userId),
    branchId: Number(nextAppointment.value.branchId),
    startAt: combineDateAndTime(nextAppointmentDate.value, nextAppointmentTime.value),
    notes: nextAppointment.value.notes?.trim() || undefined,
  }

  if (nextAppointment.value.serviceId) {
    payload.serviceId = Number(nextAppointment.value.serviceId)
  }

  return payload
}

const onSubmit = async () => {
  const valid = await clinicalRecordFormRef.value?.validate()
  if (!valid.valid) return

  if (isDateTimeAfterNow(sessionDate.value, sessionTime.value)) {
    notifyError("La fecha y hora de la sesión no pueden ser posteriores al momento actual.", "Sesión inválida")
    return
  }

  if (
    scheduleNextAppointment.value &&
    !isDateTimeAfterNow(nextAppointmentDate.value, nextAppointmentTime.value)
  ) {
    notifyError("La fecha y hora de la próxima cita deben ser posteriores al momento actual.", "Próxima cita inválida")
    return
  }

  const nextAppt = buildNextAppointmentPayload()

  const payload: ClinicalRecord = {
    ...clinicalRecord.value,
    sessionDate: combineDateAndTime(sessionDate.value, sessionTime.value),
    ...(nextAppt ? { nextAppointment: nextAppt } : {}),
  }

  emit(props.dataModalForm.action, payload)
}

watch(
  () => [clinicalRecord.value.userId, clinicalRecord.value.branchId, clinicalRecord.value.serviceId],
  ([userId, branchId, serviceId]) => {
    if (!scheduleNextAppointment.value) return
    if (!nextAppointment.value.userId && userId) nextAppointment.value.userId = userId
    if (!nextAppointment.value.branchId && branchId) nextAppointment.value.branchId = branchId
    if (!nextAppointment.value.serviceId && serviceId) nextAppointment.value.serviceId = serviceId
  }
)

watch(
  () => props.dataModalForm,
  (form) => {
    if (form.action === "update" && form.rowId) {
      loadClinicalRecord()
    }
  },
  { immediate: true, deep: true }
)

onMounted(() => {
  branchesStore.fetchBranches(0, 100)

  // A worker can only record sessions of their own: the professional is them.
  if (isStaffUser.value && !clinicalRecord.value.userId) {
    clinicalRecord.value.userId = authStore.user?.id ?? null
  }
})
</script>
