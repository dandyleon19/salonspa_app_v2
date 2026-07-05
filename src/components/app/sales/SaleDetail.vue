<template>
  <div v-if="sale" class="sale-detail">
    <div class="d-flex flex-wrap ga-2 mb-4">
      <v-chip
        size="small"
        variant="tonal"
        :color="getSaleStatusColor(sale.status)"
      >
        {{ getSaleStatusLabel(sale.status) }}
      </v-chip>
      <v-chip v-if="saleSoldAt" size="small" variant="outlined" prepend-icon="mdi-calendar">
        {{ formatDateDisplay(saleSoldAt) }}
      </v-chip>
    </div>

    <v-row class="mb-4">
      <v-col cols="12" sm="6">
        <p class="text-caption text-medium-emphasis mb-1">Cliente</p>
        <p class="text-body-2 font-weight-medium mb-0">
          {{ sale.clientName || `#${sale.clientId}` }}
        </p>
      </v-col>
      <v-col cols="12" sm="6">
        <p class="text-caption text-medium-emphasis mb-1">Sucursal</p>
        <p class="text-body-2 font-weight-medium mb-0">
          {{ sale.branchName || `#${sale.branchId}` }}
        </p>
      </v-col>
      <v-col v-if="sale.appointmentId" cols="12" sm="6">
        <p class="text-caption text-medium-emphasis mb-1">Cita vinculada</p>
        <p class="text-body-2 font-weight-medium mb-0">#{{ sale.appointmentId }}</p>
      </v-col>
      <v-col v-if="sale.notes" cols="12">
        <p class="text-caption text-medium-emphasis mb-1">Notas</p>
        <p class="text-body-2 mb-0">{{ sale.notes }}</p>
      </v-col>
    </v-row>

    <v-card class="sale-detail__section mb-4" rounded="lg" elevation="0">
      <v-card-title class="text-subtitle-2 font-weight-bold py-3 px-4">
        Servicios
      </v-card-title>
      <v-divider />
      <v-list density="compact" class="py-0">
        <v-list-item
          v-for="(item, index) in sale.items ?? []"
          :key="item.id ?? `${item.serviceId}-${index}`"
        >
          <v-list-item-title class="text-body-2 font-weight-medium">
            {{ item.serviceName || `Servicio #${item.serviceId}` }}
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ item.userName || `Prof. #${item.userId}` }}
            · Cant. {{ item.quantity }}
            · {{ formatCurrency(item.unitPrice) }}
          </v-list-item-subtitle>
          <template #append>
            <span class="text-body-2 font-weight-medium">
              {{ formatCurrency(getSaleItemTotal(item)) }}
            </span>
          </template>
        </v-list-item>
        <v-list-item v-if="!(sale.items?.length)">
          <v-list-item-title class="text-medium-emphasis">Sin ítems</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>

    <v-card class="sale-detail__section mb-4" rounded="lg" elevation="0">
      <v-card-title class="text-subtitle-2 font-weight-bold py-3 px-4">
        Pagos
      </v-card-title>
      <v-divider />
      <v-list density="compact" class="py-0">
        <v-list-item
          v-for="(payment, index) in sale.payments ?? []"
          :key="payment.id ?? `payment-${index}`"
        >
          <v-list-item-title class="text-body-2">
            {{ getPaymentMethodLabel(payment.paymentMethod) }}
          </v-list-item-title>
          <v-list-item-subtitle v-if="payment.reference">
            Ref: {{ payment.reference }}
          </v-list-item-subtitle>
          <template #append>
            <span class="text-body-2 font-weight-medium">
              {{ formatCurrency(payment.amount) }}
            </span>
          </template>
        </v-list-item>
        <v-list-item v-if="!(sale.payments?.length)">
          <v-list-item-title class="text-medium-emphasis">Sin pagos</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>

    <v-card class="sale-detail__totals" rounded="lg" elevation="0">
      <v-card-text class="pa-4">
        <div v-if="sale.subtotal != null" class="d-flex justify-space-between mb-2">
          <span class="text-body-2 text-medium-emphasis">Subtotal</span>
          <span class="text-body-2">{{ formatCurrency(sale.subtotal) }}</span>
        </div>
        <div v-if="sale.discountAmount" class="d-flex justify-space-between mb-2">
          <span class="text-body-2 text-medium-emphasis">Descuento</span>
          <span class="text-body-2 text-error">-{{ formatCurrency(sale.discountAmount) }}</span>
        </div>
        <div class="d-flex justify-space-between mb-2">
          <span class="text-body-2 text-medium-emphasis">Total</span>
          <span class="text-body-2 font-weight-bold">{{ formatCurrency(sale.totalAmount) }}</span>
        </div>
        <div class="d-flex justify-space-between mb-2">
          <span class="text-body-2 text-medium-emphasis">Cobrado</span>
          <span class="text-body-2 font-weight-medium text-success">
            {{ formatCurrency(amountPaid) }}
          </span>
        </div>
        <div class="d-flex justify-space-between">
          <span class="text-body-2 text-medium-emphasis">Pendiente</span>
          <span class="text-body-2 font-weight-medium text-warning">
            {{ formatCurrency(pendingAmount) }}
          </span>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import type { Sale } from "~/interfaces/salesInterfaces"
import {
  getPaymentMethodLabel,
  getSaleAmountPaid,
  getSaleItemTotal,
  getSalePendingAmount,
  getSaleSoldAt,
  getSaleStatusColor,
  getSaleStatusLabel,
} from "~/interfaces/salesInterfaces"
import { formatCurrency } from "~/helpers/salesHelpers"
import { formatDateDisplay } from "~/helpers/dateTimeHelpers"

const props = defineProps<{
  sale: Sale | null
}>()

const saleSoldAt = computed(() => getSaleSoldAt(props.sale))
const amountPaid = computed(() => getSaleAmountPaid(props.sale))
const pendingAmount = computed(() => getSalePendingAmount(props.sale))
</script>

<style scoped>
.sale-detail__section,
.sale-detail__totals {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
