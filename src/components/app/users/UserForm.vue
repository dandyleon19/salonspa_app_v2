<template>
  <v-form @submit.prevent="onSubmit" ref="userFormRef" v-model="isValid" lazy-validation class="pa-4">
    <template v-if="!['changePassword', 'changeBranches'].includes(dataModalForm.action)">
      <v-text-field
        v-model="user.firstName"
        label="Nombres"
        :rules="[rules.required]"
      />

      <v-text-field
        v-model="user.lastName"
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
        v-model="user.commissionPercentage"
        label="Porcentaje de Comisión"
        type="number"
        :rules="[rules.required, rules.decimal]"
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
        v-model="user.passwordConfirmation"
        label="Confirmar Contraseña"
        type="password"
        autocomplete="off"
        :rules="[rules.required, rules.matchPassword(user.password)]"
      />
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
import { useBranchesStore, useUsersStore } from "~/store";

// Composables
const usersStore = useUsersStore();

const props = defineProps<{
  dataModalForm: userDataModalForm
}>()

const emit = defineEmits<{
  (e: "create" | "update" | "changePassword", user: User): void
}>()

const isValid = ref<boolean>(false);
const userFormRef = ref<any>(null);

const user = ref<User>({
  firstName: "",
  lastName: "",
  email: "",
  isActive: true,
  commissionPercentage: "",
  password: "",
  passwordConfirmation: ""
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
    default:
      return "Guardar"
  }
})

// Computed
const usersList = computed(() => {
  return usersStore.list;
});

async function getUser() {
  try {
    const getUser = usersList.value.find(user => user.id == props.dataModalForm.rowId)
    user.value = { ...getUser } as User
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

onMounted(() => {

})
</script>
