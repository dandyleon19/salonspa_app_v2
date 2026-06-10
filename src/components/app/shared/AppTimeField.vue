<template>
  <v-menu
    v-model="menuOpen"
    :close-on-content-click="false"
    location="bottom start"
    offset="6"
  >
    <template #activator="{ props: menuProps }">
      <v-text-field
        :model-value="displayValue"
        :label="label"
        :rules="fieldRules"
        :disabled="disabled"
        :clearable="clearable"
        readonly
        placeholder="Selecciona una hora"
        prepend-inner-icon="mdi-clock-outline"
        append-inner-icon="mdi-chevron-down"
        variant="outlined"
        density="comfortable"
        rounded="lg"
        color="primary"
        hide-details="auto"
        class="app-time-field"
        v-bind="menuProps"
        @click:clear="clearTime"
      />
    </template>

    <v-card class="app-time-field__picker" rounded="xl" elevation="8">
      <v-time-picker
        v-model="pickerValue"
        format="ampm"
        color="primary"
        :max="maxTime"
        ampm-in-title
        @update:model-value="handleTimeChange"
      />

      <div class="app-time-field__period px-4 pb-3 d-flex justify-center ga-2">
        <v-btn
          class="app-time-field__period-btn flex-grow-1"
          :variant="selectedPeriod === 'am' ? 'flat' : 'tonal'"
          :color="selectedPeriod === 'am' ? 'primary' : undefined"
          rounded="lg"
          @click="setPeriod('am')"
        >
          AM
        </v-btn>
        <v-btn
          class="app-time-field__period-btn flex-grow-1"
          :variant="selectedPeriod === 'pm' ? 'flat' : 'tonal'"
          :color="selectedPeriod === 'pm' ? 'primary' : undefined"
          rounded="lg"
          @click="setPeriod('pm')"
        >
          PM
        </v-btn>
      </div>

      <v-divider />

      <div class="app-time-field__actions pa-3">
        <v-btn
          variant="text"
          color="primary"
          rounded="lg"
          @click="menuOpen = false"
        >
          Listo
        </v-btn>
      </div>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import {
  formatTimeDisplay,
  getCurrentTime,
  getTodayDate,
} from "~/helpers/dateTimeHelpers"
import { validationRules as rules } from "~/helpers/validationFormRules"

const props = withDefaults(
  defineProps<{
    modelValue?: string
    relatedDate?: string
    label: string
    rules?: Array<(value: string) => boolean | string>
    disabled?: boolean
    clearable?: boolean
    required?: boolean
    maxNow?: boolean
  }>(),
  {
    modelValue: "",
    relatedDate: "",
    rules: () => [],
    disabled: false,
    clearable: true,
    required: false,
    maxNow: true,
  }
)

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
}>()

const menuOpen = ref(false)
const pickerValue = ref(props.modelValue || getCurrentTime())

watch(
  () => props.modelValue,
  (value) => {
    if (value) pickerValue.value = value
  }
)

const displayValue = computed(() => formatTimeDisplay(props.modelValue))

const selectedPeriod = computed<"am" | "pm">(() => {
  const hours = Number(props.modelValue?.split(":")[0] ?? 0)
  return hours >= 12 ? "pm" : "am"
})

const maxTime = computed(() => {
  if (!props.maxNow || !props.relatedDate) return undefined
  if (props.relatedDate !== getTodayDate()) return undefined
  return getCurrentTime()
})

const fieldRules = computed(() => {
  const baseRules = [...props.rules]

  if (props.required) {
    baseRules.unshift(rules.required as (value: string) => boolean | string)
  }

  if (props.maxNow && props.relatedDate) {
    baseRules.push(rules.maxTimeForDate(props.relatedDate))
  }

  return baseRules
})

const handleTimeChange = (value: string | null) => {
  if (!value) return
  const normalized = value.slice(0, 5)
  pickerValue.value = normalized
  emit("update:modelValue", normalized)
}

const setPeriod = (period: "am" | "pm") => {
  const current = props.modelValue || pickerValue.value || "12:00"
  const [hoursStr = "12", minutes = "00"] = String(current).split(":")
  let hours = Number(hoursStr)

  if (period === "am" && hours >= 12) {
    hours -= 12
  } else if (period === "pm" && hours < 12) {
    hours += 12
  }

  const nextValue = `${String(hours).padStart(2, "0")}:${minutes}`
  pickerValue.value = nextValue
  emit("update:modelValue", nextValue)
}

const clearTime = () => {
  emit("update:modelValue", "")
  pickerValue.value = getCurrentTime()
}
</script>

<style scoped>
.app-time-field :deep(.v-field) {
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
}

.app-time-field__picker {
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.app-time-field__period-btn {
  text-transform: none;
  letter-spacing: normal;
  font-weight: 600;
}

.app-time-field__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
