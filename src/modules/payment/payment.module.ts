import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PAYMENT_WEBHOOK_QUEUE } from '../../infrastructure/queue/queue.module';
import { AuthModule } from '../auth/auth.module';
import { ReservationModule } from '../reservation/reservation.module';
import { TicketsModule } from '../tickets/tickets.module';
import { PaymentWebhookService } from './application/payment-webhook.service';
import { PaymentConfirmationService } from './application/payment-confirmation.service';
import { OrderService } from './application/order.service';
import { OrdersController } from './application/orders.controller';
import { Order } from './domain/order.entity';
import { OrderReservation } from './domain/order-reservation.entity';
import { Payment } from './domain/payment.entity';
import { OrderRepository } from './infrastructure/order.repository';
import { PaymentRepository } from './infrastructure/payment.repository';
import { PaymentWebhookProcessor } from './infrastructure/payment-webhook.processor';
import { PaymentWebhookController } from './webhooks/payment-webhook.controller';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Order, Payment, OrderReservation]),
    BullModule.registerQueue({ name: PAYMENT_WEBHOOK_QUEUE }),
    ReservationModule,
    TicketsModule,
  ],
  controllers: [PaymentWebhookController, OrdersController],
  providers: [
    PaymentRepository,
    OrderRepository,
    OrderService,
    PaymentConfirmationService,
    PaymentWebhookService,
    PaymentWebhookProcessor,
  ],
  exports: [PaymentRepository, OrderRepository],
})
export class PaymentModule {}
