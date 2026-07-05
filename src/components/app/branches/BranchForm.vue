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
        <v-col v-if="showSalonSelect" cols="12" md="6">
          <v-select
            v-model="branch.salonId"
            v-bind="select"
            label="Salón"
            :items="salonOptions"
            item-title="title"
            item-value="value"
            prepend-inner-icon="tabler:building"
            :rules="[rules.required]"
          />
        </v-col>
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
            prepend-inner-icon="tabler:map-pin"
            :rules="[rules.required]"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="branch.city"
            v-bind="field"
            label="Ciudad"
            prepend-inner-icon="tabler:building-community"
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
import { useAuthStore } from "~/store/modules/auth"
import { useBranchesStore, useSalonsStore } from "~/store"

const { field, select } = useFormFields()
const authStore = useAuthStore()
const branchesStore = useBranchesStore()
const salonsStore = useSalonsStore()

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
  salonId: undefined,
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

  const payload: Branch = { ...branch.value }

  if (showSalonSelect.value && payload.salonId != null && payload.salonId !== "") {
    payload.salonId = Number(payload.salonId)
  }

  emit(props.dataModalForm.action, payload)
}
</script>
