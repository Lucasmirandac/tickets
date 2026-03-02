import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RESERVATION_QUEUE } from '../../infrastructure/queue/queue.module';
import { AuthModule } from '../auth/auth.module';
import { CatalogModule } from '../catalog/catalog.module';
import { ReservationController } from './application/reservation.controller';
import { ReservationExpirationService } from './application/reservation-expiration.service';
import { ReservationService } from './application/reservation.service';
import { Reservation } from './domain/reservation.entity';
import { DistributedLockService } from './infrastructure/distributed-lock.service';
import { EventPublisherService } from './infrastructure/event-publisher.service';
import { ReservationCacheService } from './infrastructure/reservation-cache.service';
import { ReservationQueueProcessor } from './infrastructure/reservation-queue.processor';
import { ReservationRepository } from './infrastructure/reservation.repository';

@Module({
  imports: [
    AuthModule,
    CatalogModule,
    TypeOrmModule.forFeature([Reservation]),
    BullModule.registerQueue({ name: RESERVATION_QUEUE }),
  ],
  controllers: [ReservationController],
  providers: [
    DistributedLockService,
    ReservationCacheService,
    EventPublisherService,
    ReservationRepository,
    ReservationService,
    ReservationExpirationService,
    ReservationQueueProcessor,
  ],
  exports: [ReservationService, EventPublisherService],
})
export class ReservationModule {}
