import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  accessToken: {
    secret:
      process.env.JWT_ACCESS_SECRET ??
      'atlas-development-access-secret',
    expiresIn:
      process.env.JWT_ACCESS_EXPIRES_IN ??
      '15m',
  },

  refreshToken: {
    secret:
      process.env.JWT_REFRESH_SECRET ??
      'atlas-development-refresh-secret',
    expiresIn:
      process.env.JWT_REFRESH_EXPIRES_IN ??
      '7d',
  },
}));