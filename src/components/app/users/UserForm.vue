<template>
  <v-form @submit.prevent="onSubmit" ref="userFormRef" v-model="isValid" lazy-validation class="pa-4">
    <template v-if="!['changePassword', 'changeBranchOffices'].includes(dataModalForm.action)">
      <v-text-field
        v-model="user.first_name"
        label="Nombres"
        :rules="[rules.required]"
      />

      <v-text-field
        v-model="user.last_name"
        label="Apellidos"
        :rules="[rules.required]"
      />

      <v-text-field
        v-model="user.email"
        label="Correo"
        type="email"
        :rules="[rules.required, rules.email]"
      />

      <v-text-field
        v-model="user.commission_percentage"
        label="Porcentaje de Comisión"
        type="number"
        :rules="[rules.required, rules.decimal]"
      />

      <v-select
        v-if="dataModalForm.action === 'create'"
        v-model="user.branch_office_id"
        :items="branchOfficeList"
        item-title="text"
        item-value="value"
        label="Sucursal"
        required
      />
    </template>

    <template v-if="['create', 'changePassword'].includes(dataModalForm.action)">
      <v-text-field
        v-model="user.password"
        label="Contraseña"
        type="password"
        autocomplete="off"
        :rules="[rules.required, rules.minLength(6)]"
      />

      <v-text-field
        v-model="user.password_confirmation"
        label="Confirmar Contraseña"
        type="password"
        autocomplete="off"
        :rules="[rules.required, rules.matchPassword(user.password)]"
      />
    </template>

    <template v-if="dataModalForm.action === 'changeBranchOffices'">
      <v-label class="mb-2">Sucursales</v-label>
      <v-checkbox-group v-model="actualBranchOffices">
        <v-checkbox
          v-for="branch in listBranchOffices"
          :key="branch.value"
          :label="branch.text"
          :value="branch.value"
        />
      </v-checkbox-group>
    </template>

    <div class="d-flex justify-end mt-4">
      <v-btn type="submit" color="primary">
        {{ actionLabel }}
      </v-btn>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import type { ResponseInterface } from "~/interfaces/appInterfaces"
import type { User, userDataModalForm } from "~/interfaces/userInterfaces"
import { validationRules as rules } from "~/helpers/validationFormRules"
import { useUsersStore } from "~/store";

interface BranchOffice {
  id: number
  name: string
}

interface BranchOfficeOption {
  value: number
  text: string
}

// Composables
const usersStore = useUsersStore();

const props = defineProps<{
  dataModalForm: userDataModalForm
}>()

const emit = defineEmits<{
  (e: "create" | "update" | "changePassword" | "changeBranchOffices", user: User): void
}>()

const isValid = ref<boolean>(false);
const userFormRef = ref<any>(null);
const branchOffices = ref<BranchOffice[]>([])
const listBranchOffices = ref<BranchOfficeOption[]>([])
const actualBranchOffices = ref<number[]>([])

const user = ref<User>({
  first_name: "",
  last_name: "",
  email: "",
  commission_percentage: "",
  password: "",
  password_confirmation: "",
  branch_office_id: null,
  branch_offices: []
})

const actionLabel = computed(() => {
  switch (props.dataModalForm.action) {
    case "create":
      return "Nuevo Trabajador"
    case "update":
      getUser()
      return "Actualizar Trabajador"
    case "changePassword":
      getUser()
      return "Actualizar Contraseña"
    case "changeBranchOffices":
      getUser()
      return "Actualizar Sucursales"
    default:
      return "Guardar"
  }
})

const branchOfficeList = computed(() => {
  const options: BranchOfficeOption[] = [
    { value: -1, text: "Seleccione un salón..." }
  ]
  branchOffices.value.forEach(b =>
    options.push({ value: b.id, text: b.name })
  )
  return options
})

// Computed
const usersList = computed(() => {
  return usersStore.list;
});

watch(actualBranchOffices, (val) => {
  if (val.length !== user.value.branch_offices.length) {
    user.value.branch_offices = val
  }
})

onMounted(() => {
  getBranchOffices()
})

async function getUser() {
  try {
    const getUser = usersList.value.find(user => user.id == props.dataModalForm.rowId)
    console.log("=======> getUser", getUser)
    user.value = getUser as User
    user.value.password = ""
    actualBranchOffices.value = user.value.branch_offices
  } catch (err) {
    console.error(err)
  }
}

async function getBranchOffices() {
  try {
    const { $api } = useNuxtApp()
    const res: ResponseInterface = await $api('/api/v1/branch-offices?first=all', {
        method: 'GET',
    })

    branchOffices.value = (res.data as BranchOffice[])
    listBranchOffices.value = branchOffices.value.map(b => ({
      value: b.id,
      text: b.name
    }))
  } catch (err) {
    console.error(err)
  }
}

const onSubmit = async () => {
    const valid = await userFormRef.value?.validate();
    if (!valid.valid) {
        return;
    }
    emit(props.dataModalForm.action, user.value)
}
</script>
