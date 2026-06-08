<template>
  <div class="clinical-record-detail h-100">
    <div
      v-if="!record"
      class="clinical-record-detail__empty d-flex align-center justify-center h-100"
    >
      <div class="text-center px-6">
        <v-avatar size="72" color="primary" variant="tonal" class="mb-4">
          <v-icon size="36">mdi-clipboard-pulse-outline</v-icon>
        </v-avatar>
        <p class="text-h6 font-weight-medium mb-2">Selecciona un historial</p>
        <p class="text-body-2 text-medium-emphasis">
          Elige un registro de la lista para ver diagnóstico, tratamiento y observaciones
        </p>
      </div>
    </div>

    <div v-else class="clinical-record-detail__content">
      <div class="clinical-record-detail__hero mb-5">
        <div class="d-flex align-start justify-space-between flex-wrap ga-3">
          <div>
            <v-chip
              size="small"
              color="primary"
              variant="tonal"
              prepend-icon="mdi-calendar-month-outline"
              class="mb-3"
            >
              {{ formatDate(record.sessionDate) }}
            </v-chip>
            <h3 class="text-h5 font-weight-bold mb-1">
              {{ record.diagnosis || "Sin diagnóstico registrado" }}
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-0">
              Detalle completo de la sesión clínica
            </p>
          </div>

          <v-avatar size="48" color="primary" variant="tonal">
            <v-icon>mdi-file-document-outline</v-icon>
          </v-avatar>
        </div>
      </div>

      <v-row dense class="mb-4">
        <v-col cols="12" sm="6">
          <v-card class="clinical-record-detail__meta-card pa-4" variant="flat">
            <div class="d-flex align-center ga-3">
              <v-avatar size="40" color="primary" variant="tonal">
                <v-icon size="20">mdi-stethoscope</v-icon>
              </v-avatar>
              <div>
                <p class="text-caption text-medium-emphasis mb-1">Especialista</p>
                <p class="text-body-2 font-weight-medium mb-0">
                  {{ record.userName || "—" }}
                </p>
              </div>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6">
          <v-card class="clinical-record-detail__meta-card pa-4" variant="flat">
            <div class="d-flex align-center ga-3">
              <v-avatar size="40" color="secondary" variant="tonal">
                <v-icon size="20">mdi-store-outline</v-icon>
              </v-avatar>
              <div>
                <p class="text-caption text-medium-emphasis mb-1">Sucursal</p>
                <p class="text-body-2 font-weight-medium mb-0">
                  {{ record.branchName || "—" }}
                </p>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <div class="d-flex flex-column ga-3">
        <v-card
          v-if="record.diagnosis"
          class="clinical-record-detail__section"
          variant="flat"
        >
          <div class="d-flex align-center ga-2 mb-3">
            <v-avatar size="32" color="info" variant="tonal">
              <v-icon size="18">mdi-clipboard-pulse</v-icon>
            </v-avatar>
            <span class="text-subtitle-2 font-weight-bold">Diagnóstico</span>
          </div>
          <p class="text-body-2 clinical-record-detail__text mb-0">
            {{ record.diagnosis }}
          </p>
        </v-card>

        <v-card
          v-if="record.treatment"
          class="clinical-record-detail__section"
          variant="flat"
        >
          <div class="d-flex align-center ga-2 mb-3">
            <v-avatar size="32" color="success" variant="tonal">
              <v-icon size="18">mdi-medical-bag</v-icon>
            </v-avatar>
            <span class="text-subtitle-2 font-weight-bold">Tratamiento</span>
          </div>
          <p class="text-body-2 clinical-record-detail__text mb-0">
            {{ record.treatment }}
          </p>
        </v-card>

        <v-card
          v-if="record.observations"
          class="clinical-record-detail__section"
          variant="flat"
        >
          <div class="d-flex align-center ga-2 mb-3">
            <v-avatar size="32" color="warning" variant="tonal">
              <v-icon size="18">mdi-note-text-outline</v-icon>
            </v-avatar>
            <span class="text-subtitle-2 font-weight-bold">Observaciones</span>
          </div>
          <p class="text-body-2 clinical-record-detail__text mb-0">
            {{ record.observations }}
          </p>
        </v-card>

        <v-card
          v-if="record.associatedServices?.length"
          class="clinical-record-detail__section"
          variant="flat"
        >
          <div class="d-flex align-center ga-2 mb-3">
            <v-avatar size="32" color="orange" variant="tonal">
              <v-icon size="18">mdi-spa-outline</v-icon>
            </v-avatar>
            <span class="text-subtitle-2 font-weight-bold">Servicios asociados</span>
          </div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="service in record.associatedServices"
              :key="service"
              size="small"
              color="primary"
              variant="tonal"
            >
              {{ service }}
            </v-chip>
          </div>
        </v-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ClinicalRecord } from "~/interfaces/clinicalRecordInterfaces";

defineProps<{
  record: ClinicalRecord | null
}>()

const formatDate = (date?: string | number | Date) => {
  if (!date) return "Sin fecha"
  return new Date(date).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
</script>

<style scoped>
.clinical-record-detail__empty {
  min-height: 360px;
}

.clinical-record-detail__content {
  animation: fadeIn 0.25s ease;
}

.clinical-record-detail__hero {
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.clinical-record-detail__meta-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 14px;
  background: rgba(var(--v-theme-surface), 0.8);
}

.clinical-record-detail__section {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 14px;
  padding: 18px;
  background: rgb(var(--v-theme-surface));
}

.clinical-record-detail__text {
  line-height: 1.7;
  white-space: pre-wrap;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
