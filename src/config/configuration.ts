/**
 * Application configuration factory.
 * Reads from environment variables with defaults for local development.
 */
export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    username: process.env.DATABASE_USERNAME ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'postgres',
    database: process.env.DATABASE_NAME ?? 'tickets',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? undefined,
  },
  reservation: {
    ttlSeconds: parseInt(process.env.RESERVATION_TTL_SECONDS ?? '600', 10),
    lockTtlMs: parseInt(process.env.RESERVATION_LOCK_TTL_MS ?? '5000', 10),
  },
  queues: {
    reservation: process.env.QUEUE_RESERVATION ?? 'reservation',
    paymentWebhook: process.env.QUEUE_PAYMENT_WEBHOOK ?? 'payment-webhook',
    reservationExpiration: process.env.QUEUE_RESERVATION_EXPIRATION ?? 'reservation-expiration',
  },
  webhook: {
    paymentSecret: process.env.WEBHOOK_PAYMENT_SECRET ?? '',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  },
  admin: {
    seedEmail: process.env.ADMIN_EMAIL ?? '',
    seedPassword: process.env.ADMIN_PASSWORD ?? '',
  },
});
