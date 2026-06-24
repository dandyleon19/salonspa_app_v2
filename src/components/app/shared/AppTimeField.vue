<template>
  <v-menu
    v-model="menuOpen"
    :close-on-content-click="false"
    location="bottom start"
    offset="6"
    :disabled="isFieldDisabled"
  >
    <template #activator="{ props: menuProps }">
      <v-text-field
        :model-value="displayValue"
        :label="label"
        :rules="fieldRules"
        :disabled="isFieldDisabled"
        :clearable="clearable && !isFieldDisabled"
        readonly
        :placeholder="fieldPlaceholder"
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
      <div class="app-time-field__controls pa-4">
        <v-select
          v-model="pickerHour"
          :items="TIME_HOUR_12_OPTIONS"
          label="Hora"
          variant="outlined"
          density="compact"
          rounded="lg"
          color="primary"
          hide-details
          class="app-time-field__select"
          @update:model-value="handlePickerChange"
        />
        <span class="app-time-field__separator">:</span>
        <v-select
          v-model="pickerMinute"
          :items="TIME_MINUTE_OPTIONS"
          label="Min"
          variant="outlined"
          density="compact"
          rounded="lg"
          color="primary"
          hide-details
          class="app-time-field__select"
          @update:model-value="handlePickerChange"
        />
        <v-select
          v-model="pickerPeriod"
          :items="TIME_PERIOD_OPTIONS"
          label="Periodo"
          variant="outlined"
          density="compact"
          rounded="lg"
          color="primary"
          hide-details
          class="app-time-field__select app-time-field__select--period"
          @update:model-value="handlePickerChange"
        />
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
  formatTimeFrom12h,
  getTodayDate,
  isTimeAfterCurrentTime,
  isTimeBeforeOrEqualCurrentTime,
  parseTimeTo12h,
  TIME_HOUR_12_OPTIONS,
  TIME_MINUTE_OPTIONS,
  TIME_PERIOD_OPTIONS,
  type Time12h,
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
    minNow?: boolean
    requireDate?: boolean
  }>(),
  {
    modelValue: "",
    relatedDate: "",
    rules: () => [],
    disabled: false,
    clearable: true,
    required: false,
    maxNow: false,
    minNow: false,
    requireDate: true,
  }
)

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
}>()

const menuOpen = ref(false)
const pickerHour = ref<number>(12)
const pickerMinute = ref("00")
const pickerPeriod = ref<Time12h["period"]>("AM")

const isFieldDisabled = computed(
  () => props.disabled || (props.requireDate && !props.relatedDate)
)

const fieldPlaceholder = computed(() =>
  props.requireDate && !props.relatedDate
    ? "Selecciona primero la fecha"
    : "Selecciona una hora"
)

const displayValue = computed(() => formatTimeDisplay(props.modelValue))

const wrapRule = (rule: (value: string) => boolean | string) => () =>
  rule(props.modelValue)

const fieldRules = computed(() => {
  const baseRules = props.rules.map(wrapRule)

  if (props.required) {
    baseRules.unshift(() => rules.required(props.modelValue))
  }

  if (props.maxNow && props.relatedDate) {
    baseRules.push(() => rules.maxTimeForDate(props.relatedDate)(props.modelValue))
  }

  if (props.minNow && props.relatedDate) {
    baseRules.push(() => rules.minTimeForDate(props.relatedDate)(props.modelValue))
  }

  return baseRules
})

const syncPickerFromModel = (value?: string) => {
  const parsed = parseTimeTo12h(value)
  if (!parsed) return

  pickerHour.value = parsed.hour
  pickerMinute.value = parsed.minute
  pickerPeriod.value = parsed.period
}

watch(
  () => props.modelValue,
  (value) => syncPickerFromModel(value),
  { immediate: true }
)

const emitPickerValue = () => {
  emit(
    "update:modelValue",
    formatTimeFrom12h({
      hour: pickerHour.value,
      minute: pickerMinute.value,
      period: pickerPeriod.value,
    })
  )
}

const handlePickerChange = () => {
  emitPickerValue()
}

const clearTime = () => {
  pickerHour.value = 12
  pickerMinute.value = "00"
  pickerPeriod.value = "AM"
  emit("update:modelValue", "")
}

const isTimeAllowed = (time: string) => {
  if (!time || !props.relatedDate) return false

  if (props.maxNow && props.relatedDate === getTodayDate()) {
    if (!isTimeBeforeOrEqualCurrentTime(time)) return false
  }

  if (props.minNow && props.relatedDate === getTodayDate()) {
    if (!isTimeAfterCurrentTime(time)) return false
  }

  return true
}

watch(
  () => props.relatedDate,
  (date) => {
    if (!date) {
      if (props.modelValue) emit("update:modelValue", "")
      return
    }

    if (props.modelValue && !isTimeAllowed(props.modelValue)) {
      emit("update:modelValue", "")
    }
  }
)
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

.app-time-field__controls {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.app-time-field__select {
  flex: 1;
  min-width: 0;
}

.app-time-field__select--period {
  flex: 0 0 96px;
}

.app-time-field__separator {
  margin-bottom: 10px;
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(var(--v-theme-text));
}

.app-time-field__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
