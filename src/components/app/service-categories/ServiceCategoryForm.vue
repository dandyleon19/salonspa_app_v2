<template>
  <AppSkeletonTransition>
    <AppFormSkeleton
      v-if="isFormLoading"
      key="service-category-form-skeleton"
      :sections="1"
      :fields-per-section="3"
    />
    <v-form
      v-else
      key="service-category-form-content"
      ref="serviceCategoryFormRef"
      v-model="isValid"
      class="app-form"
      lazy-validation
      @submit.prevent="onSubmit"
    >
    <AppFormSection title="Categoría" subtitle="Organiza los servicios del salón">
      <v-row dense>
        <v-col cols="12">
          <v-text-field
            v-model="serviceCategory.name"
            v-bind="field"
            label="Nombre de la categoría"
            :rules="[rules.required]"
          />
        </v-col>
        <v-col cols="12">
          <v-textarea
            v-model="serviceCategory.description"
            v-bind="textarea"
            label="Descripción corta"
            rows="2"
          />
        </v-col>
        <v-col cols="12">
          <v-textarea
            v-model="serviceCategory.longDescription"
            v-bind="textarea"
            label="Descripción detallada"
            rows="4"
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
  </AppSkeletonTransition>
</template>

<script setup lang="ts">
import type { ServiceCategory, serviceCategoryDataModalForm } from "~/interfaces/serviceCategoryInterfaces"
import { validationRules as rules } from "~/helpers/validationFormRules"
import { useServiceCategoriesStore } from "~/store"

const { field, textarea } = useFormFields()
const serviceCategoriesStore = useServiceCategoriesStore()

const props = defineProps<{
  dataModalForm: serviceCategoryDataModalForm
}>()

const emit = defineEmits<{
  (e: "create" | "update" | "services", serviceCategory: ServiceCategory): void
}>()

const isValid = ref(false)
const serviceCategoryFormRef = ref<any>(null)

const serviceCategory = ref<ServiceCategory>({
  name: "",
  description: "",
  longDescription: "",
})

const actionLabel = computed(() => {
  switch (props.dataModalForm.action) {
    case "create":
      return "Crear categoría"
    case "update":
      getServiceCategory()
      return "Guardar cambios"
    default:
      return "Guardar"
  }
})

const serviceCategoriesList = computed(() => serviceCategoriesStore.data?.content ?? [])

const isFormLoading = useFormLoading({
  action: computed(() => props.dataModalForm.action),
  stores: [serviceCategoriesStore],
})

async function getServiceCategory() {
  try {
    const found = serviceCategoriesList.value.find(
      (c) => c.id == props.dataModalForm.rowId
    )
    serviceCategory.value = { ...found } as ServiceCategory
  } catch (err) {
    console.error(err)
  }
}

const onSubmit = async () => {
  const valid = await serviceCategoryFormRef.value?.validate()
  if (!valid.valid) return
  emit(props.dataModalForm.action, serviceCategory.value)
}
</script>
