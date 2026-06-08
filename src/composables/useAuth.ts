import { useAuthStore } from "~/store/modules/auth";

const getTokenPayload = (token: string) => {
  return JSON.parse(atob(token.split(".")[1]))
}

const resolveAuthUser = async (token: string, responseUser?: any) => {
  if (responseUser?.firstName || responseUser?.fullName || responseUser?.email) {
    return responseUser
  }

  const payload = getTokenPayload(token)
  const { $api } = useNuxtApp()

  return await $api(`/api/users/${payload.sub}`, {
    method: "GET",
  })
}

export const useAuth = () => {
  const config = useRuntimeConfig()

  const login = async (email: string, password: string) => {
    const authStore = useAuthStore()

    const response: any = await $fetch(`${config.public.apiBase}/api/auth/login`, {
      method: 'POST',
      body: {
        email: email.trim(),
        password,
      },
    })

    const accessToken = useCookie('access_token', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    accessToken.value = response.token

    const payload = getTokenPayload(response.token)
    const user = await resolveAuthUser(response.token, response.user)

    authStore.setAuth({
      token: response.token,
      role: response.role ?? payload.role,
      user,
    })

    return {
      ...response,
      user,
    }
  }

  const logout = async () => {
    const authStore = useAuthStore()
    const accessToken = useCookie('access_token')

    accessToken.value = null
    authStore.logout()

    await navigateTo('/login')
  }

  return { login, logout }
}