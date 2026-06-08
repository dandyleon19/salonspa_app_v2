<template>
  <div class="h-100 overflow-y-auto">
    <div
        v-if="!record"
        class="d-flex align-center justify-center h-100 text-grey"
    >
      <div class="text-center">
        <v-icon size="48" class="mb-3" color="grey-lighten-1">
          mdi-alert-circle-outline
        </v-icon>
        <p>Selecciona un historial clínico para ver los detalles</p>
      </div>
    </div>

    <div v-else class="pb-6">
      <div class="px-4">
        <div class="d-flex mb-4">
          <v-avatar size="32" color="primary" class="mr-3">
            <v-icon size="18" color="white">
              mdi-calendar
            </v-icon>
          </v-avatar>

          <div>
            <p class="text-caption text-grey">Fecha</p>
            <p class="text-body-2 font-weight-medium">
              {{ formatDate(record.sessionDate) }}
            </p>
          </div>
        </div>

        <div class="d-flex mb-4">
          <v-avatar size="32" color="primary" class="mr-3">
            <v-icon size="18" color="white">
              mdi-stethoscope
            </v-icon>
          </v-avatar>

          <div>
            <p class="text-caption text-grey">Médico/Especialista</p>
            <p class="text-body-2 font-weight-medium">
              {{ record.userName }}
            </p>
          </div>
        </div>

        <div class="d-flex mb-4">
          <v-avatar size="32" color="primary" class="mr-3">
            <v-icon size="18" color="white">
              mdi-map-marker-outline
            </v-icon>
          </v-avatar>

          <div>
            <p class="text-caption text-grey">Sucursal</p>
            <p class="text-body-2 font-weight-medium">
              {{ record.branchName }}
            </p>
          </div>
        </div>

        <v-card
            v-if="record?.diagnosis"
            class="mb-4 pa-4"
            color="blue-lighten-5"
            variant="flat"
            border
        >
          <div class="d-flex align-center mb-2">
            <div class="rounded-circle bg-blue mr-2" style="width:6px;height:6px;"></div>
            <span class="text-caption font-weight-bold text-blue-darken-3">
              Diagnóstico
            </span>
          </div>

          <p class="text-body-2">
            {{ record.diagnosis }}
          </p>
        </v-card>

        <v-card
            v-if="record?.treatment"
            class="mb-4 pa-4"
            color="green-lighten-5"
            variant="flat"
            border
        >
          <div class="d-flex align-center mb-2">
            <div class="rounded-circle bg-green mr-2" style="width:6px;height:6px;"></div>
            <span class="text-caption font-weight-bold text-green-darken-3">
              Tratamiento
            </span>
          </div>

          <p class="text-body-2">
            {{ record.treatment }}
          </p>
        </v-card>

        <v-card
            v-if="record?.observations"
            class="mb-4 pa-4"
            color="amber-lighten-5"
            variant="flat"
            border
        >
          <div class="d-flex align-center mb-2">
            <div class="rounded-circle bg-amber mr-2" style="width:6px;height:6px;"></div>
            <span class="text-caption font-weight-bold text-amber-darken-3">
              Observaciones
            </span>
          </div>

          <p class="text-body-2">
            {{ record.observations }}
          </p>
        </v-card>

        <v-card
            v-if="record?.associatedServices"
            class="pa-4"
            color="orange-lighten-5"
            variant="flat"
            border
        >
          <div class="d-flex align-center mb-2">
            <div class="rounded-circle bg-orange mr-2" style="width:6px;height:6px;"></div>
            <span class="text-caption font-weight-bold text-orange-darken-3">
              Servicios asociados
            </span>
          </div>

          <p class="text-body-2">
            {{ record.associatedServices.join(", ") }}
          </p>
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

const formatDate = (date: string | number | Date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>