import type { UserWithoutPassword } from '~/types/user';

export const useAuth = () => {
  const authUser = ref<Maybe<UserWithoutPassword>>(null);

  const signIn = (email: string, password: string) => {
    const foundUser = getUser(email, password);

    if (!foundUser) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid email or password',
      });
    }
  };

  const setUser = (user: Maybe<UserWithoutPassword>) => {
    authUser.value = user;
  };

  const signOut = () => {
    setUser(null);
  };

  return {
    signIn,
    signOut,
  };
};
