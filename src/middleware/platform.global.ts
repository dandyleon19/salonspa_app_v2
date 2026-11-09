import { useAuthStore } from "~/store/modules/auth"

/**
 * The only pages the platform owner (SUPER_ADMIN) has: their dashboard, the salons (with their subscriptions), and the
 * branches and users of every salon (they set them up for the salons).
 */
const PLATFORM_PATHS = ["/app", "/app/salons", "/app/branches", "/app/users"]

/**
 * Runs after auth.global.ts (middleware files run in alphabetical order). The platform owner manages salons, their
 * subscriptions, branches and users and does not work inside any salon (appointments, sales, reports, clients and
 * clinical records are the salon's own business), so any other page sends them to their dashboard instead of showing
 * a screen that is not theirs. The backend still decides what each role may do.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith("/app")) return

  const authStore = useAuthStore()
  if (!authStore.token || !authStore.user || !authStore.isSuperAdmin) return

  const path = to.path.replace(/\/+$/, "") || "/app"
  if (PLATFORM_PATHS.includes(path)) return

  return navigateTo("/app")
})
