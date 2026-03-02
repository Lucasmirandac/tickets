import { Reservation, ReservationStatus } from './reservation.entity';

export interface CreateReservationData {
  seatId: string;
  sessionId: string;
  userId: string;
  token: string;
  expiresAt: Date;
}

/**
 * Port for reservation persistence.
 */
export interface IReservationRepository {
  create(data: CreateReservationData): Promise<Reservation>;
  findById(id: string): Promise<Reservation | null>;
  findByToken(token: string): Promise<Reservation | null>;
  updateStatus(id: string, status: ReservationStatus): Promise<void>;
  findActiveByExpiresAtBefore(before: Date): Promise<Reservation[]>;
}
