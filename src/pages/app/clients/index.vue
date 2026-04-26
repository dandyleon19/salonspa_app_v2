<template>
  <AppTable
      title="Salones"
      subtitle="Lista de salones registrados"
      :headers="headers"
      :rowOptions="rowOptions"
      :filters="tableFilters"
      :items="salonsList"
      :total-items="salonsList.length"
      :loading="loadingSalonsList"
      @handle-create-button="handleCreateButton"
      @handle-row-action-button="handleRowActionButton"
  />

  <AppDrawer
      v-model="openSalonDrawer"
      title="Gestión de Salones"
      :loading="loading"
      size="large"
      location="end"
      :temporary="true"
      @close="closeSalonDrawer"
  >

  </AppDrawer>

  <ConfirmationModal
      v-model="showDeleteDialog"
      title="Eliminar usuario"
      message="¿Deseas eliminar este salón? Esta acción no se puede deshacer."
      :require-text="false"
      @confirm="handleDeleteSalon"
  />
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'app'
})
</script>