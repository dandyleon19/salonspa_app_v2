<template>
  <AppFormSection
    title="Comisiones por servicio"
    subtitle="Opcional. Si no defines un servicio, se usa la comisión general."
  >
    <p v-if="generalCommissionLabel" class="text-caption text-medium-emphasis mb-3">
      Comisión general actual: <strong>{{ generalCommissionLabel }}</strong>
    </p>

    <AppSkeletonTransition>
      <v-skeleton-loader
        v-if="loading"
        key="user-service-commissions-skeleton"
        type="list-item-two-line@2"
      />
      <div
        v-else
        key="user-service-commissions-content"
        class="d-flex flex-column ga-3"
      >
        <v-card
          v-for="(row, index) in rows"
          :key="row.key"
          class="user-service-commissions__row"
          rounded="lg"
          elevation="0"
        >
          <v-card-text class="pa-4">
            <div class="d-flex justify-space-between align-center mb-3">
              <span class="text-subtitle-2 font-weight-bold">
                Servicio {{ index + 1 }}
              </span>
              <v-btn
                icon="tabler:trash"
                variant="text"
                size="small"
                color="error"
                @click="removeRow(index)"
              />
            </div>
            <v-row dense>
              <v-col cols="12" md="7">
                <RemoteSelect
                  v-model="row.serviceId"
                  kind="service"
                  label="Servicio"
                  :salon-id="salonId"
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col cols="12" md="5">
                <v-text-field
                  v-model.number="row.commissionPercentage"
                  v-bind="field"
                  label="Comisión"
                  type="number"
                  suffix="%"
                  min="0"
                  max="100"
                  step="0.01"
                  :rules="[rules.required, rules.commissionPercentage]"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-btn
          variant="tonal"
          color="primary"
          rounded="lg"
          @click="addRow"
        >
          <v-icon start>tabler:plus</v-icon>
          Agregar servicio
        </v-btn>

      </div>
    </AppSkeletonTransition>
  </AppFormSection>
</template>

<script setup lang="ts">
import { validationRules as rules } from "~/helpers/validationFormRules"
import { mapUserServiceCommissionsToInputs } from "~/helpers/userHelpers"
import type { UserServiceCommissionInput } from "~/interfaces/userInterfaces"
import { useUsersStore } from "~/store"

const props = defineProps<{
  userId?: number | string
  salonId?: number | string | null
  generalCommission?: number | string | null
}>()

const { field, autocomplete } = useFormFields()
const usersStore = useUsersStore()

type CommissionRow = UserServiceCommissionInput & { key: string }

const loading = ref(false)
const rows = ref<CommissionRow[]>([])

let rowKey = 0
const nextKey = () => {
  rowKey += 1
  return `service-commission-${rowKey}`
}

const generalCommissionLabel = computed(() => {
  if (props.generalCommission == null || props.generalCommission === "") return ""
  return `${props.generalCommission}%`
})

const createRow = (serviceId?: number, commissionPercentage?: number): CommissionRow => ({
  key: nextKey(),
  serviceId: serviceId ?? (null as unknown as number),
  commissionPercentage: commissionPercentage ?? (null as unknown as number),
})

// The service is chosen by the user in the picker; repeating one is refused when saving (see validate).
const addRow = () => {
  rows.value.push(
    createRow(
      undefined,
      props.generalCommission != null && props.generalCommission !== ""
        ? Number(props.generalCommission)
        : undefined
    )
  )
}

const removeRow = (index: number) => {
  rows.value.splice(index, 1)
}

const loadData = async () => {
  if (!props.userId) {
    rows.value = []
    return
  }

  loading.value = true
  try {
    const commissions = await usersStore.fetchUserServiceCommissions(props.userId)
    rows.value = mapUserServiceCommissionsToInputs(commissions).map((item) => ({
      ...item,
      key: nextKey(),
    }))
  } catch (err) {
    console.error("Error al cargar comisiones por servicio:", err)
    rows.value = []
  } finally {
    loading.value = false
  }
}

const getPayload = (): UserServiceCommissionInput[] =>
  rows.value
    .filter(
      (row) =>
        row.serviceId != null &&
        row.commissionPercentage != null &&
        row.commissionPercentage !== ("" as unknown as number)
    )
    .map((row) => ({
      serviceId: Number(row.serviceId),
      commissionPercentage: Number(row.commissionPercentage),
    }))

const hasDuplicateServices = () => {
  const ids = getPayload().map((item) => item.serviceId)
  return new Set(ids).size !== ids.length
}

const validate = () => {
  if (hasDuplicateServices()) {
    return "No puedes repetir el mismo servicio en las comisiones."
  }

  for (const row of rows.value) {
    const result = rules.commissionPercentage(row.commissionPercentage)
    if (result !== true) return String(result)
    if (row.serviceId == null) return "Selecciona un servicio para cada comisión."
  }

  return true
}

watch(
  () => props.userId,
  () => {
    loadData()
  },
  { immediate: true }
)

defineExpose({
  getPayload,
  validate,
})
</script>

<style scoped>
.user-service-commissions__row {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
