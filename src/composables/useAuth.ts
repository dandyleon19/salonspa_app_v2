import { useAuthStore } from "~/store/modules/auth";
import {
  clearAuthTokens,
  getRefreshToken,
  setAuthTokens,
} from "~/composables/useAuthTokens";

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
    headers: {
      Authorization: `Bearer ${token}`,
    },
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

    const payload = getTokenPayload(response.token)
    const user = await resolveAuthUser(response.token, response.user)

    setAuthTokens(response.token, response.refreshToken)

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
    const refreshToken = getRefreshToken()

    try {
      if (refreshToken) {
        await $fetch(`${config.public.apiBase}/api/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: { refreshToken },
        })
      }
    } catch {
      // Local logout even if the API call fails.
    }

    clearAuthTokens()
    authStore.logout()

    await navigateTo("/login")
  }

  return { login, logout }
}