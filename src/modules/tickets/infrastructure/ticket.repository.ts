import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../domain/ticket.entity';

@Injectable()
export class TicketRepository {
  constructor(
    @InjectRepository(Ticket)
    private readonly repo: Repository<Ticket>,
  ) {}

  async save(ticket: Ticket): Promise<Ticket> {
    return this.repo.save(ticket);
  }

  async findById(id: string): Promise<Ticket | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByUserId(userId: string): Promise<Ticket[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByReservationId(reservationId: string): Promise<Ticket | null> {
    return this.repo.findOne({ where: { reservationId } });
  }

  create(data: {
    reservationId: string;
    orderId: string;
    userId: string;
    eventId: string;
    sessionId: string;
    seatId: string;
    qrPayload: string;
  }): Ticket {
    return this.repo.create(data);
  }
}
