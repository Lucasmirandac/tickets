/**
 * Seat summary for catalog (seat map). Exposes status for frontend display.
 */
export interface SeatResponseDto {
  id: string;
  sessionId: string;
  row: string;
  number: string;
  status: 'available' | 'reserved' | 'sold';
}
