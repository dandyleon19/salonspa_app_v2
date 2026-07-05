<template>
  <Icon
    :name="resolvedName"
    :size="normalizedSize"
    :class="iconClass"
    mode="svg"
  />
</template>

<script setup lang="ts">
import { resolveAppIcon } from "~/constants/appIcons"

const props = withDefaults(
  defineProps<{
    name: string
    size?: string | number
    iconClass?: string
  }>(),
  {
    size: 24,
    iconClass: "",
  }
)

const resolvedName = computed(() => resolveAppIcon(props.name))

const normalizedSize = computed(() => {
  const size = props.size

  if (typeof size === "number") return `${size}px`
  if (/^\d+$/.test(size)) return `${size}px`

  return size
})
</script>
