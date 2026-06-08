<template>
  <div class="clinical-record-list">
    <v-text-field
      v-if="records.length"
      v-model="search"
      density="compact"
      variant="solo-filled"
      flat
      hide-details
      placeholder="Buscar historial..."
      prepend-inner-icon="mdi-magnify"
      class="mb-3 clinical-record-list__search"
      clearable
    />

    <div v-if="!records.length" class="clinical-record-list__empty">
      <v-avatar size="56" color="primary" variant="tonal" class="mb-3">
        <v-icon size="28">mdi-clipboard-text-outline</v-icon>
      </v-avatar>
      <p class="text-body-2 font-weight-medium mb-1">Sin historiales</p>
      <p class="text-caption text-medium-emphasis">
        Aún no hay registros clínicos para este paciente
      </p>
    </div>

    <div v-else-if="!filteredRecords.length" class="clinical-record-list__empty">
      <v-icon size="40" color="grey-lighten-1" class="mb-2">mdi-file-search-outline</v-icon>
      <p class="text-caption text-medium-emphasis">No hay resultados para tu búsqueda</p>
    </div>

    <div v-else class="d-flex flex-column ga-2">
      <v-card
        v-for="record in filteredRecords"
        :key="record.id"
        :class="[
          'clinical-record-list__item',
          { 'clinical-record-list__item--active': isSelected(record.id) },
        ]"
        variant="flat"
        @click="emitSelect(record.id)"
      >
        <div class="d-flex align-start ga-3">
          <div class="clinical-record-list__timeline">
            <div class="clinical-record-list__dot" />
          </div>

          <div class="flex-grow-1 min-width-0">
            <div class="d-flex align-start justify-space-between ga-2 mb-2">
              <div class="min-width-0">
                <p class="text-caption text-medium-emphasis mb-1">
                  {{ formatDate(record.sessionDate) }}
                </p>
                <p class="text-body-2 font-weight-bold text-truncate">
                  {{ record.diagnosis || "Sin diagnóstico" }}
                </p>
              </div>

              <v-btn
                icon
                size="x-small"
                variant="text"
                color="error"
                class="clinical-record-list__delete"
                @click.stop="emitDelete(record)"
              >
                <v-icon size="18">mdi-delete-outline</v-icon>
              </v-btn>
            </div>

            <div class="d-flex flex-wrap ga-2">
              <v-chip size="x-small" variant="tonal" color="primary" prepend-icon="mdi-account-outline">
                {{ record.userName || "Sin especialista" }}
              </v-chip>
              <v-chip size="x-small" variant="tonal" color="secondary" prepend-icon="mdi-store-outline">
                {{ record.branchName || "Sin sucursal" }}
              </v-chip>
            </div>
          </div>
        </div>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ClinicalRecord } from "~/interfaces/clinicalRecordInterfaces";

const props = defineProps<{
  records: ClinicalRecord[]
  selectedRecordId?: string | number | null
}>()

const emit = defineEmits<{
  (e: "select", id: string | number | undefined): void
  (e: "delete", record: ClinicalRecord): void
}>()

const search = ref("")

const filteredRecords = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return props.records

  return props.records.filter((record) => {
    const haystack = [
      record.diagnosis,
      record.treatment,
      record.observations,
      record.userName,
      record.branchName,
      formatDate(record.sessionDate),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    return haystack.includes(query)
  })
})

const isSelected = (id?: string | number) =>
  String(id) === String(props.selectedRecordId)

const emitSelect = (id?: string | number) => {
  emit("select", id)
}

const emitDelete = (record: ClinicalRecord) => {
  emit("delete", record)
}

const formatDate = (date?: string | number | Date) => {
  if (!date) return "Sin fecha"
  return new Date(date).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
</script>

<style scoped>
.clinical-record-list__search :deep(.v-field) {
  border-radius: 12px;
}

.clinical-record-list__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2.5rem 1rem;
}

.clinical-record-list__item {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 14px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgb(var(--v-theme-surface));
}

.clinical-record-list__item:hover {
  border-color: rgba(var(--v-theme-primary), 0.35);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
}

.clinical-record-list__item--active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.06);
  box-shadow: 0 8px 20px rgba(235, 88, 137, 0.12);
}

.clinical-record-list__timeline {
  display: flex;
  align-items: center;
  padding-top: 4px;
}

.clinical-record-list__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.15);
}

.clinical-record-list__item--active .clinical-record-list__dot {
  box-shadow: 0 0 0 5px rgba(var(--v-theme-primary), 0.22);
}

.clinical-record-list__delete {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.clinical-record-list__item:hover .clinical-record-list__delete,
.clinical-record-list__item--active .clinical-record-list__delete {
  opacity: 1;
}
</style>
