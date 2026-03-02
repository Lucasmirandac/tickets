import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OrderReservation } from '../domain/order-reservation.entity';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(OrderReservation)
    private readonly orderReservationRepo: Repository<OrderReservation>,
  ) {}

  async getReservationIdsByOrderId(orderId: string): Promise<string[]> {
    const rows = await this.orderReservationRepo.find({
      where: { orderId },
    });
    return rows.map((r) => r.reservationId);
  }
}
