import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  IEventPublisher,
  PaymentConfirmedPayload,
  ReservationExpiredPayload,
  SeatReservedPayload,
} from '../domain/event-publisher.interface';

export const SEAT_RESERVED = 'reservation.seat_reserved';
export const RESERVATION_EXPIRED = 'reservation.reservation_expired';
export const PAYMENT_CONFIRMED = 'reservation.payment_confirmed';

@Injectable()
export class EventPublisherService implements IEventPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  publishSeatReserved(payload: SeatReservedPayload): void {
    this.eventEmitter.emit(SEAT_RESERVED, payload);
  }

  publishReservationExpired(payload: ReservationExpiredPayload): void {
    this.eventEmitter.emit(RESERVATION_EXPIRED, payload);
  }

  publishPaymentConfirmed(payload: PaymentConfirmedPayload): void {
    this.eventEmitter.emit(PAYMENT_CONFIRMED, payload);
  }
}
