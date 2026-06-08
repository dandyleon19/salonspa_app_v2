<template>
  <v-form @submit.prevent="onSubmit" ref="clinicalRecordFormRef" v-model="isValid" lazy-validation class="pa-4">
    <v-text-field
        v-model="clinicalRecord.sessionDate"
        label="Fecha"
        type="date"
    />

    <v-text-field
        v-model="sessionTime"
        label="Hora"
        type="time"
    />

    <v-textarea
        v-model="clinicalRecord.diagnosis"
        label="Diagnóstico"
        rows="3"
        auto-grow
    />

    <v-textarea
        v-model="clinicalRecord.treatment"
        label="Tratamiento"
        rows="3"
        auto-grow
    />

    <v-textarea
        v-model="clinicalRecord.observations"
        label="Observaciones"
        rows="3"
        auto-grow
    />

    <v-select
        v-model="clinicalRecord.branchId"
        label="Sucursal"
        :items="branchesList"
        item-title="label"
        item-value="value"
        :rules="[rules.required]"
    />

    <v-select
        v-model="clinicalRecord.userId"
        label="Trabajador"
        :items="usersList"
        item-title="label"
        item-value="value"
        :rules="[rules.required]"
    />

    <v-select
        v-model="clinicalRecord.serviceId"
        label="Servicio asociado"
        :items="servicesList"
        item-title="label"
        item-value="value"
    />

    <div class="d-flex justify-end mt-4">
      <v-btn type="submit" color="primary">
        {{ actionLabel }}
      </v-btn>
    </div>
  </v-form>
</template>
<script setup lang="ts">
import { validationRules as rules } from "~/helpers/validationFormRules";
import { useClinicalRecordsStore } from "~/store/modules/clinicalRecord";
import type { ClinicalRecord, clinicalRecordDataModalForm } from "~/interfaces/clinicalRecordInterfaces";
import { computed } from "vue";
import { useBranchesStore, useClientsStore, useUsersStore } from "~/store";
import { useServicesStore } from "~/store/modules/service";

// Composables
const clinicalRecordsStore = useClinicalRecordsStore();
const branchesStore = useBranchesStore();
const usersStore = useUsersStore()
const clientsStore = useClientsStore();
const servicesStore = useServicesStore();

const props = defineProps<{
  dataModalForm: clinicalRecordDataModalForm
}>()

const emit = defineEmits<{
  (e: "create" | "update" | "clinicalRecords", clinicalRecord: ClinicalRecord): void
}>()

const isValid = ref<boolean>(false);
const clinicalRecordFormRef = ref<any>(null);
const sessionTime = ref<string>("")

const clinicalRecord = ref<ClinicalRecord>({
  diagnosis: "",
  treatment: "",
  observations: "",
  sessionDate: "",
  userId: "",
  branchId: "",
  serviceId: ""
})

const genderOptions = [
  { label: 'Masculino', value: 'MALE' },
  { label: 'Femenino', value: 'FEMALE' },
  { label: 'Otro', value: 'OTHER' }
]

const actionLabel = computed(() => {
  switch (props.dataModalForm.action) {
    case "create":
      return "Crear nuevo historial clínico"
    case "update":
      getClinicalRecord()
      return "Actualizar historial clínico"
    default:
      return "Guardar"
  }
})

// Computed
const clinicalRecordsList = computed(() => {
  return clinicalRecordsStore.list;
});

const clientsList = computed(() => {
  const options = [
    { value: null, label: "Seleccione un salón..." }
  ]
  clientsStore.list.forEach(b =>
      options.push({ value: b.id, label: `${b.firstName} ${b.lastName}` })
  )
  return options
});

const branchesList = computed(() => {
  const options = [
    { value: null, label: "Seleccione un salón..." }
  ]
  branchesStore.list.forEach(b =>
      options.push({ value: b.id, label: b.name })
  )
  return options
});

const servicesList = computed(() => {
  const options = [
    { value: null, label: "Seleccione un salón..." }
  ]
  servicesStore.list.forEach(b =>
      options.push({ value: b.id, label: b.name })
  )
  return options
});

const usersList = computed(() => {
  const options = [
    { value: null, label: "Seleccione un salón..." }
  ]
  usersStore.list.forEach(b =>
      options.push({ value: b.id, label: `${b.firstName} ${b.lastName}` })
  )
  return options
});

async function getClinicalRecord() {
  try {
    const getClinicalRecord = clinicalRecordsList.value.find(clinicalRecord => clinicalRecord.id == props.dataModalForm.rowId)
    clinicalRecord.value = { ...getClinicalRecord } as ClinicalRecord
  } catch (err) {
    console.error(err)
  }
}

const onSubmit = async () => {
  const valid = await clinicalRecordFormRef.value?.validate();
  if (!valid.valid) {
    return;
  }
  clinicalRecord.value = { ...clinicalRecord.value, sessionDate: `${clinicalRecord.value.sessionDate}T${sessionTime.value}`}
  emit(props.dataModalForm.action, clinicalRecord.value)
}

// Mounted
onMounted(() => {
  branchesStore.fetchBranches();
  usersStore.fetchUsers();
  clientsStore.fetchClients();
  servicesStore.fetchServices();
});
</script>