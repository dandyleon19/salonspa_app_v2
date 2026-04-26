<template>
  <v-form @submit.prevent="onSubmit" ref="salonFormRef" v-model="isValid" lazy-validation class="pa-4">
    <v-text-field
        v-model="salon.name"
        label="Nombre del Salón"
        :rules="[rules.required]"
    />

    <v-text-field
        v-model="salon.socialReason"
        label="Razón Social"
        :rules="[rules.required]"
    />

    <v-text-field
        v-model="salon.fiscalAddress"
        label="Dirección Fiscal"
        :rules="[rules.required]"
    />

    <v-text-field
        v-model="salon.rucNumber"
        label="Ruc"
        :rules="[rules.required]"
    />

    <v-text-field
        v-model="salon.phone"
        label="Teléfono"
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
import type { Salon, salonDataModalForm } from "~/interfaces/salonInterfaces"
import { validationRules as rules } from "~/helpers/validationFormRules"
import { useSalonsStore } from "~/store";

// Composables
const salonsStore = useSalonsStore();

const props = defineProps<{
  dataModalForm: salonDataModalForm
}>()

const emit = defineEmits<{
  (e: "create" | "update" | "branches", salon: Salon): void
}>()

const isValid = ref<boolean>(false);
const salonFormRef = ref<any>(null);

const salon = ref<Salon>({
  name: "",
  socialReason: "",
  phone: "",
  rucNumber: "",
  fiscalAddress: ""
})

const actionLabel = computed(() => {
  switch (props.dataModalForm.action) {
    case "create":
      return "Crear nuevo salón"
    case "update":
      getSalon()
      return "Actualizar salón"
    default:
      return "Guardar"
  }
})

// Computed
const salonsList = computed(() => {
  return salonsStore.list;
});

async function getSalon() {
  try {
    const getSalon = salonsList.value.find(salon => salon.id == props.dataModalForm.rowId)
    salon.value = { ...getSalon } as Salon
  } catch (err) {
    console.error(err)
  }
}

const onSubmit = async () => {
  const valid = await salonFormRef.value?.validate();
  if (!valid.valid) {
    return;
  }
  emit(props.dataModalForm.action, salon.value)
}
</script>