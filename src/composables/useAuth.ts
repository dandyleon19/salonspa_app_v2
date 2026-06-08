import { useAuthStore } from "~/store/modules/auth";

export const useAuth = () => {
  const config = useRuntimeConfig()

  const login = async (email: string, password: string) => {

    const authStore = useAuthStore()

    const response: any = await $fetch(`${config.public.apiBase}/api/auth/login`, {
      method: 'POST',
      body: {
        email: email,
        password: password,
      }
    })

    const accessToken = useCookie('access_token')
    accessToken.value = response.token

    authStore.setAuth(response)
    await navigateTo('/app')

    return response
  }

  const logout = () => {
    const accessToken = useCookie('access_token')
    accessToken.value = null
    navigateTo('/login')
  }

  return { login, logout }
}