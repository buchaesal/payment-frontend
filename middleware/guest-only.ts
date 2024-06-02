export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated } = storeToRefs(useAuthStore());

  // debugger;
  if (isAuthenticated.value) {
    if (process.server) return navigateTo('/');
    return abortNavigation();
  }
});
