<template>
  <v-form
    ref="clinicalRecordFormRef"
    v-model="isValid"
    class="app-form"
    lazy-validation
    @submit.prevent="onSubmit"
  >
    <AppFormSection title="Sesión" subtitle="Fecha y hora de atención">
      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="clinicalRecord.sessionDate"
            v-bind="field"
            label="Fecha"
            type="date"
            prepend-inner-icon="mdi-calendar-outline"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="sessionTime"
            v-bind="field"
            label="Hora"
            type="time"
            prepend-inner-icon="mdi-clock-outline"
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
          <v-select
            v-model="clinicalRecord.userId"
            v-bind="select"
            label="Trabajador"
            :items="usersList"
            item-title="label"
            item-value="value"
            :rules="[rules.required]"
          />
        </v-col>
        <v-col cols="12">
          <v-select
            v-model="clinicalRecord.serviceId"
            v-bind="select"
            label="Servicio asociado"
            :items="servicesList"
            item-title="label"
            item-value="value"
            clearable
          />
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
      >
        {{ actionLabel }}
      </v-btn>
    </AppFormActions>
  </v-form>
</template>

<script setup lang="ts">
import { validationRules as rules } from "~/helpers/validationFormRules"
import { useClinicalRecordsStore } from "~/store/modules/clinicalRecord"
import type { ClinicalRecord, clinicalRecordDataModalForm } from "~/interfaces/clinicalRecordInterfaces"
import { useBranchesStore, useUsersStore } from "~/store"
import { useServicesStore } from "~/store/modules/service"

const { field, textarea, select } = useFormFields()

const clinicalRecordsStore = useClinicalRecordsStore()
const branchesStore = useBranchesStore()
const usersStore = useUsersStore()
const servicesStore = useServicesStore()

const props = defineProps<{
  dataModalForm: clinicalRecordDataModalForm
}>()

const emit = defineEmits<{
  (e: "create" | "update" | "clinicalRecords", clinicalRecord: ClinicalRecord): void
}>()

const isValid = ref(false)
const clinicalRecordFormRef = ref<any>(null)
const sessionTime = ref("")

const clinicalRecord = ref<ClinicalRecord>({
  diagnosis: "",
  treatment: "",
  observations: "",
  sessionDate: "",
  userId: "",
  branchId: "",
  serviceId: "",
})

const actionLabel = computed(() => {
  switch (props.dataModalForm.action) {
    case "create":
      return "Crear historial"
    case "update":
      getClinicalRecord()
      return "Guardar cambios"
    default:
      return "Guardar"
  }
})

const clinicalRecordsList = computed(() => clinicalRecordsStore.list)

const branchesList = computed(() => {
  const options: { value: string | null; label: string }[] = [
    { value: null, label: "Seleccione una sucursal..." },
  ]
  ;(branchesStore.data?.content ?? []).forEach((b) =>
    options.push({ value: b.id ?? null, label: b.name })
  )
  return options
})

const servicesList = computed(() => {
  const options: { value: string | null; label: string }[] = [
    { value: null, label: "Seleccione un servicio..." },
  ]
  servicesStore.list.forEach((s) =>
    options.push({ value: s.id ?? null, label: s.name })
  )
  return options
})

const usersList = computed(() => {
  const options: { value: string | null; label: string }[] = [
    { value: null, label: "Seleccione un trabajador..." },
  ]
  ;(usersStore.data?.content ?? []).forEach((u) =>
    options.push({
      value: u.id ?? null,
      label: `${u.firstName} ${u.lastName}`,
    })
  )
  return options
})

async function getClinicalRecord() {
  try {
    const found = clinicalRecordsList.value.find(
      (r) => r.id == props.dataModalForm.rowId
    )
    clinicalRecord.value = { ...found } as ClinicalRecord
  } catch (err) {
    console.error(err)
  }
}

const onSubmit = async () => {
  const valid = await clinicalRecordFormRef.value?.validate()
  if (!valid.valid) return

  clinicalRecord.value = {
    ...clinicalRecord.value,
    sessionDate: `${clinicalRecord.value.sessionDate}T${sessionTime.value}`,
  }
  emit(props.dataModalForm.action, clinicalRecord.value)
}

onMounted(() => {
  branchesStore.fetchBranches()
  usersStore.fetchUsers(0, 100)
  servicesStore.fetchServices()
})
</script>
