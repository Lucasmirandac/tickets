import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ReservationModule } from './modules/reservation/reservation.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';

@Module({
  imports: [InfrastructureModule, CatalogModule, ReservationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
