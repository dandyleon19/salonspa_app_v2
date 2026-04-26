<template>
  <v-form @submit.prevent="onSubmit" ref="clientFormRef" v-model="isValid" lazy-validation class="pa-4">
    <v-text-field
        v-model="client.firstName"
        label="Nombres"
        :rules="[rules.required]"
    />

    <v-text-field
        v-model="client.lastName"
        label="Apellidos"
        :rules="[rules.required]"
    />

    <v-text-field
        v-model="client.documentNumber"
        label="Nro de Documento"
    />

    <v-text-field
        v-model="client.phone"
        label="Teléfono/Celular"
    />

    <v-text-field
        v-model="client.email"
        label="Email"
    />

    <v-select
        v-model="client.gender"
        label="Género"
        :items="genderOptions"
        item-title="label"
        item-value="value"
    />

    <v-text-field
        v-model="client.birthDate"
        label="Fecha de nacimiento"
        type="date"
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
import { useClientsStore } from "~/store/modules/client";
import type { Client, clientDataModalForm } from "~/interfaces/clientInterfaces";

// Composables
const clientsStore = useClientsStore();

const props = defineProps<{
  dataModalForm: clientDataModalForm
}>()

const emit = defineEmits<{
  (e: "create" | "update" | "clinicalRecords", client: Client): void
}>()

const isValid = ref<boolean>(false);
const clientFormRef = ref<any>(null);

const client = ref<Client>({
  firstName: "",
  lastName: "",
  email: "",
  gender: undefined,
  phone: "",
  birthDate: "",
  documentNumber: "",
})

const genderOptions = [
  { label: 'Masculino', value: 'MALE' },
  { label: 'Femenino', value: 'FEMALE' },
  { label: 'Otro', value: 'OTHER' }
]

const actionLabel = computed(() => {
  switch (props.dataModalForm.action) {
    case "create":
      return "Crear nuevo cliente"
    case "update":
      getClient()
      return "Actualizar cliente"
    default:
      return "Guardar"
  }
})

// Computed
const clientsList = computed(() => {
  return clientsStore.list;
});

async function getClient() {
  try {
    const getClient = clientsList.value.find(client => client.id == props.dataModalForm.rowId)
    client.value = { ...getClient } as Client
  } catch (err) {
    console.error(err)
  }
}

const onSubmit = async () => {
  const valid = await clientFormRef.value?.validate();
  if (!valid.valid) {
    return;
  }
  emit(props.dataModalForm.action, client.value)
}
</script>