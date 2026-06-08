<template>
  <v-form @submit.prevent="onSubmit" ref="branchFormRef" v-model="isValid" lazy-validation class="pa-4">
    <v-text-field
        v-model="branch.name"
        label="Nombre"
        density="comfortable"
        :rules="[rules.required]"
    />

    <v-text-field
        v-model="branch.address"
        label="Dirección"
        density="comfortable"
        :rules="[rules.required]"
    />

    <v-text-field
        v-model="branch.city"
        label="Ciudad"
        density="comfortable"
        :rules="[rules.required]"
    />

    <div class="d-flex justify-end mt-4">
      <v-btn type="submit" color="primary">
        {{ actionLabel }}
      </v-btn>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import type { ResponseInterface } from "~/interfaces/appInterfaces"
import type { Branch, branchDataModalForm } from "~/interfaces/salonInterfaces"
import { validationRules as rules } from "~/helpers/validationFormRules"
import { useBranchesStore } from "~/store";

// Composables
const branchesStore = useBranchesStore();

const props = defineProps<{
  dataModalForm: branchDataModalForm
}>()

const emit = defineEmits<{
  (e: "create" | "update", branch: Branch): void
}>()

const isValid = ref<boolean>(false);
const branchFormRef = ref<any>(null);

const branch = ref<Branch>({
  name: '',
  address: '',
  city: ''
})

const actionLabel = computed(() => {
  switch (props.dataModalForm.action) {
    case "create":
      return "Crear nueva sucursal"
    case "update":
      getBranch()
      return "Actualizar sucursal"
    default:
      return "Guardar"
  }
})

// Computed
const branchesList = computed(() => {
  return branchesStore.list;
});

async function getBranch() {
  try {
    const getBranch = branchesList.value.find(branch => branch.id == props.dataModalForm.rowId)
    branch.value = { ...getBranch } as Branch
  } catch (err) {
    console.error(err)
  }
}

const onSubmit = async () => {
  const valid = await branchFormRef.value?.validate();
  if (!valid.valid) {
    return;
  }
  emit(props.dataModalForm.action, branch.value)
}
</script>