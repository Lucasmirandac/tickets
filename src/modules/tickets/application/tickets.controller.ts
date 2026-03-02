import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/application/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/application/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../auth/application/decorators/current-user.decorator';
import { TicketService } from './ticket.service';
import { Ticket } from '../domain/ticket.entity';

@ApiTags('tickets')
@ApiBearerAuth('jwt')
@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketService: TicketService) {}

  @Get()
  @ApiOkResponse({ description: 'List of tickets for the current user' })
  async list(@CurrentUser() user: CurrentUserPayload): Promise<Ticket[]> {
    return this.ticketService.listByUserId(user.id);
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Ticket details (owner only)' })
  async getById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<Ticket> {
    return this.ticketService.getById(id, user.id);
  }

  @Get(':id/qr')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'PNG image of ticket QR code (owner only)', content: { 'image/png': {} } })
  async getQr(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    const buffer = await this.ticketService.getQrPngBuffer(id, user.id);
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': 'inline; filename="ticket-qr.png"',
    });
    res.send(buffer);
  }
}
