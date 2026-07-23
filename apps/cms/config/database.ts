import type { Core } from '@strapi/strapi';

const config = ({
  env,
}: Core.Config.Shared.ConfigParams): Core.Config.Database => ({
  connection: {
    client: 'mysql',
    connection: {
      host: env('DATABASE_HOST', '127.0.0.1'),
      port: env.int('DATABASE_PORT', 3306),
      database: env('DATABASE_NAME', 'priscila_skincare'),
      user: env('DATABASE_USERNAME', 'strapi'),
      password: env('DATABASE_PASSWORD', 'strapi'),
      ssl: env.bool('DATABASE_SSL', false)
        ? {
            rejectUnauthorized: env.bool(
              'DATABASE_SSL_REJECT_UNAUTHORIZED',
              true,
            ),
          }
        : false,
    },
    pool: {
      min: env.int('DATABASE_POOL_MIN', 2),
      max: env.int('DATABASE_POOL_MAX', 10),
    },
    acquireConnectionTimeout: env.int(
      'DATABASE_CONNECTION_TIMEOUT',
      60000,
    ),
  },
});

export default config;
