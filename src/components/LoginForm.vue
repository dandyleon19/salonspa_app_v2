<template>
  <div class="login-form position-relative">
    <v-overlay
      :model-value="isSubmitting"
      contained
      persistent
      class="align-center justify-center"
      scrim="rgba(255, 255, 255, 0.85)"
    >
      <div class="d-flex flex-column align-center">
        <v-progress-circular
          indeterminate
          color="success"
          size="52"
          width="4"
        />
        <span class="text-body-2 mt-3 font-weight-medium text-medium-emphasis">
          Iniciando sesión...
        </span>
      </div>
    </v-overlay>

    <v-form v-model="valid" class="app-form" @submit.prevent="handleLogin">
      <v-row dense>
        <v-col cols="12">
          <v-text-field
            v-model="credentials.email"
            v-bind="field"
            :rules="emailRules"
            label="Correo electrónico"
            placeholder="johndoe@gmail.com"
            autocomplete="email"
            prepend-inner-icon="mdi-email-outline"
            :disabled="isSubmitting"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="credentials.password"
            v-bind="field"
            :rules="passwordRules"
            label="Contraseña"
            type="password"
            autocomplete="current-password"
            prepend-inner-icon="mdi-lock-outline"
            :disabled="isSubmitting"
          />
        </v-col>
        <v-col cols="12" class="pt-2">
          <v-btn
            size="large"
            type="submit"
            block
            rounded="lg"
            color="primary"
            variant="flat"
            class="app-form-btn--primary"
            :loading="isSubmitting"
            :disabled="!valid || isSubmitting"
          >
            Ingresar
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const { login: authLogin } = useAuth()
const { success, error: showError } = useNotification()
const { field } = useFormFields()

const credentials = reactive({
  email: "",
  password: "",
});

const valid = ref(false);
const isSubmitting = ref(false);

const emailRules = ref([
  (value: string) => {
    if (value?.trim()) return true;
    return "El correo es obligatorio.";
  },
  (value: string) => {
    if (/.+@.+\..+/.test(value)) return true;
    return "Ingresa un correo válido.";
  },
]);

const passwordRules = ref([
  (value: string) => {
    if (value) return true;
    return "La contraseña es obligatoria.";
  },
]);

const getLoginErrorMessage = (err: unknown): string => {
  if (err && typeof err === "object") {
    const fetchError = err as {
      data?: { message?: string; error?: string }
      statusMessage?: string
    }

    if (fetchError.data?.message) return fetchError.data.message
    if (fetchError.data?.error) return fetchError.data.error
    if (fetchError.statusMessage) return fetchError.statusMessage
  }

  return "No se pudo iniciar sesión. Verifica tus credenciales e inténtalo de nuevo."
}

const handleLogin = async () => {
  if (!valid.value || isSubmitting.value) return

  isSubmitting.value = true

  try {
    const response = await authLogin(
      credentials.email,
      credentials.password
    )

    const userName =
      response.user?.fullName ||
      [response.user?.firstName, response.user?.lastName].filter(Boolean).join(" ")

    success(
      userName ? `Bienvenido, ${userName}` : "Has iniciado sesión correctamente",
      "Inicio de sesión exitoso"
    )

    await new Promise((resolve) => setTimeout(resolve, 800))
    await navigateTo("/app")
  } catch (e) {
    showError(getLoginErrorMessage(e), "Error al iniciar sesión")
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.login-form {
  min-height: 220px;
}
</style>
