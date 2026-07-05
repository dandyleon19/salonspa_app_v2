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
                icon="mdi-delete-outline"
                variant="text"
                size="small"
                color="error"
                @click="removeRow(index)"
              />
            </div>
            <v-row dense>
              <v-col cols="12" md="7">
                <v-autocomplete
                  v-model="row.serviceId"
                  v-bind="autocomplete"
                  label="Servicio"
                  :items="getServiceOptionsForRow(row.serviceId)"
                  item-title="label"
                  item-value="value"
                  clearable
                  no-data-text="Sin servicios disponibles"
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
          :disabled="!availableServices.length"
          @click="addRow"
        >
          <v-icon start>mdi-plus</v-icon>
          Agregar servicio
        </v-btn>

        <p v-if="!availableServices.length && rows.length" class="text-caption text-medium-emphasis mb-0">
          Ya asignaste comisión a todos los servicios disponibles.
        </p>
      </div>
    </AppSkeletonTransition>
  </AppFormSection>
</template>

<script setup lang="ts">
import { belongsToSalon } from "~/helpers/appointmentHelpers"
import { validationRules as rules } from "~/helpers/validationFormRules"
import { mapUserServiceCommissionsToInputs } from "~/helpers/userHelpers"
import type { UserServiceCommissionInput } from "~/interfaces/userInterfaces"
import { useUsersStore } from "~/store"
import { useServicesStore } from "~/store/modules/service"

const props = defineProps<{
  userId?: number | string
  salonId?: number | string | null
  generalCommission?: number | string | null
}>()

const { field, autocomplete } = useFormFields()
const usersStore = useUsersStore()
const servicesStore = useServicesStore()

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

const salonServices = computed(() =>
  servicesStore.services.filter((service) =>
    belongsToSalon(service, props.salonId)
  )
)

const serviceOptions = computed(() =>
  salonServices.value.map((service) => ({
    value: Number(service.id),
    label: service.name,
  }))
)

const selectedServiceIds = computed(() =>
  rows.value
    .map((row) => row.serviceId)
    .filter((serviceId) => serviceId != null)
    .map((serviceId) => Number(serviceId))
)

const availableServices = computed(() =>
  serviceOptions.value.filter(
    (option) => !selectedServiceIds.value.includes(Number(option.value))
  )
)

const getServiceOptionsForRow = (serviceId: number | null | undefined) => {
  const currentId = serviceId != null ? Number(serviceId) : null
  return serviceOptions.value.filter(
    (option) =>
      currentId === Number(option.value) ||
      !selectedServiceIds.value.includes(Number(option.value))
  )
}

const createRow = (serviceId?: number, commissionPercentage?: number): CommissionRow => ({
  key: nextKey(),
  serviceId: serviceId ?? (null as unknown as number),
  commissionPercentage: commissionPercentage ?? (null as unknown as number),
})

const addRow = () => {
  const nextService = availableServices.value[0]
  rows.value.push(
    createRow(
      nextService ? Number(nextService.value) : undefined,
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
    await servicesStore.fetchServices(0, 100)
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
