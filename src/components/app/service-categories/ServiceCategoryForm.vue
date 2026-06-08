<template>
  <v-form @submit.prevent="onSubmit" ref="serviceCategoryFormRef" v-model="isValid" lazy-validation class="pa-4">
    <v-text-field
        v-model="serviceCategory.name"
        label="Categoría"
        :rules="[rules.required]"
    />

    <v-text-field
        v-model="serviceCategory.description"
        label="Descripción"
    />

    <v-text-field
        v-model="serviceCategory.longDescription"
        label="Descripción Larga"
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
import type { ServiceCategory, serviceCategoryDataModalForm } from "~/interfaces/serviceCategoryInterfaces"
import { validationRules as rules } from "~/helpers/validationFormRules"
import { useServiceCategoriesStore } from "~/store";

// Composables
const serviceCategoriesStore = useServiceCategoriesStore();

const props = defineProps<{
  dataModalForm: serviceCategoryDataModalForm
}>()

const emit = defineEmits<{
  (e: "create" | "update" | "services", serviceCategory: ServiceCategory): void
}>()

const isValid = ref<boolean>(false);
const serviceCategoryFormRef = ref<any>(null);

const serviceCategory = ref<ServiceCategory>({
  name: "",
  description: "",
  longDescription: ""
})

const actionLabel = computed(() => {
  switch (props.dataModalForm.action) {
    case "create":
      return "Crear nueva categoría de servicio"
    case "update":
      getServiceCategory()
      return "Actualizar categoría de servicio"
    default:
      return "Guardar"
  }
})

// Computed
const serviceCategoriesList = computed(() => {
  return serviceCategoriesStore.list;
});

async function getServiceCategory() {
  try {
    const getServiceCategory = serviceCategoriesList.value.find(serviceCategory => serviceCategory.id == props.dataModalForm.rowId)
    serviceCategory.value = { ...getServiceCategory } as ServiceCategory
  } catch (err) {
    console.error(err)
  }
}

const onSubmit = async () => {
  const valid = await serviceCategoryFormRef.value?.validate();
  if (!valid.valid) {
    return;
  }
  emit(props.dataModalForm.action, serviceCategory.value)
}
</script>