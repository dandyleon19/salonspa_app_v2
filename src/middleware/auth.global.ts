export default defineNuxtRouteMiddleware((to) => {
  const accessToken = useCookie('access_token')

  if (!accessToken.value && to.path !== '/login') {
    return navigateTo('/login')
  }

  if (accessToken.value && to.path === '/login') {
    return navigateTo('/app')
  }

  /*if (accessToken.value && to.path !== '/login') {
    return navigateTo('/app')
  }*/
})