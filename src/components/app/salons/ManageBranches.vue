<template>
  <div v-if="formMode" class="pa-4 border-b">
    <h3 class="mb-3 font-weight-medium">
      {{ formMode === 'create' ? 'Nueva sucursal' : 'Editar sucursal' }}
    </h3>

    <v-progress-linear
        v-if="loading"
        indeterminate
        color="primary"
        class="mb-2"
    />

    <v-form @submit.prevent="handleSubmit" ref="branchFormRef"
            v-model="isValid" lazy-validation :disabled="loading">
      <v-text-field
          v-model="branchFormData.name"
          label="Nombre"
          density="comfortable"
          :rules="[rules.required]"
      />

      <v-text-field
          v-model="branchFormData.address"
          label="Dirección"
          density="comfortable"
          :rules="[rules.required]"
      />

      <v-text-field
          v-model="branchFormData.city"
          label="Ciudad"
          density="comfortable"
          :rules="[rules.required]"
      />

      <div class="d-flex ga-2 mt-2">
        <v-btn color="primary" type="submit" :loading="loading">
          {{ formMode === 'create' ? 'Crear' : 'Guardar' }}
        </v-btn>

        <v-btn variant="outlined" @click="handleCloseBranchForm">
          Cancelar
        </v-btn>
      </div>
    </v-form>
  </div>

  <div v-else class="pa-4 border-b">
    <v-btn color="success" block @click="handleOpenCreate">
      Nueva sucursal
    </v-btn>
  </div>

  <div class="pa-4 border-b">
    <v-text-field
        v-model="searchTerm"
        label="Buscar sucursal..."
        density="compact"
        clearable
        prepend-inner-icon="mdi-magnify"
    />
  </div>

  <div class="pa-4">
    <div v-if="filteredBranches.length === 0" class="text-center text-grey">
      <p v-if="branches.length === 0">Sin sucursales</p>
      <p v-else>No se encontraron resultados</p>
    </div>

    <div v-else class="d-flex flex-column ga-3">
      <v-card
          v-for="branch in filteredBranches"
          :key="branch.id"
          variant="outlined"
      >
        <v-card-text class="d-flex justify-space-between align-start">
          <div>
            <div class="font-weight-bold">Nombre: {{ branch.name }}</div>
            <div class="text-body-2">Dirección {{ branch.address }}</div>
            <div class="text-body-2">Ciudad: {{ branch.city }}</div>
          </div>

          <div class="d-flex ga-2">
            <v-btn icon size="small" color="primary" @click="handleOpenEdit(branch)">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>

            <v-btn icon size="small" color="error" @click="handleOpenDelete(branch)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>

  <ConfirmationModal
      v-model="showDeleteDialog"
      title="Eliminar sucursal"
      message="¿Seguro que deseas eliminar esta sucursal?"
      :require-text="false"
      @confirm="handleDelete"
  />
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { validationRules as rules } from "~/helpers/validationFormRules"
import type { Branch, salonDataModalForm } from "~/interfaces/salonInterfaces";

// Props
const props = defineProps<{
  dataModalForm: salonDataModalForm
}>()

// 🔥 Copia para evitar mutación del store
const loading = ref<boolean>(false);
const branches = ref<Branch[]>([])
const isValid = ref<boolean>(false);
const branchFormRef = ref<any>(null);
const showDeleteDialog = ref<boolean>(false)
const branchToRemove = ref<Branch>()

watch(
    () => props.dataModalForm,
    (newVal) => {
      branches.value = newVal?.branches || []
    },
    {immediate: true, deep: true}
)

// Estado
const formMode = ref<'create' | 'edit' | null>(null)
const editingId = ref<number | undefined>()
const searchTerm = ref('')

const branchFormData = reactive<Branch>({
  name: '',
  address: '',
  city: ''
})

// Computed
const filteredBranches = computed(() =>
    branches.value.filter(b =>
        b.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
        b.city.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
)

// Actions
const handleOpenCreate =  () => {
  formMode.value = 'create'
  editingId.value = undefined
  Object.assign(branchFormData, {name: '', address: '', city: ''})
}

const handleOpenEdit =  (branch: Branch) => {
  formMode.value = 'edit'
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
    loading.value = true;
    const { $api } = useNuxtApp();
    return await $api("/api/branches", {
      method: "POST",
      body: {
        name: branch.name,
        address: branch.address,
        city: branch.city,
        salonId: props.dataModalForm.rowId
      },
    })
  } catch (err) {
    console.error("=======> Error: ", err);
    return null
  } finally {
    loading.value = false;
  }
};

const handleUpdateBranch = async (branch: Branch) => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api(`/api/branches/${branch.id}`, {
      method: "PUT",
      body: {
        name: branch.name,
        address: branch.address,
        city: branch.city,
      },
    });
  } catch (err) {
    console.error("=======> Error: ", err);
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  const valid = await branchFormRef.value?.validate();
  if (!valid.valid) {
    return;
  }

  if (formMode.value === 'create') {
    const created = await handleCreateBranch(branchFormData)
    branches.value.push(created as Branch)
  }

  if (formMode.value === 'edit' && editingId.value) {
    await handleUpdateBranch(branchFormData)

    const index = branches.value.findIndex(b => b.id === editingId.value)
    if (index !== -1) {
      branches.value[index] = {...branches.value[index], ...branchFormData}
    }
  }

  handleCloseBranchForm()
}

const handleDelete = async () => {
  try {
    loading.value = true;
    const { $api } = useNuxtApp();
    await $api(`/api/branches/${branchToRemove.value?.id}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.error("=======> Error: ", err);
  } finally {
    loading.value = false;
  }
}
</script>