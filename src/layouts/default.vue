<template>
  <div class="default-layout">
    <v-container class=fill-height>
      <slot />
    </v-container>
  </div>
</template>

<script setup lang="ts">
useHead({
  titleTemplate: "%s - Salon Spa"
})
</script>

<style scoped>
.default-layout {
  /*background-image: url('@/assets/img/spa-1.jpg');*/
  background-repeat: no-repeat;
  background-size: cover;
  height: 100vh;
}
</style>