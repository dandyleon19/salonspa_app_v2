<template>
  <AppSkeletonTransition>
    <AppFormSkeleton
      v-if="isFormLoading"
      key="product-category-form-skeleton"
      :sections="1"
      :fields-per-section="3"
    />
    <v-form
      v-else
      key="product-category-form-content"
      ref="productCategoryFormRef"
      v-model="isValid"
      class="app-form"
      lazy-validation
      @submit.prevent="onSubmit"
    >
    <AppFormSection title="Categoría" subtitle="Organiza los productos del salón">
      <v-row dense>
        <v-col cols="12">
          <v-text-field
            v-model="productCategory.name"
            v-bind="field"
            label="Nombre de la categoría"
            :rules="[rules.required]"
          />
        </v-col>
        <v-col cols="12">
          <v-textarea
            v-model="productCategory.description"
            v-bind="textarea"
            label="Descripción corta"
            rows="2"
          />
        </v-col>
        <v-col cols="12">
          <v-textarea
            v-model="productCategory.longDescription"
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
import type { ProductCategory, productCategoryDataModalForm } from "~/interfaces/productCategoryInterfaces"
import { validationRules as rules } from "~/helpers/validationFormRules"
import { useProductCategoriesStore } from "~/store"

const { field, textarea } = useFormFields()
const productCategoriesStore = useProductCategoriesStore()

const props = defineProps<{
  dataModalForm: productCategoryDataModalForm
}>()

const emit = defineEmits<{
  (e: "create" | "update" | "products", productCategory: ProductCategory): void
}>()

const isValid = ref(false)
const productCategoryFormRef = ref<any>(null)

const productCategory = ref<ProductCategory>({
  name: "",
  description: "",
  longDescription: "",
})

const actionLabel = computed(() => {
  switch (props.dataModalForm.action) {
    case "create":
      return "Crear categoría"
    case "update":
      getProductCategory()
      return "Guardar cambios"
    default:
      return "Guardar"
  }
})

const productCategoriesList = computed(() => productCategoriesStore.data?.content ?? [])

const isFormLoading = useFormLoading({
  action: computed(() => props.dataModalForm.action),
  stores: [productCategoriesStore],
})

async function getProductCategory() {
  try {
    const found = productCategoriesList.value.find(
      (c) => c.id == props.dataModalForm.rowId
    )
    productCategory.value = { ...found } as ProductCategory
  } catch (err) {
    console.error(err)
  }
}

const onSubmit = async () => {
  const valid = await productCategoryFormRef.value?.validate()
  if (!valid.valid) return
  emit(props.dataModalForm.action, productCategory.value)
}
</script>
