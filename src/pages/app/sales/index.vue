<template>
  <AppTable
    title="Ventas"
    subtitle="Historial de ventas registradas"
    :headers="tableHeaders"
    :row-options="tableRowOptions"
    :get-row-options="getSaleRowOptions"
    :filters="tableFilters"
    :items="salesList"
    :chip-columns="saleChipColumns"
    :loading="loadingSalesList"
    :page="currentPage"
    :items-per-page="itemsPerPage"
    :total-items="totalItems"
    :show-create-button="canManageSales"
    :show-export-button="false"
    :show-search="false"
    @update:pagination="handlePagination"
    @handle-create-button="handleCreateButton"
    @handle-update-filters="handleApplyFilters"
    @handle-row-action-button="handleRowActionButton"
  />

  <AppDrawer
    v-model="openCreateDrawer"
    title="Nueva venta"
    :loading="createLoading"
    size="xlarge"
    @close="closeCreateDrawer"
  >
    <SaleForm
      :data-modal-form="dataModalForm"
      :initial-appointment-id="initialAppointmentId"
      @create="handleCreateSale"
    />
  </AppDrawer>

  <AppDrawer
    v-model="openDetailDrawer"
    title="Detalle de venta"
    :content-loading="detailLoading"
    size="large"
    @close="closeDetailDrawer"
  >
    <SaleDetail :sale="selectedSale" />
    <template v-if="canManageSales && selectedSale?.status === 'PARTIALLY_PAID'" #footer>
      <v-btn
        color="primary"
        variant="flat"
        rounded="lg"
        block
        @click="openPaymentDialog = true"
      >
        <v-icon start>mdi-cash-plus</v-icon>
        Agregar pago
      </v-btn>
    </template>
  </AppDrawer>

  <v-dialog v-model="openPaymentDialog" max-width="420" persistent>
    <v-card rounded="xl">
      <v-card-title class="text-h6 font-weight-bold pa-5 pb-2">
        Agregar pago
      </v-card-title>
      <v-card-text class="pa-5 pt-2">
        <v-form ref="paymentFormRef" @submit.prevent="handleAddPayment">
          <v-text-field
            v-model.number="paymentForm.amount"
            label="Monto"
            type="number"
            min="0"
            step="0.01"
            :rules="[rules.required, rules.positiveNumber]"
            density="comfortable"
            variant="outlined"
            rounded="lg"
            class="mb-3"
          />
          <v-select
            v-model="paymentForm.paymentMethod"
            label="Método de pago"
            :items="paymentMethodItems"
            item-title="title"
            item-value="value"
            :rules="[rules.required]"
            density="comfortable"
            variant="outlined"
            rounded="lg"
            class="mb-3"
          />
          <v-text-field
            v-model="paymentForm.reference"
            label="Referencia (opcional)"
            density="comfortable"
            variant="outlined"
            rounded="lg"
          />
        </v-form>
      </v-card-text>
      <v-card-actions class="pa-5 pt-0">
        <v-spacer />
        <v-btn variant="text" rounded="lg" :disabled="actionLoading" @click="openPaymentDialog = false">
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          :loading="actionLoading"
          @click="handleAddPayment"
        >
          Registrar pago
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <ConfirmationModal
    v-model="showCancelDialog"
    title="Cancelar venta"
    message="¿Deseas cancelar esta venta? Esta acción no se puede deshacer."
    :require-text="false"
    @confirm="handleCancelSale"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import type { FilterOption, TableChipColumn, TableHeader, TableRowOption } from "~/interfaces/tableInterfaces"
import type { PaymentMethod, Sale, saleDataModalForm, CreateSaleRequest } from "~/interfaces/salesInterfaces"
import {
  getSaleStatusColor,
  getSaleStatusLabel,
  getSaleAmountPaid,
  getSalePendingAmount,
  getSaleSoldAt,
  getSaleItemTotal,
  getPaymentMethodLabel,
  PAYMENT_METHOD_OPTIONS,
  SALE_STATUS_OPTIONS,
} from "~/interfaces/salesInterfaces"
import {
  useBranchesStore,
  useClientsStore,
  useSalesStore,
} from "~/store"
import { useAuthStore } from "~/store/modules/auth"
import {
  areSaleFiltersEqual,
  formatCurrency,
  normalizeSaleFilters,
} from "~/helpers/salesHelpers"
import { formatDateDisplay, splitIsoDateTime } from "~/helpers/dateTimeHelpers"
import { validationRules as rules } from "~/helpers/validationFormRules"

definePageMeta({
  layout: "app",
})

const salesStore = useSalesStore()
const branchesStore = useBranchesStore()
const clientsStore = useClientsStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const currentPage = ref(1)
const itemsPerPage = ref(10)
const activeFilters = ref(normalizeSaleFilters({}))
const openCreateDrawer = ref(false)
const createLoading = ref(false)
const openDetailDrawer = ref(false)
const openPaymentDialog = ref(false)
const showCancelDialog = ref(false)
const saleToCancel = ref<Sale | null>(null)
const actionLoading = ref(false)
const paymentFormRef = ref()

const paymentForm = ref({
  amount: null as number | null,
  paymentMethod: "CASH" as PaymentMethod,
  reference: "",
})

const dataModalForm = ref<saleDataModalForm>({ action: "create" })
const { notifyCreated, notifyError, success } = useApiNotification()

const canManageSales = computed(() => authStore.canManageSales)

const initialAppointmentId = computed(() => {
  const raw = route.query.appointmentId
  if (!raw || Array.isArray(raw)) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
})

const selectedSale = computed(() => salesStore.detail)
const detailLoading = computed(() => salesStore.detailLoading)
const loadingSalesList = computed(() => salesStore.loading)
const totalItems = computed(() => salesStore.data?.totalElements ?? 0)

const paymentMethodItems = PAYMENT_METHOD_OPTIONS.map((option) => ({
  title: option.label,
  value: option.value,
}))

const tableRowOptions = ref<TableRowOption[]>([])

const tableHeaders = computed<TableHeader[]>(() => {
  const base: TableHeader[] = [
    { title: "ID", key: "id" },
    { title: "Cliente", key: "clientLabel" },
    { title: "Sucursal", key: "branchLabel" },
    { title: "Total", key: "totalLabel" },
    { title: "Cobrado", key: "paidLabel" },
    { title: "Pendiente", key: "pendingLabel" },
    { title: "Estado", key: "statusLabel" },
    { title: "Fecha", key: "createdAtLabel" },
  ]

  base.push({ title: "Acciones", key: "actions", sortable: false })
  return base
})

const tableFilters = computed<FilterOption[]>(() => [
  {
    type: "date",
    label: "Desde",
    key: "from",
    items: [],
  },
  {
    type: "date",
    label: "Hasta",
    key: "to",
    items: [],
  },
  {
    type: "searchable-select",
    label: "Cliente",
    key: "clientId",
    items: (clientsStore.data?.content ?? []).map((client) => ({
      title: `${client.firstName} ${client.lastName}`.trim(),
      value: Number(client.id),
    })),
  },
  {
    type: "select",
    label: "Sucursal",
    key: "branchId",
    items: (branchesStore.data?.content ?? []).map((branch) => ({
      title: branch.name,
      value: Number(branch.id),
    })),
  },
  {
    type: "select",
    label: "Estado",
    key: "status",
    items: SALE_STATUS_OPTIONS.map((option) => ({
      title: option.label,
      value: option.value,
    })),
  },
])

const saleChipColumns: TableChipColumn[] = [
  {
    key: "statusLabel",
    color: (item) => getSaleStatusColor(item.status),
  },
]

const resolveLabel = (id?: number | string, name?: string, fallback = "—") => {
  if (name) return name
  if (id == null || id === "") return fallback
  return `#${id}`
}

const salesList = computed(() =>
  (salesStore.data?.content ?? []).map((sale: Sale) => {
    const { date } = splitIsoDateTime(getSaleSoldAt(sale))

    return {
      ...sale,
      clientLabel: resolveLabel(sale.clientId, sale.clientName),
      branchLabel: resolveLabel(sale.branchId, sale.branchName),
      totalLabel: formatCurrency(sale.totalAmount),
      paidLabel: formatCurrency(getSaleAmountPaid(sale)),
      pendingLabel: formatCurrency(getSalePendingAmount(sale)),
      statusLabel: getSaleStatusLabel(sale.status),
      createdAtLabel: formatDateDisplay(date || getSaleSoldAt(sale)),
    }
  })
)

const getSaleRowOptions = (item: Sale): TableRowOption[] => {
  const options: TableRowOption[] = [
    {
      action: "view",
      color: "primary",
      icon: "mdi-eye-outline",
      title: "Ver detalle",
    },
  ]

  if (!canManageSales.value || item.status === "CANCELLED") {
    return options
  }

  if (item.status === "PARTIALLY_PAID") {
    options.push({
      action: "payment",
      color: "success",
      icon: "mdi-cash-plus",
      title: "Agregar pago",
    })
  }

  if (item.status !== "COMPLETED") {
    options.push({
      action: "cancel",
      color: "error",
      icon: "mdi-cancel",
      title: "Cancelar",
    })
  }

  return options
}

const fetchSales = async () => {
  await salesStore.fetchSales(currentPage.value - 1, itemsPerPage.value, activeFilters.value)
}

const handleCreateButton = () => {
  dataModalForm.value = { action: "create" }
  openCreateDrawer.value = true
}

const openCreateFromAppointment = () => {
  if (!initialAppointmentId.value || !canManageSales.value) return
  dataModalForm.value = { action: "create" }
  openCreateDrawer.value = true
}

const closeCreateDrawer = () => {
  openCreateDrawer.value = false
  if (route.query.appointmentId) {
    const query = { ...route.query }
    delete query.appointmentId
    router.replace({ query })
  }
  fetchSales()
}

const handleCreateSale = async (payload: CreateSaleRequest) => {
  createLoading.value = true
  try {
    await salesStore.createSale(payload)
    notifyCreated("venta")
    closeCreateDrawer()
  } catch (err) {
    notifyError(err, "registrar la venta")
  } finally {
    createLoading.value = false
  }
}

const openSaleDetail = async (sale: Sale) => {
  if (sale.id == null) return
  openDetailDrawer.value = true
  await salesStore.fetchSaleById(sale.id)
}

const closeDetailDrawer = () => {
  salesStore.detail = null
}

const handleRowActionButton = async (sale: Sale, action: string) => {
  switch (action) {
    case "view":
      await openSaleDetail(sale)
      break
    case "payment":
      await openSaleDetail(sale)
      openPaymentDialog.value = true
      break
    case "cancel":
      saleToCancel.value = sale
      showCancelDialog.value = true
      break
    default:
      break
  }
}

const handleAddPayment = async () => {
  const validation = await paymentFormRef.value?.validate?.()
  if (validation && !validation.valid) return
  if (selectedSale.value?.id == null || paymentForm.value.amount == null) return

  actionLoading.value = true
  try {
    await salesStore.addSalePayment(selectedSale.value.id, {
      amount: paymentForm.value.amount,
      paymentMethod: paymentForm.value.paymentMethod,
      reference: paymentForm.value.reference.trim() || undefined,
    })
    openPaymentDialog.value = false
    paymentForm.value = { amount: null, paymentMethod: "CASH", reference: "" }
    await Promise.all([salesStore.fetchSaleById(selectedSale.value.id), fetchSales()])
    success("El pago se registró correctamente.", "Pago registrado")
  } catch (err) {
    notifyError(err, "registrar el pago")
  } finally {
    actionLoading.value = false
  }
}

const handleCancelSale = async () => {
  if (saleToCancel.value?.id == null) return

  actionLoading.value = true
  try {
    await salesStore.cancelSale(saleToCancel.value.id)
    showCancelDialog.value = false
    saleToCancel.value = null
    if (openDetailDrawer.value && selectedSale.value?.id != null) {
      await salesStore.fetchSaleById(selectedSale.value.id)
    }
    await fetchSales()
    success("La venta se canceló correctamente.", "Venta cancelada")
  } catch (err) {
    notifyError(err, "cancelar la venta")
  } finally {
    actionLoading.value = false
  }
}

const handleApplyFilters = (values: Record<string, unknown>) => {
  const nextFilters = normalizeSaleFilters(values)
  if (areSaleFiltersEqual(activeFilters.value, nextFilters)) return

  activeFilters.value = nextFilters
  currentPage.value = 1
  fetchSales()
}

const handlePagination = async ({
  page,
  itemsPerPage: newItemsPerPage,
}: {
  page: number
  itemsPerPage: number
}) => {
  currentPage.value = page
  itemsPerPage.value = newItemsPerPage
  await fetchSales()
}

watch(openPaymentDialog, (open) => {
  if (!open) {
    paymentForm.value = { amount: null, paymentMethod: "CASH", reference: "" }
  }
})

onMounted(async () => {
  await Promise.all([
    branchesStore.fetchBranches(0, 100),
    clientsStore.fetchClients(0, 100),
    fetchSales(),
  ])
  openCreateFromAppointment()
})

watch(initialAppointmentId, (appointmentId) => {
  if (appointmentId && canManageSales.value && !openCreateDrawer.value) {
    openCreateFromAppointment()
  }
})
</script>
