<template>
  <div v-if="formMode" class="pa-4 border-b">
    <h3 class="mb-3 font-weight-medium">
      {{ formMode === 'create' ? 'Nuevo servicio' : 'Editar servicio' }}
    </h3>

    <v-progress-linear
        v-if="loading"
        indeterminate
        color="primary"
        class="mb-2"
    />

    <v-form @submit.prevent="handleSubmit" ref="serviceFormRef"
            v-model="isValid" lazy-validation :disabled="loading">
      <v-text-field
          v-model="serviceFormData.name"
          label="Nombre del servicio"
          density="comfortable"
          variant="outlined"
          :rules="[
            rules.required,
            rules.maxLength(150)
          ]"
      />

      <v-textarea
          v-model="serviceFormData.description"
          label="Descripción corta"
          density="comfortable"
          variant="outlined"
          rows="2"
          auto-grow
          :rules="[
        rules.maxLength(300)
      ]"
      />

      <v-textarea
          v-model="serviceFormData.longDescription"
          label="Descripción detallada"
          density="comfortable"
          variant="outlined"
          rows="4"
          auto-grow
          :rules="[
        rules.maxLength(2000)
      ]"
      />

      <v-text-field
          v-model="serviceFormData.price"
          label="Precio"
          density="comfortable"
          variant="outlined"
          type="number"
          prefix="S/"
          :rules="[
        rules.required,
        rules.decimal,
        rules.positiveNumber,
        rules.money
      ]"
      />

      <v-switch
          v-model="serviceFormData.isActive"
          label="Servicio activo"
          color="primary"
          inset
      />

      <div class="d-flex ga-2 mt-2">
        <v-btn color="primary" type="submit" :loading="loading">
          {{ formMode === 'create' ? 'Crear' : 'Guardar' }}
        </v-btn>

        <v-btn variant="outlined" @click="handleCloseServiceForm">
          Cancelar
        </v-btn>
      </div>
    </v-form>
  </div>

  <div v-else class="pa-4 border-b">
    <v-btn color="success" block @click="handleOpenCreate">
      Nuevo servicio
    </v-btn>
  </div>

  <div class="pa-4 border-b">
    <v-text-field
        v-model="searchTerm"
        label="Buscar servicio..."
        density="compact"
        clearable
        prepend-inner-icon="mdi-magnify"
    />
  </div>

  <div class="pa-4">
    <div v-if="filteredServices.length === 0" class="text-center text-grey">
      <p v-if="services.length === 0">Sin servicioes</p>
      <p v-else>No se encontraron resultados</p>
    </div>

    <div v-else class="d-flex flex-column ga-3">
      <v-card
          v-for="service in filteredServices"
          :key="service.id"
          variant="outlined"
      >
        <v-card-text class="d-flex justify-space-between align-start">
          <div>
            <div class="font-weight-bold">Nombre: {{ service.name }}</div>
            <div class="text-body-2">Dirección {{ service.description }}</div>
            <div class="text-body-2">Ciudad: {{ service.longDescription }}</div>
            <div class="text-body-2">Ciudad: {{ service.price }}</div>
            <div class="text-body-2">Ciudad: {{ service.isActive ? 'Activo' : 'Inactivo' }}</div>
          </div>

          <div class="d-flex ga-2">
            <v-btn icon size="small" color="primary" @click="handleOpenEdit(service)">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>

            <v-btn icon size="small" color="error" @click="handleOpenDelete(service)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>

  <ConfirmationModal
      v-model="showDeleteDialog"
      title="Eliminar servicio"
      message="¿Seguro que deseas eliminar esta servicio?"
      :require-text="false"
      @confirm="handleDelete"
  />
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { validationRules as rules } from "~/helpers/validationFormRules"
import type { Service } from "~/interfaces/serviceInterfaces";
import type { serviceCategoryDataModalForm } from "~/interfaces/serviceCategoryInterfaces";

// Props
const props = defineProps<{
  dataModalForm: serviceCategoryDataModalForm
}>()

// 🔥 Copia para evitar mutación del store
const loading = ref<boolean>(false);
const services = ref<Service[]>([])
const isValid = ref<boolean>(false);
const serviceFormRef = ref<any>(null);
const showDeleteDialog = ref<boolean>(false)
const serviceToRemove = ref<Service>()

watch(
    () => props.dataModalForm,
    (newVal) => {
      services.value = newVal?.services || []
    },
    {immediate: true, deep: true}
)

// Estado
const formMode = ref<'create' | 'edit' | null>(null)
const editingId = ref<number | undefined>()
const searchTerm = ref('')

const serviceFormData = reactive<Service>({
  name: '',
  description: '',
  longDescription: '',
  price: null,
  isActive: true
})

// Computed
const filteredServices = computed(() =>
    services.value.filter(b =>
        b.name.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
)

// Actions
const handleOpenCreate = () => {
  formMode.value = 'create'
  editingId.value = undefined
  Object.assign(serviceFormData, {name: '', address: '', city: ''})
}

const handleOpenEdit = (service: Service) => {
  formMode.value = 'edit'
  editingId.value = service.id
  Object.assign(serviceFormData, service)
}

const handleOpenDelete = (service: Service) => {
  showDeleteDialog.value = true
  serviceToRemove.value = service
}

const handleCloseServiceForm = () => {
  formMode.value = null
  editingId.value = undefined
}

const handleCreateService = async (service: Service) => {
  try {
    loading.value = true;
    const {$api} = useNuxtApp();
    return await $api("/api/services", {
      method: "POST",
      body: {
        name: service.name,
        description: service.description,
        longDescription: service.longDescription,
        isActive: service.isActive,
        price: service.price,
        categoryId: props.dataModalForm.rowId
      },
    })
  } catch (err) {
    console.error("=======> Error: ", err);
    return null
  } finally {
    loading.value = false;
  }
};

const handleUpdateService = async (service: Service) => {
  try {
    loading.value = true;
    const {$api} = useNuxtApp();
    await $api(`/api/services/${service.id}`, {
      method: "PUT",
      body: {
        name: service.name,
        description: service.description,
        longDescription: service.longDescription,
        isActive: service.isActive,
        price: service.price
      },
    });
  } catch (err) {
    console.error("=======> Error: ", err);
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  const valid = await serviceFormRef.value?.validate();
  if (!valid.valid) {
    return;
  }

  if (formMode.value === 'create') {
    const created = await handleCreateService(serviceFormData)
    services.value.push(created as Service)
  }

  if (formMode.value === 'edit' && editingId.value) {
    await handleUpdateService(serviceFormData)

    const index = services.value.findIndex(b => b.id === editingId.value)
    if (index !== -1) {
      services.value[index] = {...services.value[index], ...serviceFormData}
    }
  }

  handleCloseServiceForm()
}

const handleDelete = async () => {
  try {
    loading.value = true;
    const {$api} = useNuxtApp();
    await $api(`/api/services/${serviceToRemove.value?.id}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.error("=======> Error: ", err);
  } finally {
    loading.value = false;
  }
}
</script>