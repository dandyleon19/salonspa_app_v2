<template>
  <v-form
    ref="userFormRef"
    v-model="isValid"
    class="app-form"
    lazy-validation
    @submit.prevent="onSubmit"
  >
    <template v-if="!['changePassword', 'changeBranches'].includes(dataModalForm.action)">
      <AppFormSection title="Datos del trabajador" subtitle="Información personal y laboral">
        <v-row dense>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="user.firstName"
              v-bind="field"
              label="Nombres"
              :rules="[rules.required]"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="user.lastName"
              v-bind="field"
              label="Apellidos"
              :rules="[rules.required]"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="user.email"
              v-bind="field"
              label="Correo"
              type="email"
              prepend-inner-icon="mdi-email-outline"
              :rules="[rules.required, rules.email]"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="user.commissionPercentage"
              v-bind="field"
              label="Porcentaje de comisión"
              type="number"
              suffix="%"
              :rules="[rules.required, rules.decimal]"
            />
          </v-col>
        </v-row>
      </AppFormSection>
    </template>

    <template v-if="['create', 'changePassword'].includes(dataModalForm.action)">
      <AppFormSection
        :title="dataModalForm.action === 'changePassword' ? 'Nueva contraseña' : 'Acceso'"
        subtitle="Credenciales de ingreso al sistema"
      >
        <v-row dense>
          <v-col cols="12">
            <v-text-field
              v-model="user.password"
              v-bind="field"
              label="Contraseña"
              type="password"
              autocomplete="off"
              prepend-inner-icon="mdi-lock-outline"
              :rules="[rules.required, rules.minLength(6)]"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="user.passwordConfirmation"
              v-bind="field"
              label="Confirmar contraseña"
              type="password"
              autocomplete="off"
              prepend-inner-icon="mdi-lock-check-outline"
              :rules="[rules.required, rules.matchPassword(user.password)]"
            />
          </v-col>
        </v-row>
      </AppFormSection>
    </template>

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
import type { User, userDataModalForm } from "~/interfaces/userInterfaces"
import { validationRules as rules } from "~/helpers/validationFormRules"
import { useUsersStore } from "~/store"

const { field } = useFormFields()
const usersStore = useUsersStore()

const props = defineProps<{
  dataModalForm: userDataModalForm
}>()

const emit = defineEmits<{
  (e: "create" | "update" | "changePassword", user: User): void
}>()

const isValid = ref(false)
const userFormRef = ref<any>(null)

const user = ref<User>({
  firstName: "",
  lastName: "",
  email: "",
  isActive: true,
  commissionPercentage: "",
  password: "",
  passwordConfirmation: "",
})

const actionLabel = computed(() => {
  switch (props.dataModalForm.action) {
    case "create":
      return "Crear trabajador"
    case "update":
      getUser()
      return "Guardar cambios"
    case "changePassword":
      getUser()
      return "Actualizar contraseña"
    default:
      return "Guardar"
  }
})

const usersList = computed(() => usersStore.data?.content ?? [])

async function getUser() {
  try {
    const found = usersList.value.find((u) => u.id == props.dataModalForm.rowId)
    user.value = { ...found, password: "", passwordConfirmation: "" } as User
  } catch (err) {
    console.error(err)
  }
}

const onSubmit = async () => {
  const valid = await userFormRef.value?.validate()
  if (!valid.valid) return
  emit(props.dataModalForm.action, user.value)
}
</script>
