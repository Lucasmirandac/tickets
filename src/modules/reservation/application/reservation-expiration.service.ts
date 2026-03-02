import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ReservationRepository } from '../infrastructure/reservation.repository';
import { ReservationService } from './reservation.service';

/**
 * Cron job that releases expired reservations every minute.
 */
@Injectable()
export class ReservationExpirationService {
  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly reservationService: ReservationService,
  ) {}

  @Cron('* * * * *')
  async handleExpiredReservations(): Promise<void> {
    const now = new Date();
    const expired = await this.reservationRepository.findActiveByExpiresAtBefore(now);
    for (const reservation of expired) {
      await this.reservationService.releaseReservation(reservation.id);
    }
  }
}
