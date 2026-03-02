import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from '../config';
import { DatabaseModule } from './database/database.module';
import { QueueModule } from './queue/queue.module';
import { RedisModule } from './redis/redis.module';

/**
 * Aggregates all infrastructure modules: config, database, Redis, queues.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    RedisModule,
    QueueModule,
  ],
  exports: [DatabaseModule, RedisModule, QueueModule],
})
export class InfrastructureModule {}
