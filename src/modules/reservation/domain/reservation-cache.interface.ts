export interface ReservationCachePayload {
  seatId: string;
  userId: string;
  sessionId: string;
  reservationId: string;
}

/**
 * Port for reservation TTL cache in Redis. Set with 10 min TTL, delete on confirm/expire.
 */
export interface IReservationCacheService {
  set(token: string, payload: ReservationCachePayload, ttlSeconds: number): Promise<void>;
  get(token: string): Promise<ReservationCachePayload | null>;
  delete(token: string): Promise<void>;
}
