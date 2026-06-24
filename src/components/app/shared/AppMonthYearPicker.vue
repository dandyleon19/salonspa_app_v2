<template>
  <v-menu
    v-model="menuOpen"
    :close-on-content-click="false"
    location="bottom start"
    offset="6"
    :disabled="disabled"
  >
    <template #activator="{ props: menuProps }">
      <v-text-field
        :model-value="displayValue"
        label="Periodo"
        :disabled="disabled"
        readonly
        prepend-inner-icon="mdi-calendar-month-outline"
        :append-inner-icon="menuOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        variant="outlined"
        density="comfortable"
        rounded="lg"
        color="primary"
        hide-details="auto"
        class="app-month-year-picker"
        v-bind="menuProps"
      />
    </template>

    <v-card class="app-month-year-picker__panel" rounded="xl" elevation="8">
      <div class="app-month-year-picker__body">
        <div class="app-month-year-picker__years">
          <p class="app-month-year-picker__section-label">Año</p>
          <div ref="yearListRef" class="app-month-year-picker__year-list">
            <button
              v-for="year in yearOptions"
              :key="year"
              type="button"
              :data-year="year"
              class="app-month-year-picker__year"
              :class="{ 'app-month-year-picker__year--active': year === pickerYear }"
              @click="pickerYear = year"
            >
              <span>{{ year }}</span>
              <span
                v-if="year === pickerYear"
                class="app-month-year-picker__year-dot"
              />
            </button>
          </div>
        </div>

        <div class="app-month-year-picker__months">
          <div class="app-month-year-picker__months-header">
            <h3 class="app-month-year-picker__year-title">{{ pickerYear }}</h3>
            <p
              v-if="pickerYear === currentYearValue"
              class="app-month-year-picker__year-caption"
            >
              Año en curso
            </p>
          </div>

          <div class="app-month-year-picker__month-grid">
            <button
              v-for="(label, index) in CALENDAR_MONTH_SHORT_LABELS"
              :key="label"
              type="button"
              class="app-month-year-picker__month"
              :class="{
                'app-month-year-picker__month--active': index + 1 === pickerMonth,
                'app-month-year-picker__month--future':
                  isFutureMonth(pickerYear, index + 1),
              }"
              @click="selectMonth(index + 1)"
            >
              {{ label }}
            </button>
          </div>
        </div>
      </div>

      <v-divider />

      <div class="app-month-year-picker__footer">
        <div
          v-if="isCurrentPeriod"
          class="app-month-year-picker__current"
        >
          <span class="app-month-year-picker__current-dot" />
          Mes actual
        </div>
        <span v-else />
        <strong class="app-month-year-picker__selection">
          {{ previewLabel }}
        </strong>
      </div>

      <div class="app-month-year-picker__actions pa-3">
        <v-btn
          variant="text"
          color="primary"
          rounded="lg"
          @click="handleDone"
        >
          Listo
        </v-btn>
      </div>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import {
  CALENDAR_MAX_YEAR,
  CALENDAR_MIN_YEAR,
  CALENDAR_MONTH_SHORT_LABELS,
  formatCalendarMonthLabel,
} from "~/helpers/appointmentHelpers"

const props = withDefaults(
  defineProps<{
    year: number
    month: number
    disabled?: boolean
  }>(),
  {
    disabled: false,
  }
)

const emit = defineEmits<{
  (e: "update:year", value: number): void
  (e: "update:month", value: number): void
  (e: "change"): void
}>()

const menuOpen = ref(false)
const pickerYear = ref(props.year)
const pickerMonth = ref(props.month)
const yearListRef = ref<HTMLElement | null>(null)

const today = new Date()
const currentYearValue = today.getFullYear()
const currentMonthValue = today.getMonth() + 1

const yearOptions = computed(() => {
  const years: number[] = []
  for (let year = CALENDAR_MAX_YEAR; year >= CALENDAR_MIN_YEAR; year--) {
    years.push(year)
  }
  return years
})

const displayValue = computed(() => formatCalendarMonthLabel(props.year, props.month))

const previewLabel = computed(() =>
  formatCalendarMonthLabel(pickerYear.value, pickerMonth.value)
)

const isCurrentPeriod = computed(
  () => pickerYear.value === currentYearValue && pickerMonth.value === currentMonthValue
)

const isFutureMonth = (year: number, month: number) => {
  if (year > currentYearValue) return true
  if (year < currentYearValue) return false
  return month > currentMonthValue
}

const scrollToSelectedYear = async () => {
  await nextTick()
  const container = yearListRef.value
  if (!container) return

  const selected = container.querySelector(
    `[data-year="${pickerYear.value}"]`
  ) as HTMLElement | null

  selected?.scrollIntoView({ block: "center" })
}

const applySelection = () => {
  const yearChanged = pickerYear.value !== props.year
  const monthChanged = pickerMonth.value !== props.month

  if (yearChanged) {
    emit("update:year", pickerYear.value)
  }

  if (monthChanged) {
    emit("update:month", pickerMonth.value)
  }

  if (yearChanged || monthChanged) {
    emit("change")
  }
}

const selectMonth = (month: number) => {
  pickerMonth.value = month
  applySelection()
  menuOpen.value = false
}

watch(
  () => props.year,
  (value) => {
    pickerYear.value = value
  }
)

watch(
  () => props.month,
  (value) => {
    pickerMonth.value = value
  }
)

watch(menuOpen, (open) => {
  if (!open) return

  pickerYear.value = props.year
  pickerMonth.value = props.month
  scrollToSelectedYear()
})

const handleDone = () => {
  applySelection()
  menuOpen.value = false
}
</script>

<style scoped>
.app-month-year-picker {
  min-width: 220px;
  max-width: 280px;
}

.app-month-year-picker :deep(.v-field) {
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
}

.app-month-year-picker__panel {
  width: min(420px, calc(100vw - 32px));
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.app-month-year-picker__body {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  min-height: 280px;
}

.app-month-year-picker__years {
  padding: 16px 12px;
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.app-month-year-picker__section-label {
  margin: 0 0 10px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.app-month-year-picker__year-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 248px;
  overflow-y: auto;
  padding-right: 4px;
}

.app-month-year-picker__year {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.82);
  font-size: 0.92rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.app-month-year-picker__year:hover {
  background: rgba(var(--v-theme-primary), 0.08);
}

.app-month-year-picker__year--active {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.app-month-year-picker__year-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.9;
}

.app-month-year-picker__months {
  padding: 16px;
}

.app-month-year-picker__months-header {
  margin-bottom: 14px;
}

.app-month-year-picker__year-title {
  margin: 0;
  font-size: 1.35rem;
  line-height: 1.1;
  font-weight: 800;
}

.app-month-year-picker__year-caption {
  margin: 4px 0 0;
  font-size: 0.78rem;
  color: rgba(var(--v-theme-on-surface), 0.58);
}

.app-month-year-picker__month-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.app-month-year-picker__month {
  min-height: 42px;
  border: 0;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  color: rgba(var(--v-theme-on-surface), 0.84);
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.app-month-year-picker__month:hover {
  background: rgba(var(--v-theme-primary), 0.1);
  transform: translateY(-1px);
}

.app-month-year-picker__month--future:not(.app-month-year-picker__month--active) {
  color: rgba(var(--v-theme-on-surface), 0.38);
}

.app-month-year-picker__month--active {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.app-month-year-picker__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
}

.app-month-year-picker__current {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

.app-month-year-picker__current-dot,
.app-month-year-picker__year-dot {
  flex-shrink: 0;
}

.app-month-year-picker__current-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgb(var(--v-theme-primary));
}

.app-month-year-picker__selection {
  font-size: 0.92rem;
  color: rgb(var(--v-theme-primary));
}

.app-month-year-picker__actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 600px) {
  .app-month-year-picker__body {
    grid-template-columns: 1fr;
  }

  .app-month-year-picker__years {
    border-right: 0;
    border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .app-month-year-picker__year-list {
    max-height: 120px;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .app-month-year-picker__year {
    width: auto;
    flex: 0 0 auto;
  }
}
</style>
