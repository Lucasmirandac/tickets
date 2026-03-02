import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../domain/payment.entity';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly repo: Repository<Payment>,
  ) {}

  async findByGatewayId(gatewayId: string): Promise<Payment | null> {
    return this.repo.findOne({
      where: { gatewayId },
      relations: ['order'],
    });
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<void> {
    await this.repo.update({ id }, { status });
  }
}
