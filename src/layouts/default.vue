<template>
  <div class="default-layout">
    <div class="default-layout__glow default-layout__glow--left" />
    <div class="default-layout__glow default-layout__glow--right" />

    <v-container class="default-layout__container fill-height">
      <slot />
    </v-container>
  </div>
</template>

<script setup lang="ts">
useHead({
  titleTemplate: "%s - Marité Salon & Spa",
})
</script>

<style scoped>
.default-layout {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  background:
    radial-gradient(circle at top, rgba(235, 88, 137, 0.12), transparent 42%),
    linear-gradient(180deg, #fff 0%, #faf7f8 100%);
}

.default-layout__glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(80px);
}

.default-layout__glow--left {
  top: -120px;
  left: -80px;
  width: 320px;
  height: 320px;
  background: rgba(235, 88, 137, 0.18);
}

.default-layout__glow--right {
  right: -100px;
  bottom: -80px;
  width: 280px;
  height: 280px;
  background: rgba(244, 143, 177, 0.22);
}

.default-layout__container {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 1.5rem;
}
</style>
