import { useAuthUser } from '#imports';

export const useAuthenticated = () => computed(() => !!useAuthUser().value);
