<template>
  <AppSkeletonTransition>
    <AppFormSkeleton
      v-if="isFormLoading"
      key="user-form-skeleton"
      :sections="dataModalForm.action === 'changePassword' ? 1 : 2"
      :fields-per-section="dataModalForm.action === 'changePassword' ? 2 : 3"
    />
    <v-form
      v-else
      key="user-form-content"
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
              :rules="[rules.required, rules.maxLength(255)]"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="user.lastName"
              v-bind="field"
              label="Apellidos"
              :rules="[rules.required, rules.maxLength(255)]"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="user.email"
              v-bind="field"
              label="Correo"
              type="email"
              prepend-inner-icon="tabler:mail"
              :rules="[rules.required, rules.email, rules.maxLength(255)]"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="user.commissionPercentage"
              v-bind="field"
              label="Comisión general (%)"
              type="number"
              suffix="%"
              :rules="[rules.required, rules.commissionPercentage]"
            />
          </v-col>
          <v-col v-if="showSalonSelect" cols="12" md="6">
            <RemoteSelect
              v-model="user.salonId"
              kind="salon"
              label="Salón"
              prepend-inner-icon="tabler:building"
              :rules="[rules.required]"
            />
          </v-col>
          <v-col v-if="dataModalForm.action !== 'changePassword'" cols="12" md="6">
            <v-select
              v-model="user.role"
              v-bind="select"
              label="Rol"
              :items="roleOptions"
              item-title="label"
              item-value="value"
              :disabled="user.role === 'SUPER_ADMIN'"
              :rules="[rules.required]"
            />
          </v-col>
        </v-row>
      </AppFormSection>

      <UserServiceCommissionsSection
        v-if="showServiceCommissions"
        ref="serviceCommissionsRef"
        :user-id="user.id"
        :salon-id="resolvedSalonId"
        :general-commission="user.commissionPercentage"
      />
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
              prepend-inner-icon="tabler:lock"
              hint="Mínimo 8 caracteres"
              :rules="[rules.required, rules.minLength(8), rules.maxLength(255)]"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="user.passwordConfirmation"
              v-bind="field"
              label="Confirmar contraseña"
              type="password"
              autocomplete="off"
              prepend-inner-icon="tabler:lock-check"
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
  </AppSkeletonTransition>
</template>

<script setup lang="ts">
import type { User, userDataModalForm, UserServiceCommissionInput } from "~/interfaces/userInterfaces"
import { USER_ROLE_OPTIONS } from "~/interfaces/userInterfaces"
import { validationRules as rules } from "~/helpers/validationFormRules"
import { useAuthStore } from "~/store/modules/auth"
import { useSubscriptionStore } from "~/store/modules/subscription"
import { useUsersStore } from "~/store"

const { field, select } = useFormFields()
const { error: notifyError } = useNotification()
const authStore = useAuthStore()
const usersStore = useUsersStore()
const subscriptionStore = useSubscriptionStore()

const props = defineProps<{
  dataModalForm: userDataModalForm
}>()

const emit = defineEmits<{
  (
    e: "create" | "update" | "changePassword",
    user: User,
    serviceCommissions?: UserServiceCommissionInput[]
  ): void
}>()

const isValid = ref(false)
const userFormRef = ref<any>(null)
const serviceCommissionsRef = ref<{
  getPayload: () => UserServiceCommissionInput[]
  validate: () => true | string
} | null>(null)

const user = ref<User>({
  firstName: "",
  lastName: "",
  email: "",
  isActive: true,
  role: "STAFF_USER",
  salonId: undefined,
  commissionPercentage: "",
  password: "",
  passwordConfirmation: "",
})

const isSuperAdmin = computed(() => authStore.isSuperAdmin)

const canManageServiceCommissions = computed(
  () => authStore.isAdmin || authStore.isSuperAdmin
)

const showServiceCommissions = computed(
  () =>
    props.dataModalForm.action === "update" &&
    canManageServiceCommissions.value &&
    subscriptionStore.hasFeature("commissions") &&
    user.value.id != null
)

const resolvedSalonId = computed(
  () => user.value.salonId ?? authStore.user?.salonId ?? null
)

const showSalonSelect = computed(
  () => isSuperAdmin.value && props.dataModalForm.action === "create"
)

const roleOptions = computed(() => {
  if (user.value.role === "SUPER_ADMIN") {
    return [{ value: "SUPER_ADMIN", label: "Super administrador" }]
  }
  return USER_ROLE_OPTIONS
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

const isFormLoading = useFormLoading({
  action: computed(() => props.dataModalForm.action),
  stores: [usersStore],
})

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

  let serviceCommissions: UserServiceCommissionInput[] | undefined

  if (showServiceCommissions.value && serviceCommissionsRef.value) {
    const commissionsValidation = serviceCommissionsRef.value.validate()
    if (commissionsValidation !== true) {
      notifyError(String(commissionsValidation), "Comisiones inválidas")
      return
    }
    serviceCommissions = serviceCommissionsRef.value.getPayload()
  }

  emit(
    props.dataModalForm.action,
    user.value,
    props.dataModalForm.action === "update" ? serviceCommissions : undefined
  )
}
</script>
