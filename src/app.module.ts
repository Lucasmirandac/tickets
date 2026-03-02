import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatalogModule } from './modules/catalog/catalog.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ReservationModule } from './modules/reservation/reservation.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';

@Module({
  imports: [
    InfrastructureModule,
    ThrottlerModule.forRoot([{ name: 'short', ttl: 60000, limit: 5 }]),
    CatalogModule,
    ReservationModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
