import { BadRequestException, Injectable } from '@nestjs/common';
import { ReservationService } from '../../reservation/application/reservation.service';
import { OrderRepository } from '../infrastructure/order.repository';

@Injectable()
export class OrderService {
  constructor(
    private readonly reservationService: ReservationService,
    private readonly orderRepository: OrderRepository,
  ) {}

  /**
   * Validates reservation tokens belong to the user and are active, then creates an order.
   */
  async createOrderFromTokens(
    userId: string,
    reservationTokens: string[],
  ): Promise<{ orderId: string; total: string }> {
    const reservations: { id: string }[] = [];
    for (const token of reservationTokens) {
      const reservation =
        await this.reservationService.getActiveReservationByToken(token, userId);
      if (!reservation) {
        throw new BadRequestException(
          `Invalid or expired reservation token: ${token}`,
        );
      }
      reservations.push({ id: reservation.id });
    }
    const uniqueIds = [...new Set(reservations.map((r) => r.id))];
    if (uniqueIds.length !== reservationTokens.length) {
      throw new BadRequestException('Duplicate reservation tokens are not allowed');
    }
    const total = '0.00';
    const order = await this.orderRepository.createOrder(userId, uniqueIds, total);
    return { orderId: order.id, total: order.total };
  }
}
