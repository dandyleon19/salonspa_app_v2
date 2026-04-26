<template>
  <v-row
      class="mb-6 v-login"
      no-gutters>
    <v-col
        cols="12" md="7" xl="4"
        offset-xl="7" offset-md="5">
      <v-card>
        <v-card-text>
          <p class="text-center v-login__title">Iniciar Sesion</p>
          <LoginForm/>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
useHead({
  title: "Login"
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