import { useAuthStore } from "~/store/modules/auth"
import {
  clearAuthTokens,
  getAccessToken,
  isAccessTokenValid,
  resolveAuthSession,
} from "~/composables/useAuthTokens"

const isPublicAsset = (path: string) =>
  /\.(?:ico|png|jpe?g|gif|svg|webp|css|js|mjs|woff2?|ttf|txt|map)$/i.test(path) ||
  path.startsWith("/_nuxt/")

export default defineNuxtRouteMiddleware(async (to) => {
  if (isPublicAsset(to.path)) return

  try {
    const authStore = useAuthStore()
    const isLoginPage = to.path === "/login"
    const isHomePage = to.path === "/"
    const accessToken = getAccessToken()

    if (
      !isLoginPage &&
      !isHomePage &&
      authStore.token &&
      authStore.user &&
      isAccessTokenValid(accessToken)
    ) {
      return
    }

    const hasSession = await resolveAuthSession()

    if (!hasSession && !isLoginPage) {
      return navigateTo("/login")
    }

    if (hasSession && (isLoginPage || isHomePage)) {
      return navigateTo("/app")
    }

    const resolvedAccessToken = getAccessToken()

    if (hasSession && resolvedAccessToken && !authStore.token) {
      try {
        const payload = JSON.parse(atob(resolvedAccessToken.split(".")[1]))

        const { $api } = useNuxtApp()
        const res: any = await $api("/api/users/" + payload.sub, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${resolvedAccessToken}`,
          },
        })

        authStore.setAuth({
          token: resolvedAccessToken,
          role: payload.role,
          user: res,
        })
      } catch {
        clearAuthTokens()
        authStore.logout()
        return navigateTo("/login")
      }
    }
  } catch (error) {
    console.error("Auth middleware error:", error)
    return navigateTo("/login")
  }
})
