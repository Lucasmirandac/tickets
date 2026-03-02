import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReservationService } from '../../reservation/application/reservation.service';
import { EventPublisherService } from '../../reservation/infrastructure/event-publisher.service';
import { Order } from '../domain/order.entity';
import { PaymentRepository } from '../infrastructure/payment.repository';
import { OrderRepository } from '../infrastructure/order.repository';

/**
 * Applies payment approval: updates Payment and Order, confirms reservations and seats.
 */
@Injectable()
export class PaymentConfirmationService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly orderRepository: OrderRepository,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly reservationService: ReservationService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async confirmByGatewayId(gatewayId: string): Promise<boolean> {
    const payment = await this.paymentRepository.findByGatewayId(gatewayId);
    if (!payment || payment.status === 'approved') {
      return false;
    }
    await this.paymentRepository.updateStatus(payment.id, 'approved');
    await this.orderRepo.update({ id: payment.orderId }, { status: 'paid' });
    const reservationIds = await this.orderRepository.getReservationIdsByOrderId(
      payment.orderId,
    );
    for (const reservationId of reservationIds) {
      await this.reservationService.confirmReservation(reservationId);
      this.eventPublisher.publishPaymentConfirmed({
        reservationId,
        orderId: payment.orderId,
      });
    }
    return true;
  }
}
