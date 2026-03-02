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
import { ApiBearerAuth, ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/application/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/application/guards/roles.guard';
import { Roles } from '../../auth/application/decorators/roles.decorator';
import { AuthService } from '../../auth/application/auth.service';
import {
  ADMIN_ROLE_EVENT_MANAGER,
  ADMIN_ROLE_SUPER_ADMIN,
  ADMIN_ROLE_TICKET_VALIDATOR,
} from '../domain/admin-types';
import { AdminCatalogService } from './admin-catalog.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { CreateSeatsDto } from './dto/create-seats.dto';
import { TicketService } from '../../tickets/application/ticket.service';

const ROLES_ALL_ADMINS = [ADMIN_ROLE_SUPER_ADMIN, ADMIN_ROLE_EVENT_MANAGER, ADMIN_ROLE_TICKET_VALIDATOR];
const ROLES_EVENT_MANAGER = [ADMIN_ROLE_SUPER_ADMIN, ADMIN_ROLE_EVENT_MANAGER];
const ROLES_TICKET_VALIDATOR = [ADMIN_ROLE_SUPER_ADMIN, ADMIN_ROLE_TICKET_VALIDATOR];

@ApiTags('admin')
@ApiBearerAuth('jwt')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ROLES_ALL_ADMINS)
export class AdminController {
  constructor(
    private readonly adminCatalogService: AdminCatalogService,
    private readonly authService: AuthService,
    private readonly ticketService: TicketService,
  ) {}

  @Get('events')
  async findAllEvents() {
    return this.adminCatalogService.findAllEvents();
  }

  @Post('events')
  @Roles(...ROLES_EVENT_MANAGER)
  @ApiBody({ type: CreateEventDto })
  async createEvent(@Body() dto: CreateEventDto) {
    return this.adminCatalogService.createEvent(dto);
  }

  @Patch('events/:id')
  @Roles(...ROLES_EVENT_MANAGER)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateEventDto })
  async updateEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.adminCatalogService.updateEvent(id, dto);
  }

  @Post('events/:eventId/sessions')
  @Roles(...ROLES_EVENT_MANAGER)
  @ApiParam({ name: 'eventId', format: 'uuid' })
  @ApiBody({ type: CreateSessionDto })
  async createSession(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: CreateSessionDto,
  ) {
    return this.adminCatalogService.createSession(eventId, dto);
  }

  @Patch('sessions/:id')
  @Roles(...ROLES_EVENT_MANAGER)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateSessionDto })
  async updateSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.adminCatalogService.updateSession(id, dto);
  }

  @Post('sessions/:sessionId/seats')
  @Roles(...ROLES_EVENT_MANAGER)
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  @ApiBody({ type: CreateSeatsDto })
  async createSeats(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: CreateSeatsDto,
  ) {
    return this.adminCatalogService.createSeatsForSession(sessionId, dto);
  }

  @Post('tickets/validate')
  @Roles(...ROLES_TICKET_VALIDATOR)
  @ApiBody({
    schema: { type: 'object', properties: { qrPayload: { type: 'string' } }, required: ['qrPayload'] },
  })
  async validateTicket(@Body() body: { qrPayload: string }) {
    return this.ticketService.validateByQrPayload(body.qrPayload);
  }

  @Post('admins')
  @Roles(ADMIN_ROLE_SUPER_ADMIN)
  @ApiBody({ type: CreateAdminDto })
  async createAdmin(@Body() dto: CreateAdminDto) {
    return this.authService.createAdmin(dto.email, dto.password, dto.adminType);
  }
}
