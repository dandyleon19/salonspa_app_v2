<template>
  <v-form v-model="valid" @submit.prevent="login">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="credentials.email"
            :rules="emailRules"
            label="Usuario"
            required
            variant="outlined"
            placeholder="johndoe@gmail.com"
          ></v-text-field>
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="credentials.password"
            :rules="passwordRules"
            label="Contraseña"
            required
            variant="outlined"
            type="password"
          ></v-text-field>
        </v-col>
        <v-col cols="12">
          <v-btn
            @click="handleLogin"
            size="large"
            type="submit"
            block
            class="mt-2"
            rounded="lg"
            color="success"
          >
            Ingresar
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>

<script setup lang="ts">
import { ref } from "vue";

const { login } = useAuth()

const credentials = reactive({
  email: "",
  password: "",
});

const valid = ref(false);

const emailRules = ref([
  (value: string) => {
    if (value) return true;

    return "E-mail is required.";
  },
  (value: string) => {
    if (/.+@.+\..+/.test(value)) return true;

    return "E-mail must be valid.";
  },
]);

const passwordRules = ref([
  (value: string) => {
    if (value) return true;

    return "Password is required.";
  },
]);

const handleLogin = async () => {
  try {
    await login(credentials.email, credentials.password)
    navigateTo('/app')
  } catch (e) {
    console.error('Error login', e)
  }
}
</script>

<style>
</style>