import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as QRCode from 'qrcode';
import { v4 as uuid } from 'uuid';
import { CatalogService } from '../../catalog/application/catalog.service';
import { ReservationService } from '../../reservation/application/reservation.service';
import { Ticket } from '../domain/ticket.entity';
import { TicketRepository } from '../infrastructure/ticket.repository';

@Injectable()
export class TicketService {
  constructor(
    private readonly ticketRepository: TicketRepository,
    private readonly reservationService: ReservationService,
    private readonly catalogService: CatalogService,
  ) {}

  /**
   * Creates a ticket for a confirmed reservation. Call after payment confirmation.
   */
  async createForReservation(
    reservationId: string,
    orderId: string,
  ): Promise<Ticket> {
    const existing = await this.ticketRepository.findByReservationId(reservationId);
    if (existing) {
      return existing;
    }
    const reservation = await this.reservationService.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException(`Reservation ${reservationId} not found`);
    }
    const session = await this.catalogService.findSessionById(reservation.sessionId);
    const qrPayload = uuid();
    const ticket = this.ticketRepository.create({
      reservationId,
      orderId,
      userId: reservation.userId,
      eventId: session.eventId,
      sessionId: reservation.sessionId,
      seatId: reservation.seatId,
      qrPayload,
    });
    return this.ticketRepository.save(ticket);
  }

  async listByUserId(userId: string): Promise<Ticket[]> {
    return this.ticketRepository.findByUserId(userId);
  }

  async getById(id: string, userId: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findById(id);
    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }
    if (ticket.userId !== userId) {
      throw new ForbiddenException('You do not own this ticket');
    }
    return ticket;
  }

  async getQrPngBuffer(ticketId: string, userId: string): Promise<Buffer> {
    const ticket = await this.getById(ticketId, userId);
    return QRCode.toBuffer(ticket.qrPayload, { type: 'png', margin: 2 });
  }

  /**
   * Validates a ticket by QR payload (e.g. at entrance). Marks ticket as validated.
   * Only for admin roles with ticket_validator or super_admin.
   */
  async validateByQrPayload(qrPayload: string): Promise<{
    valid: boolean;
    ticketId: string;
    eventId: string;
    sessionId: string;
    seatId: string;
    validatedAt: Date;
  }> {
    const ticket = await this.ticketRepository.findByQrPayload(qrPayload);
    if (!ticket) {
      throw new NotFoundException('Ticket not found for this QR code');
    }
    if (ticket.validatedAt) {
      throw new BadRequestException('Ticket has already been used');
    }
    const now = new Date();
    ticket.validatedAt = now;
    await this.ticketRepository.save(ticket);
    return {
      valid: true,
      ticketId: ticket.id,
      eventId: ticket.eventId,
      sessionId: ticket.sessionId,
      seatId: ticket.seatId,
      validatedAt: now,
    };
  }
}
