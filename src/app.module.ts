import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ReservationModule } from './modules/reservation/reservation.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { UsersModule } from './modules/users/users.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    InfrastructureModule,
    ThrottlerModule.forRoot([{ name: 'short', ttl: 60000, limit: 5 }]),
    AuthModule,
    CatalogModule,
    ReservationModule,
    PaymentModule,
    AdminModule,
    UsersModule,
    TicketsModule,
    HealthModule,
  ],
  providers: [],
})
export class AppModule { }
