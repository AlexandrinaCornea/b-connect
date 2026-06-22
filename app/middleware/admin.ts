export default defineNuxtRouteMiddleware(() => {
  const { data } = useAuth()
  if (!data.value) return navigateTo('/auth/login')
  if ((data.value.user as any)?.role !== 'admin') return navigateTo('/')
})
