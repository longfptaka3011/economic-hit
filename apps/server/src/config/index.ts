export const SERVER_CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  NODE_ENV: process.env.NODE_ENV || 'development',
  PING_INTERVAL_MS: 10000,
  PING_TIMEOUT_MS: 5000,
} as const;

