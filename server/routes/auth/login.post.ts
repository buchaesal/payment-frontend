// /auth/login (POST)

import { getUserByEmail } from '~/server/models/user';
import { verifyPassword } from '~/server/utils/password';

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email: string; password: string }>(event);
  const { email, password } = body;

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email address and Password are required',
    });
  }
  const userWithPassword = getUserByEmail(email);

  if (!userWithPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Bad Credentials',
    });
  }

  const verified = verifyPassword(password, userWithPassword.password);

  if (!verified) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Bad Credentials',
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _password, ...userWithoutPassword } = userWithPassword;
  setCookie(event, '__user', JSON.stringify(userWithoutPassword));

  return {
    user: userWithoutPassword,
  };
});
