<template>
  <AppTable
    title="Salones"
    subtitle="Lista de salones registrados"
    :headers="headers"
    :rowOptions="rowOptions"
    :filters="tableFilters"
    :items="salonsList"
    :chip-columns="salonChipColumns"
    :loading="loadingSalonsList"
    :page="currentPage"
    :items-per-page="itemsPerPage"
    :total-items="totalItems"
    @update:pagination="handlePagination"
    @handle-create-button="handleCreateButton"
    @handle-row-action-button="handleRowActionButton"
  >
    <template #summary>
      <span class="subscription-summary__label">Estado de suscripción</span>
      <v-chip
        v-for="option in summaryOptions"
        :key="option.key"
        :color="option.color"
        :variant="statusFilter === option.key ? 'flat' : 'tonal'"
        size="small"
        class="subscription-summary__chip"
        @click="statusFilter = statusFilter === option.key ? 'ALL' : option.key"
      >
        {{ option.label }}
        <span class="subscription-summary__count">{{ option.count }}</span>
      </v-chip>
      <v-btn
        v-if="statusFilter !== 'ALL'"
        variant="text"
        size="x-small"
        class="text-none"
        @click="statusFilter = 'ALL'"
      >
        Quitar filtro
      </v-btn>
    </template>
  </AppTable>

  <AppDrawer
    v-model="openSalonDrawer"
    title="Gestión de Salones"
    :loading="loading"
    size="large"
    location="end"
    :temporary="true"
    @close="closeSalonDrawer"
  >
    <SalonForm
      :data-modal-form="dataModalForm"
      @create="handleCreateSalon"
      @update="handleUpdateSalon"
    />    
  </AppDrawer>

  <AppDrawer
    v-model="openBranchDrawer"
    title="Gestión de Sucursales"
    :loading="loading"
    size="large"
    location="end"
    :temporary="true"
    @close="closeSalonDrawer"
  >
    <ManageBranches
      :data-modal-form="dataModalForm"
    />
  </AppDrawer>

  <AppDrawer
    v-model="openSubscriptionDrawer"
    title="Suscripción del salón"
    size="large"
    location="end"
    :temporary="true"
    @close="closeSubscriptionDrawer"
  >
    <SalonSubscriptionManager
      v-if="subscriptionSalon"
      :salon-id="Number(subscriptionSalon.id)"
      :salon-name="subscriptionSalon.name"
    />
  </AppDrawer>

  <ConfirmationModal
    v-model="showDeleteDialog"
    title="Eliminar usuario"
    message="¿Deseas eliminar este salón? Esta acción no se puede deshacer."
    :require-text="false"
    @confirm="handleDeleteSalon"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { ResponseInterface } from "~/interfaces/appInterfaces";
import type { FilterOption, TableChipColumn, TableHeader, TableRowOption } from "~/interfaces/tableInterfaces";
import {
  SUBSCRIPTION_STATUS_COLORS,
  subscriptionStatusText,
  type SubscriptionInfo,
  type SubscriptionStatus,
} from "~/interfaces/subscriptionInterfaces";
import { formatDateDisplay } from "~/helpers/dateTimeHelpers";
import { APP_ICONS } from "~/constants/appIcons";
import { describeLastSession } from "~/helpers/lastSessionHelpers";
import { useSubscriptionStore } from "~/store/modules/subscription";
import type { Salon, salonDataModalForm } from "~/interfaces/salonInterfaces";
import { useSalonsStore } from "~/store";

definePageMeta({
  layout: 'app',
  middleware: 'role',
  allowedRoles: ['SUPER_ADMIN'],
})

useHead({ title: "Salones" })

// Composables
const salonsStore = useSalonsStore();
const subscriptionStore = useSubscriptionStore();

// Variables
const loading = ref<boolean>(false);
const openSalonDrawer = ref<boolean>(false);
const openBranchDrawer = ref<boolean>(false)
const openSubscriptionDrawer = ref<boolean>(false)
const subscriptionSalon = ref<Salon>()
const showDeleteDialog = ref<boolean>(false)
const salonToRemove = ref<Salon>()
const currentPage = ref(1)
const itemsPerPage = ref(10)

const headers = ref<Array<TableHeader>>([
  { title: "ID", key: "id" },
  { title: "Nombre", key: "name" },
  { title: "Razón Social", key: "socialReason", card: "subtitle" },
  { title: "Dirección", key: "fiscalAddress", card: "hidden" },
  { title: "Ruc", key: "rucNumber" },
  { title: "Teléfono", key: "phone" },
  { title: "Plan", key: "planName" },
  { title: "Estado", key: "subscriptionStatusLabel" },
  { title: "Vence", key: "subscriptionEnd" },
  { title: "Última sesión", key: "lastSessionLabel" },
  { title: "Último en entrar", key: "lastSessionBy" },
  { title: "Acciones", key: "actions", sortable: false },
]);

const rowOptions = ref<Array<TableRowOption>>([
  {
    action: 'update',
    color: 'primary',
    icon: 'tabler:pencil',
  },
  {
    action: 'branches',
    color: 'primary',
    icon: 'tabler:git-branch',
  },
  {
    action: 'subscription',
    color: 'primary',
    icon: APP_ICONS.subscription,
  },
  {
    action: 'delete',
    color: 'error',
    icon: 'tabler:trash',
  },
]);

const tableFilters = ref<FilterOption[]>([]);

const salonChipColumns: TableChipColumn[] = [
  {
    key: "subscriptionStatusLabel",
    color: (item) => SUBSCRIPTION_STATUS_COLORS[item.subscriptionStatus as SubscriptionStatus] ?? "default",
  },
  {
    key: "lastSessionLabel",
    color: (item) => item.lastSessionTone,
  },
];

const dataModalForm = ref<salonDataModalForm>({
  action: "create",
});

// Computed
// Summary chips above the table: how many salons are in each state (all salons, not only this page).
// A chip also filters the rows of the table; click it again to clear the filter.
type StatusFilter = "ALL" | "TRIAL" | "ACTIVE" | "EXPIRING" | "BLOCKED"
const statusFilter = ref<StatusFilter>("ALL")

const EXPIRING_SOON_DAYS = 7

const isExpiringSoon = (item: SubscriptionInfo) =>
  item.status === "PAST_DUE" ||
  (item.status === "ACTIVE" && item.daysRemaining !== null && item.daysRemaining <= EXPIRING_SOON_DAYS)

const matchesFilter = (item: SubscriptionInfo | undefined, filter: StatusFilter): boolean => {
  if (filter === "ALL") return true
  if (!item) return false
  switch (filter) {
    case "TRIAL":
      return item.status === "TRIAL"
    case "ACTIVE":
      return item.status === "ACTIVE"
    case "EXPIRING":
      return isExpiringSoon(item)
    case "BLOCKED":
      return item.blocked
  }
}

const summaryOptions = computed(() => {
  const all = subscriptionStore.all
  const count = (filter: StatusFilter) => all.filter((item) => matchesFilter(item, filter)).length
  return [
    { key: "TRIAL" as const, label: "En prueba", color: "info", count: count("TRIAL") },
    { key: "ACTIVE" as const, label: "Activos", color: "success", count: count("ACTIVE") },
    { key: "EXPIRING" as const, label: "Por vencer", color: "warning", count: count("EXPIRING") },
    { key: "BLOCKED" as const, label: "Bloqueados", color: "error", count: count("BLOCKED") },
  ]
})

// Each salon with its plan, state and end date (from the subscriptions list).
const salonsList = computed(() => {
  return (salonsStore.data?.content ?? [])
    .map((salon) => ({
      salon,
      subscription: subscriptionStore.all.find((item) => item.salonId === Number(salon.id)),
    }))
    .filter(({ subscription }) => matchesFilter(subscription, statusFilter.value))
    .map(({ salon, subscription }) => {
      const status = subscription?.status
      const endDate =
        status === "TRIAL"
          ? subscription?.trialEndsAt
          : status === "ACTIVE" || status === "PAST_DUE"
            ? subscription?.currentPeriodEnd
            : null

      const lastSession = describeLastSession(salon.lastSessionAt)

      return {
        ...salon,
        lastSessionLabel: lastSession.label,
        lastSessionTone: lastSession.tone,
        lastSessionBy: salon.lastSessionBy || "—",
        planName: subscription?.planName ?? "—",
        subscriptionStatus: status,
        subscriptionStatusLabel: subscription ? subscriptionStatusText(subscription) : "",
        subscriptionEnd: endDate
          ? formatDateDisplay(endDate)
          : status === "ACTIVE"
            ? "Sin vencimiento"
            : status === "TRIAL" && subscription?.trialPending
              ? "Empieza al primer ingreso"
              : "—",
      }
    });
});

const totalItems = computed(() => {
  return salonsStore.data?.totalElements ?? 0
})

const loadingSalonsList = computed(() => {
  return salonsStore.loading;
});

// Methods
const handleCreateButton = (): void => {
  dataModalForm.value.action = 'create'
  openSalonDrawer.value = true;
};

const handleRowActionButton = (salon: Salon, action: string): void => {
  console.log("apply Action Button:", action);
  switch (action) {
    case 'update':
      dataModalForm.value.action = action
      dataModalForm.value.rowId = salon.id
      openSalonDrawer.value = true;
      break;

    case 'branches':
      dataModalForm.value.action = action
      dataModalForm.value.rowId = salon.id
      dataModalForm.value.branches = salon.branches
      openBranchDrawer.value = true
      break;

    case 'subscription':
      subscriptionSalon.value = salon
      openSubscriptionDrawer.value = true
      break;

    case 'delete':
      showDeleteDialog.value = true
      salonToRemove.value = salon
      break;
  
    default:
      break;
  }
};

const closeSubscriptionDrawer = () => {
  openSubscriptionDrawer.value = false;
  subscriptionSalon.value = undefined;
  subscriptionStore.fetchAll();
};

const closeSalonDrawer = () => {
  openSalonDrawer.value = false;
  openBranchDrawer.value = false;
  salonsStore.fetchSalons();
};

const { notifyCreated, notifyUpdated, notifyDeleted, notifyError } = useApiNotification()

const handleCreateSalon = async (salon: Salon) => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api("/api/salons", {
      method: "POST",
      body: { ...salon },
    });
    notifyCreated("salón");
    closeSalonDrawer();
  } catch (err) {
    notifyError(err, "crear el salón");
  } finally {
    loading.value = false;
  }
};

const handleUpdateSalon = async (salon: Salon) => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api(`/api/salons/${salon.id}`, {
      method: "PUT",
      body: { 
        name: salon.name,
        rucNumber: salon.rucNumber,
        socialReason: salon.socialReason,
        fiscalAddress: salon.fiscalAddress,
        phone: salon.phone,
      },
    });
    notifyUpdated("salón");
    closeSalonDrawer();
  } catch (err) {
    notifyError(err, "actualizar el salón");
  } finally {
    loading.value = false;
  }
};

const handleDeleteSalon = async () => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api(`/api/salons/${salonToRemove.value?.id}`, {
      method: "DELETE",
    });
    notifyDeleted("salón");
    await salonsStore.fetchSalons();
  } catch (err) {
    notifyError(err, "eliminar el salón");
  } finally {
    loading.value = false;
  }  
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

  await salonsStore.fetchSalons(
      page - 1,
      newItemsPerPage
  )
}

// Mounted
onMounted(() => {
  salonsStore.fetchSalons(0, itemsPerPage.value);
  subscriptionStore.fetchAll();
});
</script>

<style scoped>
.subscription-summary__label {
  margin-right: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.70);
}

.subscription-summary__chip {
  font-weight: 600;
  cursor: pointer;
}

/* The number sits in a small pill next to the label. */
.subscription-summary__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  margin-left: 0.5rem;
  padding-inline: 0.3rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  background: rgba(var(--v-theme-on-surface), 0.1);
}
</style>