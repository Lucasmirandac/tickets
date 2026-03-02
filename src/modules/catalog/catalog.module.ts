import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogController } from './application/catalog.controller';
import { CatalogService } from './application/catalog.service';
import { Event } from './domain/event.entity';
import { Seat } from './domain/seat.entity';
import { Session } from './domain/session.entity';
import { SeatRepository } from './infrastructure/seat.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, Session, Seat]),
  ],
  controllers: [CatalogController],
  providers: [CatalogService, SeatRepository],
  exports: [TypeOrmModule, CatalogService, SeatRepository],
})
export class CatalogModule {}
