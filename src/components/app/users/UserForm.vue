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
          <v-col v-if="showSalonSelect" cols="12" md="6">
            <v-select
              v-model="user.salonId"
              v-bind="select"
              label="Salón"
              :items="salonOptions"
              item-title="title"
              item-value="value"
              prepend-inner-icon="mdi-domain"
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
  </AppSkeletonTransition>
</template>

<script setup lang="ts">
import type { User, userDataModalForm } from "~/interfaces/userInterfaces"
import { USER_ROLE_OPTIONS } from "~/interfaces/userInterfaces"
import { validationRules as rules } from "~/helpers/validationFormRules"
import { useAuthStore } from "~/store/modules/auth"
import { useSalonsStore, useUsersStore } from "~/store"

const { field, select } = useFormFields()
const authStore = useAuthStore()
const usersStore = useUsersStore()
const salonsStore = useSalonsStore()

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
  role: "STAFF_USER",
  salonId: undefined,
  commissionPercentage: "",
  password: "",
  passwordConfirmation: "",
})

const isSuperAdmin = computed(() => authStore.isSuperAdmin)

const showSalonSelect = computed(
  () => isSuperAdmin.value && props.dataModalForm.action === "create"
)

const salonOptions = computed(() =>
  (salonsStore.data?.content ?? []).map((salon) => ({
    title: salon.name,
    value: salon.id != null ? Number(salon.id) : salon.id,
  }))
)

const salonsLoading = ref(false)

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
  recordLoading: computed(
    () => showSalonSelect.value && salonsLoading.value
  ),
})

async function loadSalons() {
  salonsLoading.value = true
  try {
    await salonsStore.fetchSalons(0, 100)
  } finally {
    salonsLoading.value = false
  }
}

watch(
  () => [props.dataModalForm.action, isSuperAdmin.value] as const,
  ([action, superAdmin]) => {
    if (action === "create" && superAdmin) {
      loadSalons()
    }
  },
  { immediate: true }
)

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
