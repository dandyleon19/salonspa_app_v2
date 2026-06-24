<template>
  <v-dialog
    v-model="model"
    max-width="440"
    transition="dialog-transition"
  >
    <v-card class="user-action-modal" rounded="xl" elevation="0">
      <v-card-text class="user-action-modal__body pa-6 pa-sm-7">
        <div class="user-action-modal__icon-wrap mb-4">
          <v-avatar size="52" :color="confirmColor" variant="tonal">
            <v-icon size="26">{{ confirmIcon }}</v-icon>
          </v-avatar>
        </div>

        <h2 class="text-h6 font-weight-bold mb-2 text-center app-font-heading">
          {{ modalTitle }}
        </h2>

        <p class="text-body-2 text-medium-emphasis mb-0 text-center">
          {{ modalMessage }}
        </p>
      </v-card-text>

      <v-divider />

      <v-card-actions class="user-action-modal__actions pa-4 pa-sm-5">
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
          :color="confirmColor"
          rounded="lg"
          size="large"
          @click="handleConfirm"
        >
          {{ confirmLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import {
  getUserActionColor,
  getUserActionIcon,
  getUserActionLabel,
  type UserTableAction,
} from "~/interfaces/userInterfaces"

const props = defineProps<{
  modelValue: boolean
  action?: UserTableAction | null
  userSummary?: string
}>()

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void
  (e: "confirm"): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
})

const confirmLabel = computed(() =>
  props.action ? getUserActionLabel(props.action) : "Confirmar"
)

const confirmColor = computed(() =>
  props.action ? getUserActionColor(props.action) : "primary"
)

const confirmIcon = computed(() =>
  props.action ? getUserActionIcon(props.action) : "mdi-help-circle-outline"
)

const modalTitle = computed(() => {
  if (!props.action) return "Confirmar cambio"
  if (props.action === "status:activate") return "Activar usuario"
  if (props.action === "status:deactivate") return "Desactivar usuario"
  return "Confirmar cambio"
})

const modalMessage = computed(() => {
  const baseMessage = (() => {
    if (!props.action) return "¿Deseas continuar con este cambio?"

    if (props.action === "status:activate") {
      return "¿Deseas activar este usuario?"
    }

    if (props.action === "status:deactivate") {
      return "¿Deseas desactivar este usuario? No podrá acceder al sistema."
    }

    return "¿Deseas continuar con este cambio?"
  })()

  if (!props.userSummary) return baseMessage
  return `${baseMessage} ${props.userSummary}`
})

const handleCancel = () => {
  model.value = false
}

const handleConfirm = () => {
  emit("confirm")
  model.value = false
}
</script>

<style scoped>
.user-action-modal {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  overflow: hidden;
}

.user-action-modal__icon-wrap {
  display: flex;
  justify-content: center;
}

.user-action-modal__actions {
  gap: 10px;
}
</style>
