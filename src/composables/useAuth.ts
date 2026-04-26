export const useAuth = () => {
  const config = useRuntimeConfig()

  const login = async (email: string, password: string) => {
    const response = await $fetch(`${config.public.apiBase}/api/auth/login`, {
      method: 'POST',
      body: {
        email: email,
        password: password,
      }
    })

    // Guarda el access_token en cookies
    const accessToken = useCookie('access_token')
    accessToken.value = response.token
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