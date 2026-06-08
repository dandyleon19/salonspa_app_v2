<template>
  <v-form
    ref="clientFormRef"
    v-model="isValid"
    class="app-form"
    lazy-validation
    @submit.prevent="onSubmit"
  >
    <AppFormSection title="Datos personales" subtitle="Información básica del cliente">
      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="client.firstName"
            v-bind="field"
            label="Nombres"
            :rules="[rules.required]"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="client.lastName"
            v-bind="field"
            label="Apellidos"
            :rules="[rules.required]"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="client.documentNumber"
            v-bind="field"
            label="Nro de documento"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="client.gender"
            v-bind="select"
            label="Género"
            :items="genderOptions"
            item-title="label"
            item-value="value"
            clearable
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="client.birthDate"
            v-bind="field"
            label="Fecha de nacimiento"
            type="date"
          />
        </v-col>
      </v-row>
    </AppFormSection>

    <AppFormSection title="Contacto" subtitle="Medios de comunicación">
      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="client.phone"
            v-bind="field"
            label="Teléfono / Celular"
            prepend-inner-icon="mdi-phone-outline"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="client.email"
            v-bind="field"
            label="Correo electrónico"
            type="email"
            prepend-inner-icon="mdi-email-outline"
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
import { useClientsStore } from "~/store/modules/client"
import type { Client, clientDataModalForm } from "~/interfaces/clientInterfaces"

const { field, select } = useFormFields()
const clientsStore = useClientsStore()

const props = defineProps<{
  dataModalForm: clientDataModalForm
}>()

const emit = defineEmits<{
  (e: "create" | "update" | "clinicalRecords", client: Client): void
}>()

const isValid = ref(false)
const clientFormRef = ref<any>(null)

const client = ref<Client>({
  firstName: "",
  lastName: "",
  email: "",
  gender: undefined,
  phone: "",
  birthDate: "",
  documentNumber: "",
  clinicalRecords: [],
})

const genderOptions = [
  { label: "Masculino", value: "MALE" },
  { label: "Femenino", value: "FEMALE" },
  { label: "Otro", value: "OTHER" },
]

const actionLabel = computed(() => {
  switch (props.dataModalForm.action) {
    case "create":
      return "Crear cliente"
    case "update":
      getClient()
      return "Guardar cambios"
    default:
      return "Guardar"
  }
})

const clientsList = computed(() => clientsStore.data?.content ?? [])

async function getClient() {
  try {
    const found = clientsList.value.find((c) => c.id == props.dataModalForm.rowId)
    client.value = { ...found } as Client
  } catch (err) {
    console.error(err)
  }
}

const onSubmit = async () => {
  const valid = await clientFormRef.value?.validate()
  if (!valid.valid) return
  emit(props.dataModalForm.action, client.value)
}
</script>
