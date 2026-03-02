import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../domain/order.entity';
import { OrderReservation } from '../domain/order-reservation.entity';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderReservation)
    private readonly orderReservationRepo: Repository<OrderReservation>,
  ) {}

  async createOrder(
    userId: string,
    reservationIds: string[],
    total: string,
  ): Promise<Order> {
    const order = this.orderRepo.create({
      userId,
      status: 'pending',
      total,
    });
    const saved = await this.orderRepo.save(order);
    await this.orderReservationRepo.save(
      reservationIds.map((reservationId) =>
        this.orderReservationRepo.create({
          orderId: saved.id,
          reservationId,
        }),
      ),
    );
    return saved;
  }

  async getReservationIdsByOrderId(orderId: string): Promise<string[]> {
    const rows = await this.orderReservationRepo.find({
      where: { orderId },
    });
    return rows.map((r) => r.reservationId);
  }
}
