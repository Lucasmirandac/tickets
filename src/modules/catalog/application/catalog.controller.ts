import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import type { EventResponseDto } from './dto/event-response.dto';
import type { SeatResponseDto } from './dto/seat-response.dto';
import type { SessionResponseDto } from './dto/session-response.dto';

/**
 * Catalog controller. Exposes events, sessions and seats for the frontend.
 */
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('test')
  getTest(): { status: string } {
    return { status: 'ok' };
  }

  @Get('events')
  async findAllEvents(): Promise<EventResponseDto[]> {
    return this.catalogService.findAllEvents();
  }

  @Get('events/slug/:slug')
  async findEventBySlug(@Param('slug') slug: string): Promise<EventResponseDto> {
    return this.catalogService.findEventBySlug(slug);
  }

  @Get('events/id/:id')
  async findEventById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EventResponseDto> {
    return this.catalogService.findEventById(id);
  }

  @Get('events/:eventId/sessions')
  async findSessionsByEventId(
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ): Promise<SessionResponseDto[]> {
    return this.catalogService.findSessionsByEventId(eventId);
  }

  @Get('sessions/:sessionId/seats')
  async findSeatsBySessionId(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<SeatResponseDto[]> {
    return this.catalogService.findSeatsBySessionId(sessionId);
  }

  @Get('sessions/:sessionId')
  async findSessionById(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<SessionResponseDto> {
    return this.catalogService.findSessionById(sessionId);
  }
}
