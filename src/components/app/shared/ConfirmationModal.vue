<template>
  <v-dialog v-model="model" max-width="420">
    <v-card>
      <!-- HEADER -->
      <v-card-title class="d-flex align-center justify-space-between">
        <span class="text-h6 font-weight-bold">
          {{ title }}
        </span>

        <v-btn icon variant="text" size="small" @click="handleCancelDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- CONTENT -->
      <v-card-text>
        <p class="mb-4">
          {{ message }}
        </p>

        <!-- INPUT OPCIONAL -->
        <v-text-field
          v-if="requireText"
          v-model="confirmationText"
          label="Escribe ELIMINAR para confirmar"
          placeholder="ELIMINAR"
          variant="outlined"
          autofocus
        />
      </v-card-text>

      <!-- ACTIONS -->
      <v-card-actions class="justify-end">
        <v-btn variant="text" color="primary" @click="handleCancelDialog">
          Cancelar
        </v-btn>

        <v-btn
          color="error"
          variant="flat"
          :disabled="confirmDisabled"
          @click="handleConfirmDialog"
        >
          Eliminar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

const props = defineProps<{
  modelValue: boolean;
  title?: string;
  message?: string;
  requireText?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm"): void;
}>();

const confirmationText = ref<string>("");

const model = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const confirmDisabled = computed(() => {
  if (!props.requireText) return false;
  return confirmationText.value !== "ELIMINAR";
});

const handleCancelDialog = () => {
  model.value = false;
};

const handleConfirmDialog = () => {
  emit("confirm");
  model.value = false;
};

watch(model, (val) => {
  if (!val) confirmationText.value = "";
});
</script>
