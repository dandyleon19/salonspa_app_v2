<template>
  <div class="d-flex flex-column ga-2">
    <div v-if="!records.length" class="text-center py-8">
      <p class="text-caption">
        No hay historiales clínicos registrados
      </p>
    </div>
    <div
        v-else
        v-for="record in records"
        :key="record.id"
        @click="emitSelect(record.id)"
    >
      <v-card
          class="pa-4 cursor-pointer transition bg-white"
      >
        <div class="d-flex justify-space-between align-start mb-2">
          <div class="flex-grow-1">
            <p class="text-body-2 font-weight-bold">
              {{ record.diagnosis || 'Sin diagnóstico' }}
            </p>
          </div>
          <v-avatar size="32" color="primary" class="mr-3">
            <v-btn
                icon
                size="x-small"
                variant="text"
                @click.stop="emitDelete(record)"
            >
              <v-icon size="16">mdi-delete</v-icon>
            </v-btn>
          </v-avatar>
        </div>
        <div class="text-caption text-grey-darken-1">
          <div class="d-flex align-center mb-1">
            <v-icon size="14" class="mr-2">mdi-calendar</v-icon>
            <span>{{ formatDate(record.sessionDate) }}</span>
          </div>

          <div class="d-flex align-center mb-1">
            <v-icon size="14" class="mr-2">mdi-stethoscope</v-icon>
            <span>{{ record.userName }}</span>
          </div>

          <div class="d-flex align-center">
            <v-icon size="14" class="mr-2">mdi-map-marker-outline</v-icon>
            <span>{{ record.branchName }}</span>
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
  selectedRecordId: number | null
}>()

const emit = defineEmits(['select', 'delete'])

const emitSelect = (id: any) => {
  emit('select', id)
}

const emitDelete = (id: any) => {
  emit('delete', id)
}

const formatDate = (date: string | number | Date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.transition {
  transition: all 0.2s ease;
}
</style>