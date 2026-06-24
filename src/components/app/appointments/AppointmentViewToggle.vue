<template>
  <div class="appointment-view-toggle d-flex ga-1">
    <v-btn
      :color="currentView === 'table' ? 'primary' : undefined"
      :variant="currentView === 'table' ? 'flat' : 'tonal'"
      rounded="lg"
      :to="tableRoute"
      exact
    >
      <v-icon start>mdi-table</v-icon>
      Tabla
    </v-btn>
    <v-btn
      :color="currentView === 'calendar' ? 'primary' : undefined"
      :variant="currentView === 'calendar' ? 'flat' : 'tonal'"
      rounded="lg"
      :to="calendarRoute"
      exact
    >
      <v-icon start>mdi-calendar-month-outline</v-icon>
      Calendario
    </v-btn>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

const tableRoute = "/app/appointments"
const calendarRoute = "/app/appointments/calendar"

const currentView = computed(() =>
  route.path.startsWith(calendarRoute) ? "calendar" : "table"
)
</script>

<style scoped>
.appointment-view-toggle :deep(.v-btn) {
  text-transform: none;
  letter-spacing: 0;
}
</style>
