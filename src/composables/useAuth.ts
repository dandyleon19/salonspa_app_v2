export const useAuth = () => {
  const config = useRuntimeConfig()

  const login = async (email: string, password: string) => {
    const response = await $fetch(`${config.public.apiBase}/oauth/token`, {
      method: 'POST',
      body: {
        grant_type: 'password',
        client_id: config.public.passportClientId,
        client_secret: config.public.passportClientSecret,
        username: email,
        password: password,
        scope: '*'
      }
    })

    // Guarda el access_token en cookies
    const accessToken = useCookie('access_token')
    accessToken.value = response.access_token
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