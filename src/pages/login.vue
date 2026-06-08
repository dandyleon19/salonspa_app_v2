<template>
  <v-row
      class="mb-6 v-login"
      no-gutters>
    <v-col
        cols="12" md="7" xl="4"
        offset-xl="7" offset-md="5">
      <v-card class="overflow-hidden">
        <v-card-text>
          <div class="d-flex flex-column align-center mb-4">
            <v-avatar size="72" rounded="lg" class="mb-3">
              <v-img src="/apple-touch-icon.png" alt="Marité Salón & Spa" cover />
            </v-avatar>
            <p class="text-center v-login__title mb-0">Iniciar Sesión</p>
          </div>
          <LoginForm/>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
useHead({
  title: "Login",
  link: [
    { rel: "icon", href: "/favicon.ico", sizes: "any" },
    { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
  ],
})
</script>

<style scoped>
.v-login .v-card {
  border-radius: 15px;
  opacity: 0.8;
}

.v-login__title {
  font-size: 20px;
  font-weight: bold;
}
</style>