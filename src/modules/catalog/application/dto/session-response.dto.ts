/**
 * Session summary for list and detail responses.
 */
export interface SessionResponseDto {
  id: string;
  eventId: string;
  startsAt: string;
  venue: string;
  description: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}
