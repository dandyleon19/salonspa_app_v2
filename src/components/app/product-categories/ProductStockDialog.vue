<template>
  <v-dialog
    :model-value="modelValue"
    max-width="560"
    scrollable
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card rounded="xl" :loading="loading">
      <v-card-title class="d-flex align-center justify-space-between pa-5 pb-2">
        <div>
          <span class="text-h6 font-weight-bold d-block">{{ product?.name }}</span>
          <span class="text-body-2 text-medium-emphasis">
            Stock actual: {{ product?.stockQuantity ?? 0 }}
          </span>
        </div>
        <v-btn
          icon="tabler:x"
          variant="text"
          size="small"
          @click="$emit('update:modelValue', false)"
        />
      </v-card-title>

      <v-card-text class="pa-5 pt-2">
        <v-btn-toggle
          v-model="movementType"
          color="primary"
          variant="outlined"
          rounded="lg"
          mandatory
          class="mb-4"
          density="comfortable"
        >
          <v-btn value="RESTOCK">Reposición</v-btn>
          <v-btn value="ADJUSTMENT">Corrección</v-btn>
        </v-btn-toggle>

        <v-form ref="formRef" v-model="isValid" class="app-form" @submit.prevent="handleSubmit">
          <v-text-field
            v-if="movementType === 'RESTOCK'"
            v-model.number="restockQuantity"
            v-bind="field"
            label="¿Cuántas unidades llegaron?"
            type="number"
            min="1"
            :rules="[rules.required, rules.positiveNumber]"
          />
          <v-text-field
            v-else
            v-model.number="adjustedStock"
            v-bind="field"
            label="¿Cuál es el stock real?"
            type="number"
            min="0"
            hint="Reemplaza el stock actual por este número"
            persistent-hint
            :rules="[rules.required, rules.onlyNumbers, rules.positiveNumber]"
          />

          <v-text-field
            v-model="reason"
            v-bind="field"
            label="Motivo (opcional)"
            class="mt-3"
          />

          <v-btn
            type="submit"
            color="primary"
            variant="flat"
            rounded="lg"
            class="app-form-btn--primary mt-3"
            :loading="submitting"
            block
          >
            Registrar
          </v-btn>
        </v-form>

        <v-divider class="my-5" />

        <p class="text-subtitle-2 font-weight-bold mb-3">Historial</p>

        <AppSkeletonTransition>
          <v-skeleton-loader v-if="historyLoading && !movements.length" type="list-item@3" />
          <div v-else-if="!movements.length" class="text-body-2 text-medium-emphasis text-center py-4">
            Sin movimientos registrados
          </div>
          <div v-else class="d-flex flex-column ga-3">
            <div
              v-for="movement in movements"
              :key="movement.id"
              class="product-stock-dialog__movement"
            >
              <div class="d-flex align-center justify-space-between ga-2 mb-1">
                <v-chip size="x-small" variant="tonal" :color="getStockMovementTypeColor(movement.movementType)">
                  {{ getStockMovementTypeLabel(movement.movementType) }}
                </v-chip>
                <span
                  class="text-body-2 font-weight-bold"
                  :class="movement.quantityDelta >= 0 ? 'text-success' : 'text-error'"
                >
                  {{ movement.quantityDelta >= 0 ? "+" : "" }}{{ movement.quantityDelta }}
                </span>
              </div>
              <p class="text-caption text-medium-emphasis mb-0">
                {{ formatDateDisplay(movement.createdAt) }} {{ formatTimeDisplay(splitIsoDateTime(movement.createdAt).time) }}
                · Quedó en {{ movement.resultingStock }}
                <template v-if="movement.createdByUserName"> · {{ movement.createdByUserName }}</template>
              </p>
              <p v-if="movement.reason" class="text-caption mb-0">{{ movement.reason }}</p>
            </div>

            <v-btn
              v-if="hasMore"
              variant="text"
              color="primary"
              size="small"
              :loading="historyLoading"
              @click="loadMoreHistory"
            >
              Ver más
            </v-btn>
          </div>
        </AppSkeletonTransition>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { validationRules as rules } from "~/helpers/validationFormRules"
import { formatDateDisplay, formatTimeDisplay, splitIsoDateTime } from "~/helpers/dateTimeHelpers"
import type { Product } from "~/interfaces/productInterfaces"
import type { ProductStockMovement } from "~/interfaces/productStockMovementInterfaces"
import {
  getStockMovementTypeColor,
  getStockMovementTypeLabel,
} from "~/interfaces/productStockMovementInterfaces"
import type { PageResponse } from "~/interfaces/PageResponse"

const { field } = useFormFields()
const { notifyCreated, notifyError } = useApiNotification()

const props = defineProps<{
  modelValue: boolean
  product: Product | null
}>()

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void
  (e: "updated", product: Product): void
}>()

const formRef = ref<any>(null)
const isValid = ref(false)
const movementType = ref<"RESTOCK" | "ADJUSTMENT">("RESTOCK")
const restockQuantity = ref<number | null>(null)
const adjustedStock = ref<number | null>(null)
const reason = ref("")
const submitting = ref(false)

const movements = ref<ProductStockMovement[]>([])
const historyLoading = ref(false)
const historyPage = ref(0)
const historyTotalPages = ref(1)
const hasMore = computed(() => historyPage.value + 1 < historyTotalPages.value)

const resetForm = () => {
  movementType.value = "RESTOCK"
  restockQuantity.value = null
  adjustedStock.value = null
  reason.value = ""
  formRef.value?.resetValidation()
}

const loadHistory = async (page = 0) => {
  if (!props.product?.id) return
  historyLoading.value = true
  try {
    const { $api } = useNuxtApp()
    const response = await $api<PageResponse<ProductStockMovement>>(
      `/api/products/${props.product.id}/stock-movements`,
      { method: "GET", query: { page, size: 10 } }
    )
    movements.value = page === 0 ? response.content : [...movements.value, ...response.content]
    historyPage.value = response.page
    historyTotalPages.value = response.totalPages
  } catch (err) {
    notifyError(err, "cargar el historial de stock")
  } finally {
    historyLoading.value = false
  }
}

const loadMoreHistory = () => loadHistory(historyPage.value + 1)

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid?.valid || !props.product?.id) return

  const quantityDelta =
    movementType.value === "RESTOCK"
      ? Number(restockQuantity.value)
      : Number(adjustedStock.value) - (props.product.stockQuantity ?? 0)

  if (movementType.value === "ADJUSTMENT" && quantityDelta === 0) {
    notifyError({}, "registrar el movimiento", "El stock real es igual al actual, no hay nada que corregir.")
    return
  }

  submitting.value = true
  try {
    const { $api } = useNuxtApp()
    await $api(`/api/products/${props.product.id}/stock-movements`, {
      method: "POST",
      body: {
        movementType: movementType.value,
        quantityDelta,
        reason: reason.value?.trim() || undefined,
      },
    })
    notifyCreated("movimiento de stock")
    const newStock = (props.product.stockQuantity ?? 0) + quantityDelta
    emit("updated", { ...props.product, stockQuantity: newStock })
    resetForm()
    await loadHistory(0)
  } catch (err) {
    notifyError(err, "registrar el movimiento de stock")
  } finally {
    submitting.value = false
  }
}

watch(
  () => [props.modelValue, props.product?.id] as const,
  ([open]) => {
    if (open) {
      resetForm()
      loadHistory(0)
    }
  }
)
</script>

<style scoped>
.product-stock-dialog__movement {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  padding: 0.75rem;
}
</style>
