export interface ReservationRequest {
  eventId: string;
  sessionId: string;
  seatId: string;
  userId: string;
  idempotencyKey?: string;
}

export interface ReservationResult {
  success: boolean;
  reservationId?: string;
  token?: string;
  expiresAt?: Date;
  error?: string;
}
