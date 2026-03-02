import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CatalogModule } from '../catalog/catalog.module';
import { ReservationModule } from '../reservation/reservation.module';
import { TicketService } from './application/ticket.service';
import { TicketsController } from './application/tickets.controller';
import { Ticket } from './domain/ticket.entity';
import { TicketRepository } from './infrastructure/ticket.repository';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Ticket]),
    CatalogModule,
    ReservationModule,
  ],
  controllers: [TicketsController],
  providers: [TicketRepository, TicketService],
  exports: [TicketService],
})
export class TicketsModule {}
