export interface SeatReservedPayload {
  reservationId: string;
  seatId: string;
  sessionId: string;
  userId: string;
  expiresAt: Date;
}

export interface ReservationExpiredPayload {
  reservationId: string;
  seatId: string;
  sessionId: string;
}

export interface PaymentConfirmedPayload {
  reservationId: string;
  orderId: string;
}

/**
 * Port for publishing domain events.
 */
export interface IEventPublisher {
  publishSeatReserved(payload: SeatReservedPayload): void;
  publishReservationExpired(payload: ReservationExpiredPayload): void;
  publishPaymentConfirmed(payload: PaymentConfirmedPayload): void;
}
