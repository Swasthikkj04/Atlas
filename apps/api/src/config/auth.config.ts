import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    accessToken: {
      secret:
        process.env.JWT_ACCESS_SECRET ||
        (isProduction ? undefined : 'atlas-development-access-secret'),
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    },

    refreshToken: {
      secret:
        process.env.JWT_REFRESH_SECRET ||
        (isProduction ? undefined : 'atlas-development-refresh-secret'),
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    frontendUrl:
      process.env.FRONTEND_URL ||
      (isProduction ? 'https://nebula.argonion.com' : 'http://localhost:5173'),

    appUrl:
      process.env.APP_URL ||
      process.env.FRONTEND_URL ||
      (isProduction ? 'https://nebula.argonion.com' : 'http://localhost:5173'),
  };
});
