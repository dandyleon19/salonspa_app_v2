<template>
  <AppSkeletonTransition>
    <AppFormSkeleton v-if="isFormLoading" key="salon-form-skeleton" />
    <v-form
      v-else
      key="salon-form-content"
      ref="salonFormRef"
      v-model="isValid"
      class="app-form"
      lazy-validation
      @submit.prevent="onSubmit"
    >
    <AppFormSection title="Información del salón" subtitle="Datos generales y fiscales">
      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="salon.name"
            v-bind="field"
            label="Nombre del salón"
            :rules="[rules.required]"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="salon.socialReason"
            v-bind="field"
            label="Razón social"
            :rules="[rules.required]"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="salon.fiscalAddress"
            v-bind="field"
            label="Dirección fiscal"
            prepend-inner-icon="mdi-map-marker-outline"
            :rules="[rules.required]"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="salon.rucNumber"
            v-bind="field"
            label="RUC"
            :rules="[rules.required]"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="salon.phone"
            v-bind="field"
            label="Teléfono"
            prepend-inner-icon="mdi-phone-outline"
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
import type { Salon, salonDataModalForm } from "~/interfaces/salonInterfaces"
import { validationRules as rules } from "~/helpers/validationFormRules"
import { useSalonsStore } from "~/store"

const { field } = useFormFields()
const salonsStore = useSalonsStore()

const props = defineProps<{
  dataModalForm: salonDataModalForm
}>()

const emit = defineEmits<{
  (e: "create" | "update" | "branches", salon: Salon): void
}>()

const isValid = ref(false)
const salonFormRef = ref<any>(null)

const salon = ref<Salon>({
  name: "",
  socialReason: "",
  phone: "",
  rucNumber: "",
  fiscalAddress: "",
})

const actionLabel = computed(() => {
  switch (props.dataModalForm.action) {
    case "create":
      return "Crear salón"
    case "update":
      getSalon()
      return "Guardar cambios"
    default:
      return "Guardar"
  }
})

const salonsList = computed(() => salonsStore.data?.content ?? [])

const isFormLoading = useFormLoading({
  action: computed(() => props.dataModalForm.action),
  stores: [salonsStore],
})

async function getSalon() {
  try {
    const found = salonsList.value.find((s) => s.id == props.dataModalForm.rowId)
    salon.value = { ...found } as Salon
  } catch (err) {
    console.error(err)
  }
}

const onSubmit = async () => {
  const valid = await salonFormRef.value?.validate()
  if (!valid.valid) return
  emit(props.dataModalForm.action, salon.value)
}
</script>
