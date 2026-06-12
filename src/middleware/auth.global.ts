import { useAuthStore } from "~/store/modules/auth"

const isPublicAsset = (path: string) =>
  /\.(?:ico|png|jpe?g|gif|svg|webp|css|js|mjs|woff2?|ttf|txt|map)$/i.test(path) ||
  path.startsWith("/_nuxt/")

export default defineNuxtRouteMiddleware(async (to) => {
  if (isPublicAsset(to.path)) return

  const accessToken = useCookie('access_token')
  const authStore = useAuthStore()

  if (!accessToken.value && to.path !== '/login') {
    return navigateTo('/login')
  }

  if (accessToken.value && to.path === '/login') {
    return navigateTo('/app')
  }

  if (accessToken.value && !authStore.token) {

    try {

      const payload = JSON.parse(
          atob(accessToken.value.split('.')[1])
      )

      // Fetch user data
      const {$api} = useNuxtApp()
      const res: any = await $api('/api/users/' + payload.sub, {
        method: 'GET',
      })

      console.log("=====> res", res)

      authStore.setAuth({
        token: accessToken.value,
        role: payload.role,
        user: res
      })

    } catch (error) {

      accessToken.value = null
      authStore.logout()

      return navigateTo('/login')
    }
  }
})