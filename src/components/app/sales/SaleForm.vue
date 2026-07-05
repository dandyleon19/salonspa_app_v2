<template>
  <AppSkeletonTransition>
    <AppFormSkeleton
      v-if="isFormLoading"
      key="sale-form-skeleton"
      :sections="3"
      :fields-per-section="4"
    />
    <v-form
      v-else
      key="sale-form-content"
      ref="saleFormRef"
      v-model="isValid"
      class="app-form"
      lazy-validation
      @submit.prevent="onSubmit"
    >
      <AppFormSection title="Venta" subtitle="Cliente, sucursal y datos generales">
        <v-row dense>
          <v-col cols="12" md="6">
            <AppDateField
              v-model="saleDate"
              label="Fecha de venta"
              required
              max-today
            />
          </v-col>
          <v-col cols="12" md="6">
            <AppTimeField
              v-model="saleTime"
              :related-date="saleDate"
              label="Hora de venta"
              required
              :max-now="saleDate === getTodayDate()"
            />
          </v-col>
          <v-col cols="12" md="6">
            <div class="sale-form__client-field">
              <v-autocomplete
                v-model="sale.clientId"
                v-bind="autocomplete"
                label="Cliente"
                :items="clientsAutocompleteList"
                item-title="label"
                item-value="value"
                clearable
                no-data-text="Sin coincidencias"
                hint="¿Cliente nuevo? Créalo aquí sin salir de esta pantalla"
                persistent-hint
                :rules="[rules.required]"
                class="sale-form__client-input"
              />
              <v-btn
                variant="tonal"
                color="primary"
                rounded="lg"
                class="sale-form__client-btn"
                @click="openCreateClientDialog"
              >
                <v-icon start>mdi-account-plus-outline</v-icon>
                Nuevo
              </v-btn>
            </div>
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="sale.branchId"
              v-bind="select"
              label="Sucursal"
              :items="branchesList"
              item-title="label"
              item-value="value"
              :disabled="!sale.clientId"
              :rules="[rules.required]"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-autocomplete
              v-model="sale.appointmentId"
              v-bind="autocomplete"
              label="Cita vinculada (opcional)"
              :items="appointmentsAutocompleteList"
              item-title="label"
              item-value="value"
              :disabled="!sale.clientId"
              :loading="loadingAppointments"
              clearable
              no-data-text="Sin citas para este cliente"
              hint="Selecciona el cliente para ver sus citas recientes"
              persistent-hint
              @update:model-value="onAppointmentSelected"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="sale.discountAmount"
              v-bind="field"
              label="Descuento general (opcional)"
              type="number"
              min="0"
              step="0.01"
              :rules="[rules.positiveNumber]"
            />
          </v-col>
          <v-col cols="12">
            <v-textarea
              v-model="sale.notes"
              v-bind="textarea"
              label="Notas"
              rows="2"
            />
          </v-col>
          <v-col v-if="sale.clientId && clientSalonId" cols="12">
            <p class="text-caption text-medium-emphasis mb-0">
              Solo se muestran sucursales y servicios del mismo salón que el cliente seleccionado.
            </p>
          </v-col>
        </v-row>
      </AppFormSection>

      <AppFormSection title="Servicios" subtitle="Agrega uno o más servicios a la venta">
        <div class="d-flex flex-column ga-3">
          <v-card
            v-for="(item, index) in sale.items"
            :key="item.key"
            class="sale-form__item-card"
            rounded="lg"
            elevation="0"
          >
            <v-card-text class="pa-4">
              <div class="d-flex justify-space-between align-center mb-3">
                <span class="text-subtitle-2 font-weight-bold">Servicio {{ index + 1 }}</span>
                <v-btn
                  v-if="sale.items.length > 1"
                  icon="mdi-delete-outline"
                  variant="text"
                  size="small"
                  color="error"
                  @click="removeItem(index)"
                />
              </div>
              <v-row dense>
                <v-col cols="12" md="6">
                  <v-autocomplete
                    v-model="item.serviceId"
                    v-bind="autocomplete"
                    label="Servicio"
                    :items="servicesAutocompleteList"
                    item-title="label"
                    item-value="value"
                    :disabled="!sale.clientId"
                    clearable
                    no-data-text="Sin coincidencias"
                    :rules="[rules.required]"
                    @update:model-value="applyServicePrice(item)"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="item.userId"
                    v-bind="select"
                    label="Profesional"
                    :items="usersList"
                    item-title="label"
                    item-value="value"
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model.number="item.quantity"
                    v-bind="field"
                    label="Cantidad"
                    type="number"
                    min="1"
                    :rules="[rules.required, rules.positiveNumber]"
                  />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model.number="item.unitPrice"
                    v-bind="field"
                    label="Precio unitario"
                    type="number"
                    min="0"
                    step="0.01"
                    hint="Vacío = precio del catálogo"
                    persistent-hint
                    :rules="[rules.positiveNumber]"
                  />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model.number="item.discountAmount"
                    v-bind="field"
                    label="Descuento ítem"
                    type="number"
                    min="0"
                    step="0.01"
                    :rules="[rules.positiveNumber]"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-btn
            variant="tonal"
            color="primary"
            rounded="lg"
            :disabled="!sale.clientId"
            @click="addItem"
          >
            <v-icon start>mdi-plus</v-icon>
            Agregar servicio
          </v-btn>
        </div>
      </AppFormSection>

      <AppFormSection
        title="Pagos"
        subtitle="Opcional. Si no registras pagos, la venta quedará pendiente de cobro."
      >
        <div class="d-flex flex-column ga-3">
          <v-card
            v-for="(payment, index) in sale.payments"
            :key="payment.key"
            class="sale-form__item-card"
            rounded="lg"
            elevation="0"
          >
            <v-card-text class="pa-4">
              <div class="d-flex justify-space-between align-center mb-3">
                <span class="text-subtitle-2 font-weight-bold">Pago {{ index + 1 }}</span>
                <v-btn
                  icon="mdi-delete-outline"
                  variant="text"
                  size="small"
                  color="error"
                  @click="removePayment(index)"
                />
              </div>
              <v-row dense>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="payment.amount"
                    v-bind="field"
                    label="Monto"
                    type="number"
                    min="0.01"
                    step="0.01"
                    hint="Se sugiere el saldo pendiente al agregar el pago"
                    persistent-hint
                    :rules="[rules.required, rules.positiveNumber]"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="payment.paymentMethod"
                    v-bind="select"
                    label="Método"
                    :items="paymentMethodItems"
                    item-title="title"
                    item-value="value"
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="payment.reference"
                    v-bind="field"
                    label="Referencia (opcional)"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-btn variant="tonal" color="primary" rounded="lg" @click="addPayment">
            <v-icon start>mdi-plus</v-icon>
            Agregar pago
          </v-btn>
        </div>
      </AppFormSection>

      <v-alert
        v-if="estimatedSaleTotal > 0 || estimatedItemsSubtotal > 0"
        type="info"
        variant="tonal"
        density="compact"
        rounded="lg"
        class="mb-4"
      >
        Subtotal de servicios:
        <strong>{{ formatCurrency(estimatedItemsSubtotal) }}</strong>
        <span v-if="sale.discountAmount">
          · Descuento general: <strong>{{ formatCurrency(sale.discountAmount) }}</strong>
        </span>
        <span>
          · Total a pagar: <strong>{{ formatCurrency(estimatedSaleTotal) }}</strong>
        </span>
        <span v-if="totalPayments > 0">
          · Pagos registrados: <strong>{{ formatCurrency(totalPayments) }}</strong>
        </span>
        <span v-if="estimatedSaleTotal > 0 && totalPayments > 0 && pendingAmount > 0">
          · Pendiente: <strong>{{ formatCurrency(pendingAmount) }}</strong>
        </span>
      </v-alert>

      <AppFormActions>
        <v-btn
          type="submit"
          color="primary"
          variant="flat"
          rounded="lg"
          class="app-form-btn--primary"
          :loading="submitting"
        >
          Registrar venta
        </v-btn>
      </AppFormActions>
    </v-form>
  </AppSkeletonTransition>

  <v-dialog
    v-model="createClientDialogOpen"
    max-width="560"
    persistent
    scrollable
  >
    <v-card rounded="xl" :loading="createClientLoading">
      <v-card-title class="d-flex align-center justify-space-between pa-5 pb-2">
        <span class="text-h6 font-weight-bold">Nuevo cliente</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          :disabled="createClientLoading"
          @click="createClientDialogOpen = false"
        />
      </v-card-title>
      <v-card-text class="pa-5 pt-2">
        <ClientForm
          :key="clientFormKey"
          :data-modal-form="clientDataModalForm"
          @create="handleCreateClient"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { validationRules as rules } from "~/helpers/validationFormRules"
import {
  belongsToSalon,
  formatAppointmentSelectLabel,
  isLinkableAppointment,
} from "~/helpers/appointmentHelpers"
import { formatCurrency } from "~/helpers/salesHelpers"
import {
  formatSoldAt,
  getCurrentTime,
  getTodayDate,
  splitIsoDateTime,
} from "~/helpers/dateTimeHelpers"
import type { Appointment } from "~/interfaces/appointmentInterfaces"
import type { Client, clientDataModalForm } from "~/interfaces/clientInterfaces"
import type { PageResponse } from "~/interfaces/PageResponse"
import type {
  CreateSaleItemPayload,
  CreateSalePaymentPayload,
  CreateSaleRequest,
  PaymentMethod,
  saleDataModalForm,
} from "~/interfaces/salesInterfaces"
import { PAYMENT_METHOD_OPTIONS } from "~/interfaces/salesInterfaces"
import { useBranchesStore, useClientsStore, useUsersStore } from "~/store"
import { useServicesStore } from "~/store/modules/service"

const { error: notifyError } = useNotification()
const { notifyCreated, notifyError: notifyApiError } = useApiNotification()

const { field, textarea, select, autocomplete } = useFormFields()

const branchesStore = useBranchesStore()
const clientsStore = useClientsStore()
const usersStore = useUsersStore()
const servicesStore = useServicesStore()

const props = defineProps<{
  dataModalForm: saleDataModalForm
  initialAppointmentId?: number | null
}>()

const emit = defineEmits<{
  (e: "create", payload: CreateSaleRequest): void
}>()

type SaleItemForm = CreateSaleItemPayload & { key: string }
type SalePaymentForm = CreateSalePaymentPayload & { key: string }

const isValid = ref(false)
const saleFormRef = ref<any>(null)
const submitting = ref(false)
const saleDate = ref(getTodayDate())
const saleTime = ref(getCurrentTime())
const clientAppointments = ref<Appointment[]>([])
const loadingAppointments = ref(false)
const createClientDialogOpen = ref(false)
const createClientLoading = ref(false)
const clientFormKey = ref(0)
const clientDataModalForm = ref<clientDataModalForm>({ action: "create" })

let fetchAppointmentsRequest = 0
let appliedInitialAppointmentId: number | null = null

let itemKey = 0

const nextKey = () => {
  itemKey += 1
  return `sale-item-${itemKey}`
}

const createItem = (): SaleItemForm => ({
  key: nextKey(),
  serviceId: null as unknown as number,
  userId: null as unknown as number,
  quantity: 1,
  unitPrice: undefined,
  discountAmount: 0,
})

const createPayment = (amount?: number): SalePaymentForm => ({
  key: nextKey(),
  amount: amount ?? (null as unknown as number),
  paymentMethod: "CASH",
  reference: "",
})

const sale = ref({
  clientId: null as number | string | null,
  branchId: null as number | string | null,
  appointmentId: null as number | null,
  discountAmount: null as number | null,
  notes: "",
  items: [createItem()] as SaleItemForm[],
  payments: [] as SalePaymentForm[],
})

const isFormLoading = useFormLoading({
  action: computed(() => props.dataModalForm.action),
  stores: [branchesStore, clientsStore, usersStore, servicesStore],
})

const paymentMethodItems = PAYMENT_METHOD_OPTIONS.map((option) => ({
  title: option.label,
  value: option.value,
}))

const selectedClient = computed(() =>
  (clientsStore.data?.content ?? []).find(
    (client) => String(client.id) === String(sale.value.clientId)
  )
)

const clientSalonId = computed(() => selectedClient.value?.salonId ?? null)

const clientsList = computed(() => {
  const options: { value: string | number | null; label: string }[] = [
    { value: null, label: "Seleccione un cliente..." },
  ]
  ;(clientsStore.data?.content ?? []).forEach((client) =>
    options.push({
      value: client.id ?? null,
      label: `${client.firstName} ${client.lastName}`.trim(),
    })
  )
  return options
})

const branchesList = computed(() => {
  const options: { value: string | number | null; label: string }[] = [
    { value: null, label: "Seleccione una sucursal..." },
  ]
  ;(branchesStore.data?.content ?? [])
    .filter((branch) => belongsToSalon(branch, clientSalonId.value))
    .forEach((branch) =>
      options.push({ value: branch.id ?? null, label: branch.name })
    )
  return options
})

const usersList = computed(() => {
  const options: { value: string | number | null; label: string }[] = [
    { value: null, label: "Seleccione un profesional..." },
  ]
  ;(usersStore.data?.content ?? []).forEach((user) =>
    options.push({
      value: user.id ?? null,
      label: user.fullName || `${user.firstName} ${user.lastName}`.trim(),
    })
  )
  return options
})

const servicesList = computed(() => {
  const options: { value: string | number | null; label: string }[] = [
    { value: null, label: "Seleccione un servicio..." },
  ]
  servicesStore.services
    .filter((service) => belongsToSalon(service, clientSalonId.value))
    .forEach((service) => {
      const priceLabel =
        service.price != null ? ` · ${formatCurrency(service.price)}` : ""
      options.push({
        value: service.id ?? null,
        label: `${service.name}${priceLabel}`,
      })
    })
  return options
})

const clientsAutocompleteList = computed(() =>
  clientsList.value.filter((option) => option.value != null)
)

const servicesAutocompleteList = computed(() =>
  servicesList.value.filter((option) => option.value != null)
)

const appointmentsAutocompleteList = computed(() =>
  clientAppointments.value.map((appointment) => ({
    value: Number(appointment.id),
    label: formatAppointmentSelectLabel(appointment),
  }))
)

const fetchClientAppointments = async () => {
  const clientId = sale.value.clientId
  if (!clientId) {
    clientAppointments.value = []
    return
  }

  const requestId = ++fetchAppointmentsRequest
  loadingAppointments.value = true

  try {
    const { $api } = useNuxtApp()
    const query: Record<string, number | string> = {
      page: 0,
      size: 50,
      clientId: Number(clientId),
    }

    if (sale.value.branchId) {
      query.branchId = Number(sale.value.branchId)
    }

    const response = await $api<PageResponse<Appointment>>("/api/appointments", {
      method: "GET",
      query,
    })

    if (requestId !== fetchAppointmentsRequest) return

    clientAppointments.value = (response.content ?? []).filter(isLinkableAppointment)
  } catch {
    if (requestId === fetchAppointmentsRequest) {
      clientAppointments.value = []
    }
  } finally {
    if (requestId === fetchAppointmentsRequest) {
      loadingAppointments.value = false
    }
  }
}

const resolveCreatedClientId = (
  created: Client | void,
  submitted: Client
): string | number | null => {
  if (created?.id != null) return created.id

  const normalizedFirstName = submitted.firstName.trim().toLowerCase()
  const normalizedLastName = submitted.lastName.trim().toLowerCase()

  const match = (clientsStore.data?.content ?? []).find(
    (client) =>
      client.firstName.trim().toLowerCase() === normalizedFirstName &&
      client.lastName.trim().toLowerCase() === normalizedLastName
  )

  return match?.id ?? null
}

const openCreateClientDialog = () => {
  clientDataModalForm.value = { action: "create" }
  clientFormKey.value += 1
  createClientDialogOpen.value = true
}

const handleCreateClient = async (client: Client) => {
  createClientLoading.value = true

  try {
    const { $api } = useNuxtApp()
    const created = await $api<Client>("/api/clients", {
      method: "POST",
      body: { ...client },
    })

    await clientsStore.fetchClients(0, 100)

    const newClientId = resolveCreatedClientId(created, client)
    if (newClientId != null) {
      sale.value.clientId = newClientId
    }

    notifyCreated("cliente")
    createClientDialogOpen.value = false
  } catch (err) {
    notifyApiError(err, "crear el cliente")
  } finally {
    createClientLoading.value = false
  }
}

const applyAppointmentFields = (appointment: Appointment) => {
  sale.value.appointmentId = Number(appointment.id)

  if (appointment.branchId) {
    sale.value.branchId = appointment.branchId
  }

  const { date, time } = splitIsoDateTime(appointment.startAt)
  if (date) saleDate.value = date
  if (time) saleTime.value = time

  const firstItem = sale.value.items[0]
  if (!firstItem) return

  if (appointment.serviceId) {
    firstItem.serviceId = Number(appointment.serviceId)
    applyServicePrice(firstItem)
  }

  if (appointment.userId) {
    firstItem.userId = Number(appointment.userId)
  }
}

const loadInitialAppointment = async () => {
  const appointmentId = props.initialAppointmentId
  if (
    !appointmentId ||
    props.dataModalForm.action !== "create" ||
    appliedInitialAppointmentId === Number(appointmentId)
  ) {
    return
  }

  try {
    const { $api } = useNuxtApp()
    const appointment = await $api<Appointment>(`/api/appointments/${appointmentId}`)

    sale.value.clientId = appointment.clientId
    await fetchClientAppointments()
    applyAppointmentFields(appointment)
    appliedInitialAppointmentId = Number(appointmentId)
  } catch (err) {
    notifyApiError(err, "cargar la cita")
  }
}

const onAppointmentSelected = (appointmentId: number | null) => {
  if (!appointmentId) return

  const appointment = clientAppointments.value.find(
    (item) => Number(item.id) === Number(appointmentId)
  )
  if (!appointment) return

  applyAppointmentFields(appointment)
}

const getServiceById = (serviceId: number | string | null) =>
  servicesStore.services.find(
    (service) => String(service.id) === String(serviceId)
  ) ?? null

const applyServicePrice = (item: SaleItemForm) => {
  const service = getServiceById(item.serviceId)
  if (service?.price != null) {
    item.unitPrice = Number(service.price)
  }
}

const estimatedItemsSubtotal = computed(() =>
  sale.value.items.reduce((total, item) => {
    const service = getServiceById(item.serviceId)
    const unitPrice = item.unitPrice ?? service?.price ?? 0
    const quantity = Number(item.quantity) || 0
    const discount = Number(item.discountAmount) || 0
    return total + Math.max(0, unitPrice * quantity - discount)
  }, 0)
)

const estimatedSaleTotal = computed(() =>
  Math.max(
    0,
    estimatedItemsSubtotal.value - (Number(sale.value.discountAmount) || 0)
  )
)

const totalPayments = computed(() =>
  sale.value.payments.reduce(
    (total, payment) => total + (Number(payment.amount) || 0),
    0
  )
)

const pendingAmount = computed(() =>
  Math.max(0, estimatedSaleTotal.value - totalPayments.value)
)

const addItem = () => {
  sale.value.items.push(createItem())
}

const removeItem = (index: number) => {
  sale.value.items.splice(index, 1)
}

const addPayment = () => {
  const suggestedAmount = Number(
    Math.max(0, estimatedSaleTotal.value - totalPayments.value).toFixed(2)
  )
  sale.value.payments.push(createPayment(suggestedAmount > 0 ? suggestedAmount : undefined))
}

const removePayment = (index: number) => {
  sale.value.payments.splice(index, 1)
}

const resetForm = () => {
  appliedInitialAppointmentId = null
  saleDate.value = getTodayDate()
  saleTime.value = getCurrentTime()
  clientAppointments.value = []
  createClientDialogOpen.value = false
  sale.value = {
    clientId: null,
    branchId: null,
    appointmentId: null,
    discountAmount: null,
    notes: "",
    items: [createItem()],
    payments: [],
  }
  saleFormRef.value?.resetValidation()
}

const buildItemPayload = (item: SaleItemForm): CreateSaleItemPayload => {
  const payload: CreateSaleItemPayload = {
    serviceId: Number(item.serviceId),
    userId: Number(item.userId),
    quantity: Number(item.quantity),
  }

  if (item.unitPrice != null && Number(item.unitPrice) >= 0) {
    payload.unitPrice = Number(item.unitPrice)
  }

  if (item.discountAmount != null && Number(item.discountAmount) > 0) {
    payload.discountAmount = Number(item.discountAmount)
  }

  return payload
}

const buildPaymentPayload = (
  payment: SalePaymentForm,
  paidAt?: string
): CreateSalePaymentPayload => ({
  amount: Number(payment.amount),
  paymentMethod: payment.paymentMethod as PaymentMethod,
  reference: payment.reference?.trim() || undefined,
  paidAt,
})

const getValidItems = () =>
  sale.value.items.filter(
    (item) =>
      item.serviceId != null &&
      item.userId != null &&
      Number(item.quantity) > 0
  )

const getValidPayments = () =>
  sale.value.payments.filter((payment) => Number(payment.amount) > 0)

const onSubmit = async () => {
  const valid = await saleFormRef.value?.validate()
  if (!valid?.valid) return

  const validItems = getValidItems()
  if (!validItems.length) {
    notifyError("Agrega al menos un servicio con profesional y cantidad.", "Datos incompletos")
    return
  }

  if (estimatedSaleTotal.value <= 0) {
    notifyError("El total de la venta debe ser mayor a 0.", "Datos inválidos")
    return
  }

  const validPayments = getValidPayments()
  if (validPayments.length && totalPayments.value > estimatedSaleTotal.value) {
    notifyError(
      "La suma de los pagos no puede superar el total de la venta.",
      "Pagos inválidos"
    )
    return
  }

  if (!saleDate.value || !saleTime.value) {
    notifyError("Completa la fecha y hora de la venta.", "Datos incompletos")
    return
  }

  const soldAt = formatSoldAt(saleDate.value, saleTime.value)

  const payload: CreateSaleRequest = {
    clientId: Number(sale.value.clientId),
    branchId: Number(sale.value.branchId),
    soldAt,
    items: validItems.map(buildItemPayload),
  }

  if (sale.value.appointmentId != null && sale.value.appointmentId > 0) {
    payload.appointmentId = Number(sale.value.appointmentId)
  }

  if (sale.value.discountAmount != null && sale.value.discountAmount > 0) {
    payload.discountAmount = Number(sale.value.discountAmount)
  }

  if (sale.value.notes?.trim()) {
    payload.notes = sale.value.notes.trim()
  }

  if (validPayments.length) {
    payload.payments = validPayments.map((payment) =>
      buildPaymentPayload(payment, soldAt)
    )
  }

  emit("create", payload)
}

watch(
  () => [props.dataModalForm, props.initialAppointmentId] as const,
  async ([form]) => {
    if (form.action === "create") {
      resetForm()
      await loadInitialAppointment()
    }
  },
  { immediate: true, deep: true }
)

watch(clientSalonId, () => {
  if (!sale.value.clientId) return

  const branchAvailable = branchesList.value.some(
    (option) => String(option.value) === String(sale.value.branchId)
  )
  if (!branchAvailable) {
    sale.value.branchId = null
  }

  sale.value.items.forEach((item) => {
    const serviceAvailable = servicesList.value.some(
      (option) => String(option.value) === String(item.serviceId)
    )
    if (!serviceAvailable) {
      item.serviceId = null as unknown as number
      item.unitPrice = undefined
    }
  })
})

watch(
  () => [sale.value.clientId, sale.value.branchId] as const,
  ([clientId], previousValue) => {
    const previousClientId = previousValue?.[0]
    if (clientId !== previousClientId) {
      sale.value.appointmentId = null
    }

    fetchClientAppointments()
  }
)

onMounted(() => {
  branchesStore.fetchBranches(0, 100)
  clientsStore.fetchClients(0, 100)
  usersStore.fetchUsers(0, 100)
  servicesStore.fetchServices()
})
</script>

<style scoped>
.sale-form__item-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.sale-form__client-field {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.sale-form__client-input {
  flex: 1;
  min-width: 0;
}

.sale-form__client-btn {
  flex-shrink: 0;
  margin-top: 2px;
}
</style>
