<template>
  <AppSkeletonTransition>
    <AppFormSkeleton v-if="isFormLoading" key="branch-form-skeleton" />
    <v-form
      v-else
      key="branch-form-content"
      ref="branchFormRef"
      v-model="isValid"
      class="app-form"
      lazy-validation
      @submit.prevent="onSubmit"
    >
    <AppFormSection title="Sucursal" subtitle="Ubicación y datos de contacto">
      <v-row dense>
        <v-col cols="12">
          <v-text-field
            v-model="branch.name"
            v-bind="field"
            label="Nombre"
            :rules="[rules.required]"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="branch.address"
            v-bind="field"
            label="Dirección"
            prepend-inner-icon="mdi-map-marker-outline"
            :rules="[rules.required]"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="branch.city"
            v-bind="field"
            label="Ciudad"
            prepend-inner-icon="mdi-city-variant-outline"
            :rules="[rules.required]"
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
import type { Branch, branchDataModalForm } from "~/interfaces/salonInterfaces"
import { validationRules as rules } from "~/helpers/validationFormRules"
import { useBranchesStore } from "~/store"

const { field } = useFormFields()
const branchesStore = useBranchesStore()

const props = defineProps<{
  dataModalForm: branchDataModalForm
}>()

const emit = defineEmits<{
  (e: "create" | "update", branch: Branch): void
}>()

const isValid = ref(false)
const branchFormRef = ref<any>(null)

const branch = ref<Branch>({
  name: "",
  address: "",
  city: "",
})

const actionLabel = computed(() => {
  switch (props.dataModalForm.action) {
    case "create":
      return "Crear sucursal"
    case "update":
      getBranch()
      return "Guardar cambios"
    default:
      return "Guardar"
  }
})

const branchesList = computed(() => branchesStore.data?.content ?? [])

const isFormLoading = useFormLoading({
  action: computed(() => props.dataModalForm.action),
  stores: [branchesStore],
})

async function getBranch() {
  try {
    const found = branchesList.value.find((b) => b.id == props.dataModalForm.rowId)
    branch.value = { ...found } as Branch
  } catch (err) {
    console.error(err)
  }
}

const onSubmit = async () => {
  const valid = await branchFormRef.value?.validate()
  if (!valid.valid) return
  emit(props.dataModalForm.action, branch.value)
}
</script>
