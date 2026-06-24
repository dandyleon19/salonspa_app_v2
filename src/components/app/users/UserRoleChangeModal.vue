<template>
  <v-dialog
    v-model="model"
    max-width="440"
    transition="dialog-transition"
  >
    <v-card class="user-role-modal" rounded="xl" elevation="0">
      <v-card-text class="user-role-modal__body pa-6 pa-sm-7">
        <div class="user-role-modal__icon-wrap mb-4">
          <v-avatar size="52" color="primary" variant="tonal">
            <v-icon size="26">mdi-shield-account-outline</v-icon>
          </v-avatar>
        </div>

        <h2 class="text-h6 font-weight-bold mb-2 text-center app-font-heading">
          Cambiar rol
        </h2>

        <p class="text-body-2 text-medium-emphasis mb-0 text-center">
          Selecciona el nuevo rol para {{ userSummary || "este usuario" }}.
        </p>

        <v-select
          v-model="selectedRole"
          class="mt-5"
          label="Nuevo rol"
          :items="roleOptions"
          item-title="label"
          item-value="value"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          hide-details="auto"
        />
      </v-card-text>

      <v-divider />

      <v-card-actions class="user-role-modal__actions pa-4 pa-sm-5">
        <v-btn
          class="flex-grow-1"
          variant="tonal"
          color="primary"
          rounded="lg"
          size="large"
          @click="handleCancel"
        >
          Volver
        </v-btn>

        <v-btn
          class="flex-grow-1"
          variant="flat"
          color="primary"
          rounded="lg"
          size="large"
          :disabled="!selectedRole || selectedRole === currentRole"
          @click="handleConfirm"
        >
          Cambiar rol
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { getAvailableRoleTargets } from "~/helpers/userHelpers"
import {
  USER_ROLE_LABELS,
  type UserRole,
} from "~/interfaces/userInterfaces"

const props = defineProps<{
  modelValue: boolean
  currentRole?: UserRole | null
  userSummary?: string
}>()

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void
  (e: "confirm", role: UserRole): void
}>()

const selectedRole = ref<UserRole | null>(null)

const model = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
})

const roleOptions = computed(() =>
  getAvailableRoleTargets(props.currentRole).map((role) => ({
    value: role,
    label: USER_ROLE_LABELS[role],
  }))
)

watch(
  () => props.modelValue,
  (open) => {
    if (!open) {
      selectedRole.value = null
      return
    }

    selectedRole.value = roleOptions.value[0]?.value ?? null
  }
)

const handleCancel = () => {
  model.value = false
}

const handleConfirm = () => {
  if (!selectedRole.value || selectedRole.value === props.currentRole) return

  emit("confirm", selectedRole.value)
  model.value = false
}
</script>

<style scoped>
.user-role-modal {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  overflow: hidden;
}

.user-role-modal__icon-wrap {
  display: flex;
  justify-content: center;
}

.user-role-modal__actions {
  gap: 10px;
}
</style>
