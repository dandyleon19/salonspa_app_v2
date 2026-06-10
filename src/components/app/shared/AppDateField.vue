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
        placeholder="Selecciona una fecha"
        prepend-inner-icon="mdi-calendar-outline"
        append-inner-icon="mdi-chevron-down"
        variant="outlined"
        density="comfortable"
        rounded="lg"
        color="primary"
        hide-details="auto"
        class="app-date-field"
        v-bind="menuProps"
        @click:clear="clearDate"
      />
    </template>

    <v-card class="app-date-field__picker" rounded="xl" elevation="8">
      <v-date-picker
        v-model="pickerValue"
        color="primary"
        :max="maxDate"
        :min="minDate"
        @update:model-value="handleDateChange"
      />

      <v-divider />

      <div class="app-date-field__actions pa-3">
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
  formatDateDisplay,
  formatDateInput,
  getTodayDate,
} from "~/helpers/dateTimeHelpers"
import { validationRules as rules } from "~/helpers/validationFormRules"

const props = withDefaults(
  defineProps<{
    modelValue?: string
    label: string
    rules?: Array<(value: string) => boolean | string>
    disabled?: boolean
    clearable?: boolean
    maxToday?: boolean
    min?: string
    max?: string
    required?: boolean
  }>(),
  {
    modelValue: "",
    rules: () => [],
    disabled: false,
    clearable: true,
    maxToday: false,
    required: false,
  }
)

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
}>()

const menuOpen = ref(false)
const pickerValue = ref<Date | string | null>(null)

watch(
  () => props.modelValue,
  (value) => {
    if (!value) {
      pickerValue.value = null
      return
    }

    const parsed = new Date(`${value}T12:00:00`)
    pickerValue.value = Number.isNaN(parsed.getTime()) ? null : parsed
  },
  { immediate: true }
)

const displayValue = computed(() => formatDateDisplay(props.modelValue))

const maxDate = computed(() => {
  if (props.max) return props.max
  if (props.maxToday) return getTodayDate()
  return undefined
})

const minDate = computed(() => props.min)

const fieldRules = computed(() => {
  const baseRules = [...props.rules]

  if (props.required) {
    baseRules.unshift(rules.required as (value: string) => boolean | string)
  }

  if (props.maxToday) {
    baseRules.push(rules.maxDateToday)
  }

  return baseRules
})

const normalizeDateValue = (value: Date | string | null): string => {
  if (!value) return ""

  if (value instanceof Date) {
    return formatDateInput(value)
  }

  return String(value).slice(0, 10)
}

const handleDateChange = (value: Date | string | null) => {
  emit("update:modelValue", normalizeDateValue(value))
}

const clearDate = () => {
  pickerValue.value = null
  emit("update:modelValue", "")
}
</script>

<style scoped>
.app-date-field :deep(.v-field) {
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
}

.app-date-field__picker {
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.app-date-field__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
