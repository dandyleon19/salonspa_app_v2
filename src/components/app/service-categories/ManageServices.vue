<template>
  <DrawerItemList
    :form-mode="formMode"
    :form-title="formMode === 'create' ? 'Nuevo servicio' : 'Editar servicio'"
    create-label="Nuevo servicio"
    :search-term="searchTerm"
    search-placeholder="Buscar servicio..."
    :items="filteredServices"
    :filtered-count="filteredServices.length"
    :total-count="services.length"
    item-label="servicio"
    empty-label="Sin servicios"
    no-results-label="No se encontraron servicios"
    empty-hint="Agrega el primer servicio con el botón de arriba"
    empty-icon="mdi-spa-outline"
    :loading="loading"
    @create="handleOpenCreate"
    @edit="handleOpenEdit"
    @delete="handleOpenDelete"
    @cancel-form="handleCloseServiceForm"
    @update:search-term="searchTerm = $event"
  >
    <template #form>
      <v-form
        ref="serviceFormRef"
        v-model="isValid"
        class="app-form"
        lazy-validation
        :disabled="loading"
        @submit.prevent="handleSubmit"
      >
        <AppFormSection title="Servicio" subtitle="Información y precio">
          <v-text-field
            v-model="serviceFormData.name"
            v-bind="field"
            label="Nombre del servicio"
            :rules="[rules.required, rules.maxLength(150)]"
          />

          <v-textarea
            v-model="serviceFormData.description"
            v-bind="textarea"
            label="Descripción corta"
            rows="2"
            :rules="[rules.maxLength(300)]"
          />

          <v-textarea
            v-model="serviceFormData.longDescription"
            v-bind="textarea"
            label="Descripción detallada"
            rows="4"
            :rules="[rules.maxLength(2000)]"
          />

          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="serviceFormData.price"
                v-bind="field"
                label="Precio"
                type="number"
                prefix="S/"
                :rules="[rules.required, rules.decimal, rules.positiveNumber, rules.money]"
              />
            </v-col>
            <v-col cols="12" md="6" class="d-flex align-center">
              <v-switch
                v-model="serviceFormData.isActive"
                label="Servicio activo"
                color="primary"
                inset
                hide-details
              />
            </v-col>
          </v-row>
        </AppFormSection>

        <AppFormActions>
          <v-btn
            variant="outlined"
            color="primary"
            rounded="lg"
            @click="handleCloseServiceForm"
          >
            Cancelar
          </v-btn>
          <v-btn
            type="submit"
            color="primary"
            variant="flat"
            rounded="lg"
            class="app-form-btn--primary"
            :loading="loading"
          >
            {{ formMode === "create" ? "Crear" : "Guardar" }}
          </v-btn>
        </AppFormActions>
      </v-form>
    </template>

    <template #item="{ item: service }">
      <div class="d-flex align-center flex-wrap ga-2 mb-1">
        <p class="text-body-1 font-weight-bold mb-0">{{ service.name }}</p>
        <v-chip
          size="x-small"
          :color="service.isActive ? 'success' : 'error'"
          variant="tonal"
        >
          {{ service.isActive ? "Activo" : "Inactivo" }}
        </v-chip>
      </div>
      <p v-if="service.description" class="text-body-2 text-medium-emphasis mb-2">
        {{ service.description }}
      </p>
      <div class="d-flex flex-wrap ga-2">
        <v-chip size="x-small" variant="tonal" color="primary" prepend-icon="mdi-currency-usd">
          S/ {{ formatPrice(service.price) }}
        </v-chip>
      </div>
    </template>
  </DrawerItemList>

  <ConfirmationModal
    v-model="showDeleteDialog"
    title="Eliminar servicio"
    message="¿Seguro que deseas eliminar este servicio?"
    :require-text="false"
    @confirm="handleDelete"
  />
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import { validationRules as rules } from "~/helpers/validationFormRules"

const { field, textarea } = useFormFields()
const { notifyCreated, notifyUpdated, notifyDeleted, notifyError } = useApiNotification()
import type { Service } from "~/interfaces/serviceInterfaces"
import type { serviceCategoryDataModalForm } from "~/interfaces/serviceCategoryInterfaces"

const props = defineProps<{
  dataModalForm: serviceCategoryDataModalForm
}>()

const loading = ref(false)
const services = ref<Service[]>([])
const isValid = ref(false)
const serviceFormRef = ref<any>(null)
const showDeleteDialog = ref(false)
const serviceToRemove = ref<Service>()

watch(
  () => props.dataModalForm,
  (newVal) => {
    services.value = newVal?.services || []
  },
  { immediate: true, deep: true }
)

const formMode = ref<"create" | "edit" | null>(null)
const editingId = ref<number | string | undefined>()
const searchTerm = ref("")

const serviceFormData = reactive<Service>({
  name: "",
  description: "",
  longDescription: "",
  price: null,
  isActive: true,
})

const filteredServices = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()
  if (!query) return services.value

  return services.value.filter((service) => {
    const haystack = [
      service.name,
      service.description,
      service.longDescription,
      String(service.price ?? ""),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    return haystack.includes(query)
  })
})

const formatPrice = (price?: number | null) => {
  if (price === null || price === undefined) return "0.00"
  return Number(price).toFixed(2)
}

const resetServiceForm = () => {
  Object.assign(serviceFormData, {
    name: "",
    description: "",
    longDescription: "",
    price: null,
    isActive: true,
  })
}

const handleOpenCreate = () => {
  formMode.value = "create"
  editingId.value = undefined
  resetServiceForm()
}

const handleOpenEdit = (service: Service) => {
  formMode.value = "edit"
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
  loading.value = true
  try {
    const { $api } = useNuxtApp()
    const created = await $api("/api/services", {
      method: "POST",
      body: {
        name: service.name,
        description: service.description,
        longDescription: service.longDescription,
        isActive: service.isActive,
        price: service.price,
        categoryId: props.dataModalForm.rowId,
      },
    })
    notifyCreated("servicio")
    return created
  } catch (err) {
    notifyError(err, "crear el servicio")
    return null
  } finally {
    loading.value = false
  }
}

const handleUpdateService = async (service: Service) => {
  loading.value = true
  try {
    const { $api } = useNuxtApp()
    await $api(`/api/services/${service.id}`, {
      method: "PUT",
      body: {
        name: service.name,
        description: service.description,
        longDescription: service.longDescription,
        isActive: service.isActive,
        price: service.price,
      },
    })
    notifyUpdated("servicio")
    return true
  } catch (err) {
    notifyError(err, "actualizar el servicio")
    return false
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  const valid = await serviceFormRef.value?.validate()
  if (!valid.valid) return

  if (formMode.value === "create") {
    const created = await handleCreateService(serviceFormData)
    if (created) {
      services.value.push(created as Service)
      handleCloseServiceForm()
    }
    return
  }

  if (formMode.value === "edit" && editingId.value) {
    const updated = await handleUpdateService(serviceFormData)
    if (updated) {
      const index = services.value.findIndex((s) => s.id === editingId.value)
      if (index !== -1) {
        services.value[index] = { ...services.value[index], ...serviceFormData }
      }
      handleCloseServiceForm()
    }
  }
}

const handleDelete = async () => {
  try {
    loading.value = true
    const { $api } = useNuxtApp()
    await $api(`/api/services/${serviceToRemove.value?.id}`, {
      method: "DELETE",
    })
    services.value = services.value.filter(
      (s) => s.id !== serviceToRemove.value?.id
    )
    notifyDeleted("servicio")
  } catch (err) {
    notifyError(err, "eliminar el servicio")
  } finally {
    loading.value = false
    showDeleteDialog.value = false
  }
}
</script>

