<template>
  <DrawerItemList
    :form-mode="formMode"
    :form-title="formMode === 'create' ? 'Nueva sucursal' : 'Editar sucursal'"
    create-label="Nueva sucursal"
    :search-term="searchTerm"
    search-placeholder="Buscar sucursal..."
    :items="filteredBranches"
    :filtered-count="filteredBranches.length"
    :total-count="branches.length"
    item-label="sucursal"
    empty-label="Sin sucursales"
    no-results-label="No se encontraron sucursales"
    empty-hint="Agrega la primera sucursal con el botón de arriba"
    empty-icon="mdi-store-outline"
    :loading="loading"
    @create="handleOpenCreate"
    @edit="handleOpenEdit"
    @delete="handleOpenDelete"
    @cancel-form="handleCloseBranchForm"
    @update:search-term="searchTerm = $event"
  >
    <template #form>
      <v-form
        ref="branchFormRef"
        v-model="isValid"
        class="app-form"
        lazy-validation
        :disabled="loading"
        @submit.prevent="handleSubmit"
      >
        <AppFormSection title="Sucursal" subtitle="Datos de ubicación">
          <v-text-field
            v-model="branchFormData.name"
            v-bind="field"
            label="Nombre"
            :rules="[rules.required]"
          />

          <v-text-field
            v-model="branchFormData.address"
            v-bind="field"
            label="Dirección"
            prepend-inner-icon="mdi-map-marker-outline"
            :rules="[rules.required]"
          />

          <v-text-field
            v-model="branchFormData.city"
            v-bind="field"
            label="Ciudad"
            prepend-inner-icon="mdi-city-variant-outline"
            :rules="[rules.required]"
          />
        </AppFormSection>

        <AppFormActions>
          <v-btn
            variant="outlined"
            color="primary"
            rounded="lg"
            @click="handleCloseBranchForm"
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

    <template #item="{ item: branch }">
      <p class="text-body-1 font-weight-bold mb-1">{{ branch.name }}</p>
      <div class="d-flex flex-wrap ga-2">
        <v-chip size="x-small" variant="tonal" prepend-icon="mdi-map-marker-outline">
          {{ branch.address }}
        </v-chip>
        <v-chip size="x-small" variant="tonal" prepend-icon="mdi-city-variant-outline">
          {{ branch.city }}
        </v-chip>
      </div>
    </template>
  </DrawerItemList>

  <ConfirmationModal
    v-model="showDeleteDialog"
    title="Eliminar sucursal"
    message="¿Seguro que deseas eliminar esta sucursal?"
    :require-text="false"
    @confirm="handleDelete"
  />
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import { validationRules as rules } from "~/helpers/validationFormRules"

const { field } = useFormFields()
import type { Branch, salonDataModalForm } from "~/interfaces/salonInterfaces"

const props = defineProps<{
  dataModalForm: salonDataModalForm
}>()

const loading = ref(false)
const branches = ref<Branch[]>([])
const isValid = ref(false)
const branchFormRef = ref<any>(null)
const showDeleteDialog = ref(false)
const branchToRemove = ref<Branch>()

watch(
  () => props.dataModalForm,
  (newVal) => {
    branches.value = newVal?.branches || []
  },
  { immediate: true, deep: true }
)

const formMode = ref<"create" | "edit" | null>(null)
const editingId = ref<number | string | undefined>()
const searchTerm = ref("")

const branchFormData = reactive<Branch>({
  name: "",
  address: "",
  city: "",
})

const filteredBranches = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()
  if (!query) return branches.value

  return branches.value.filter(
    (branch) =>
      branch.name.toLowerCase().includes(query) ||
      branch.city.toLowerCase().includes(query) ||
      branch.address.toLowerCase().includes(query)
  )
})

const handleOpenCreate = () => {
  formMode.value = "create"
  editingId.value = undefined
  Object.assign(branchFormData, { name: "", address: "", city: "" })
}

const handleOpenEdit = (branch: Branch) => {
  formMode.value = "edit"
  editingId.value = branch.id
  Object.assign(branchFormData, branch)
}

const handleOpenDelete = (branch: Branch) => {
  showDeleteDialog.value = true
  branchToRemove.value = branch
}

const handleCloseBranchForm = () => {
  formMode.value = null
  editingId.value = undefined
}

const handleCreateBranch = async (branch: Branch) => {
  try {
    loading.value = true
    const { $api } = useNuxtApp()
    return await $api("/api/branches", {
      method: "POST",
      body: {
        name: branch.name,
        address: branch.address,
        city: branch.city,
      },
    })
  } catch (err) {
    console.error("=======> Error: ", err)
    return null
  } finally {
    loading.value = false
  }
}

const handleUpdateBranch = async (branch: Branch) => {
  try {
    loading.value = true
    const { $api } = useNuxtApp()
    await $api(`/api/branches/${branch.id}`, {
      method: "PUT",
      body: {
        name: branch.name,
        address: branch.address,
        city: branch.city,
      },
    })
  } catch (err) {
    console.error("=======> Error: ", err)
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  const valid = await branchFormRef.value?.validate()
  if (!valid.valid) return

  if (formMode.value === "create") {
    const created = await handleCreateBranch(branchFormData)
    if (created) branches.value.push(created as Branch)
  }

  if (formMode.value === "edit" && editingId.value) {
    await handleUpdateBranch(branchFormData)
    const index = branches.value.findIndex((b) => b.id === editingId.value)
    if (index !== -1) {
      branches.value[index] = { ...branches.value[index], ...branchFormData }
    }
  }

  handleCloseBranchForm()
}

const handleDelete = async () => {
  try {
    loading.value = true
    const { $api } = useNuxtApp()
    await $api(`/api/branches/${branchToRemove.value?.id}`, {
      method: "DELETE",
    })
    branches.value = branches.value.filter(
      (b) => b.id !== branchToRemove.value?.id
    )
  } catch (err) {
    console.error("=======> Error: ", err)
  } finally {
    loading.value = false
    showDeleteDialog.value = false
  }
}
</script>

