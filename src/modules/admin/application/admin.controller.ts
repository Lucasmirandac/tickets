import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/application/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/application/guards/roles.guard';
import { Roles } from '../../auth/application/decorators/roles.decorator';
import { AdminCatalogService } from './admin-catalog.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { CreateSeatsDto } from './dto/create-seats.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminCatalogService: AdminCatalogService) {}

  @Post('events')
  async createEvent(@Body() dto: CreateEventDto) {
    return this.adminCatalogService.createEvent(dto);
  }

  @Patch('events/:id')
  async updateEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.adminCatalogService.updateEvent(id, dto);
  }

  @Get('events')
  async findAllEvents() {
    return this.adminCatalogService.findAllEvents();
  }

  @Post('events/:eventId/sessions')
  async createSession(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: CreateSessionDto,
  ) {
    return this.adminCatalogService.createSession(eventId, dto);
  }

  @Patch('sessions/:id')
  async updateSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.adminCatalogService.updateSession(id, dto);
  }

  @Post('sessions/:sessionId/seats')
  async createSeats(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: CreateSeatsDto,
  ) {
    return this.adminCatalogService.createSeatsForSession(sessionId, dto);
  }
}
