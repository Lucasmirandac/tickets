import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

const RESERVATION_QUEUE = 'reservation';
const PAYMENT_WEBHOOK_QUEUE = 'payment-webhook';
const RESERVATION_EXPIRATION_QUEUE = 'reservation-expiration';

/**
 * Queue module. Registers BullMQ with Redis connection.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: configService.get<string>('redis.password') || undefined,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: RESERVATION_QUEUE },
      { name: PAYMENT_WEBHOOK_QUEUE },
      { name: RESERVATION_EXPIRATION_QUEUE },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}

export { RESERVATION_QUEUE, PAYMENT_WEBHOOK_QUEUE, RESERVATION_EXPIRATION_QUEUE };
