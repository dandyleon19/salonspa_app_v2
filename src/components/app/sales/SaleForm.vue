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
              <RemoteSelect
                v-model="sale.clientId"
                kind="client"
                label="Cliente"
                :rules="[rules.required]"
                class="sale-form__client-input"
                @select="selectedClient = $event as Client | null"
              />
              <v-btn
                variant="tonal"
                color="primary"
                rounded="lg"
                class="sale-form__client-btn"
                @click="openCreateClientDialog"
              >
                <v-icon start>tabler:user-plus</v-icon>
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
                  icon="tabler:trash"
                  variant="text"
                  size="small"
                  color="error"
                  @click="removeItem(index)"
                />
              </div>
              <v-row dense>
                <v-col cols="12" md="6">
                  <RemoteSelect
                    v-model="item.serviceId"
                    kind="service"
                    label="Servicio"
                    detail
                    :salon-id="clientSalonId"
                    :disabled="!sale.clientId"
                    :rules="[rules.required]"
                    @select="onServiceSelected(item, $event as Service | null)"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <RemoteSelect
                    v-model="item.userId"
                    kind="user"
                    label="Profesional"
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
                    :rules="[rules.required, rules.wholeNumber, rules.greaterThanZero]"
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
            <v-icon start>tabler:plus</v-icon>
            Agregar servicio
          </v-btn>
        </div>
      </AppFormSection>

      <AppFormSection
        v-if="hasProductsFeature"
        title="Productos"
        subtitle="Agrega productos vendidos en esta venta (opcional)"
      >
        <div class="d-flex flex-column ga-3">
          <v-card
            v-for="(item, index) in sale.productItems"
            :key="item.key"
            class="sale-form__item-card"
            rounded="lg"
            elevation="0"
          >
            <v-card-text class="pa-4">
              <div class="d-flex justify-space-between align-center mb-3">
                <span class="text-subtitle-2 font-weight-bold">Producto {{ index + 1 }}</span>
                <v-btn
                  icon="tabler:trash"
                  variant="text"
                  size="small"
                  color="error"
                  @click="removeProductItem(index)"
                />
              </div>
              <v-row dense>
                <v-col cols="12" md="6">
                  <RemoteSelect
                    v-model="item.productId"
                    kind="product"
                    label="Producto"
                    detail
                    :salon-id="clientSalonId"
                    :disabled="!sale.clientId"
                    @select="onProductSelected(item, $event as Product | null)"
                  />
                </v-col>
                <v-col cols="12" sm="4" md="2">
                  <v-text-field
                    v-model.number="item.quantity"
                    v-bind="field"
                    label="Cantidad"
                    type="number"
                    min="1"
                    :rules="[rules.required, rules.wholeNumber, rules.greaterThanZero, productStockRule(item)]"
                  />
                </v-col>
                <v-col cols="12" sm="4" md="2">
                  <v-text-field
                    v-model.number="item.unitPrice"
                    v-bind="field"
                    label="Precio unitario"
                    type="number"
                    min="0"
                    step="0.01"
                    :rules="[rules.positiveNumber]"
                  />
                </v-col>
                <v-col cols="12" sm="4" md="2">
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
            @click="addProductItem"
          >
            <v-icon start>tabler:plus</v-icon>
            Agregar producto
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
                  icon="tabler:trash"
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
                    :rules="[rules.required, rules.greaterThanZero, rules.maxIntegerDigits(10)]"
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
                    :rules="[rules.maxLength(100)]"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-btn variant="tonal" color="primary" rounded="lg" @click="addPayment">
            <v-icon start>tabler:plus</v-icon>
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
        Subtotal:
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
          icon="tabler:x"
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
import { useBranchesStore } from "~/store"
import type { Service } from "~/interfaces/serviceInterfaces"
import type { Product } from "~/interfaces/productInterfaces"
import { useSubscriptionStore } from "~/store/modules/subscription"

const { error: notifyError } = useNotification()
const { notifyCreated, notifyError: notifyApiError } = useApiNotification()

const { field, textarea, select, autocomplete } = useFormFields()

const branchesStore = useBranchesStore()
const subscriptionStore = useSubscriptionStore()

// Selling products belongs to the plans that include products and stock.
const hasProductsFeature = computed(() => subscriptionStore.hasFeature("products"))

const props = defineProps<{
  dataModalForm: saleDataModalForm
  initialAppointmentId?: number | null
}>()

const emit = defineEmits<{
  (e: "create", payload: CreateSaleRequest): void
}>()

// `service` / `product` are the records behind the pickers (their price and stock); they are not sent to the API.
type SaleItemForm = CreateSaleItemPayload & { key: string; service?: Service | null }
type SaleProductItemForm = CreateSaleItemPayload & { key: string; product?: Product | null }
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

const createProductItem = (): SaleProductItemForm => ({
  key: nextKey(),
  productId: null as unknown as number,
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
  items: [] as SaleItemForm[],
  productItems: [] as SaleProductItemForm[],
  payments: [] as SalePaymentForm[],
})

const isFormLoading = useFormLoading({
  action: computed(() => props.dataModalForm.action),
  stores: [branchesStore],
})

const paymentMethodItems = PAYMENT_METHOD_OPTIONS.map((option) => ({
  title: option.label,
  value: option.value,
}))

// Set by the client picker (which searches the clients on the server) once it knows the chosen one.
const selectedClient = ref<Client | null>(null)

const clientSalonId = computed(() => selectedClient.value?.salonId ?? null)

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

// The server answers with the created client; the picker finds it by id.
const resolveCreatedClientId = (created: Client | void): string | number | null => created?.id ?? null

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

    const newClientId = resolveCreatedClientId(created)
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

  if (appointment.depositAmount) {
    sale.value.payments.push({
      key: nextKey(),
      amount: Number(appointment.depositAmount),
      paymentMethod: (appointment.depositPaymentMethod as PaymentMethod) ?? "CASH",
      reference: "Adelanto de la cita",
    })
  }

  if (appointment.serviceId) {
    if (!sale.value.items.length) {
      sale.value.items.push(createItem())
    }
    const firstItem = sale.value.items[0]

    // The service picker finds the service by its id and offers its price.
    firstItem.serviceId = Number(appointment.serviceId)

    if (appointment.userId) {
      firstItem.userId = Number(appointment.userId)
    }
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

// The pickers hand over the whole record once they know it (also when the id came from an appointment). The price is
// offered when the service changes, not every time the same one is read again.
const onServiceSelected = (item: SaleItemForm, service: Service | null) => {
  const changed = String(item.service?.id ?? "") !== String(service?.id ?? "")
  item.service = service
  if (!changed) return

  item.unitPrice = service?.price != null ? Number(service.price) : undefined
}

const onProductSelected = (item: SaleProductItemForm, product: Product | null) => {
  const changed = String(item.product?.id ?? "") !== String(product?.id ?? "")
  item.product = product
  if (!changed) return

  item.unitPrice = product?.price != null ? Number(product.price) : undefined
}

const productStockRule = (item: SaleProductItemForm) => (value: number) => {
  const product = item.product
  if (!product) return true

  const stock = product.stockQuantity ?? 0
  if (Number(value) > stock) {
    return stock > 0 ? `Solo hay ${stock} disponibles` : "Sin stock disponible"
  }
  return true
}

const estimatedItemsSubtotal = computed(() => {
  const servicesSubtotal = sale.value.items.reduce((total, item) => {
    const unitPrice = item.unitPrice ?? item.service?.price ?? 0
    const quantity = Number(item.quantity) || 0
    const discount = Number(item.discountAmount) || 0
    return total + Math.max(0, unitPrice * quantity - discount)
  }, 0)

  const productsSubtotal = sale.value.productItems.reduce((total, item) => {
    const unitPrice = item.unitPrice ?? item.product?.price ?? 0
    const quantity = Number(item.quantity) || 0
    const discount = Number(item.discountAmount) || 0
    return total + Math.max(0, unitPrice * quantity - discount)
  }, 0)

  return servicesSubtotal + productsSubtotal
})

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

const addProductItem = () => {
  sale.value.productItems.push(createProductItem())
}

const removeProductItem = (index: number) => {
  sale.value.productItems.splice(index, 1)
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
    items: [],
    productItems: [],
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

const buildProductItemPayload = (item: SaleProductItemForm): CreateSaleItemPayload => {
  const payload: CreateSaleItemPayload = {
    productId: Number(item.productId),
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

const getValidProductItems = () =>
  sale.value.productItems.filter(
    (item) => item.productId != null && Number(item.quantity) > 0
  )

const getValidPayments = () =>
  sale.value.payments.filter((payment) => Number(payment.amount) > 0)

const onSubmit = async () => {
  const valid = await saleFormRef.value?.validate()
  if (!valid?.valid) return

  const validItems = getValidItems()
  const validProductItems = getValidProductItems()
  if (!validItems.length && !validProductItems.length) {
    notifyError(
      "Agrega al menos un servicio (con profesional y cantidad) o un producto.",
      "Datos incompletos"
    )
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
    items: [
      ...validItems.map(buildItemPayload),
      ...validProductItems.map(buildProductItemPayload),
    ],
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

  // Services and products of another salon cannot stay in the sale.
  const ofOtherSalon = (record?: { salonId?: number | string | null } | null) =>
    record?.salonId != null && clientSalonId.value != null && String(record.salonId) !== String(clientSalonId.value)

  sale.value.items.forEach((item) => {
    if (ofOtherSalon(item.service)) {
      item.serviceId = null as unknown as number
      item.unitPrice = undefined
    }
  })

  sale.value.productItems.forEach((item) => {
    if (ofOtherSalon(item.product)) {
      item.productId = null as unknown as number
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
