/**
 * Event summary for list and detail responses.
 */
export interface EventResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
