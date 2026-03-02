import { Seat, SeatStatus } from './seat.entity';

/**
 * Port for seat persistence. Used by reservation module to check availability and update with OCC.
 */
export interface ISeatRepository {
  findById(id: string): Promise<Seat | null>;
  findBySessionAndId(sessionId: string, seatId: string): Promise<Seat | null>;
  updateStatusToReserved(seatId: string, currentVersion: number): Promise<boolean>;
  updateStatusToAvailable(seatId: string): Promise<void>;
  updateStatusToSold(seatId: string): Promise<void>;
}
