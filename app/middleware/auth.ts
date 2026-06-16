export default defineNuxtRouteMiddleware((to) => {
  const { status } = useAuth();

  if (status.value === "unauthenticated") {
    return navigateTo(`/auth/login?redirect=${to.fullPath}`);
  }
});
