import {
  Column,
  Entity,
  PrimaryColumn,
} from 'typeorm';

/**
 * Join table: which reservations belong to which order.
 * Used when confirming payment to mark reservations and seats as sold.
 */
@Entity('order_reservations')
export class OrderReservation {
  @PrimaryColumn({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @PrimaryColumn({ name: 'reservation_id', type: 'uuid' })
  reservationId: string;
}
