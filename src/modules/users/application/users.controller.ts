import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/application/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/application/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../auth/application/decorators/current-user.decorator';
import type { UserMeResponse } from './users.service';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('jwt')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOkResponse({
    description: 'Current authenticated user with address (for billing)',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string' },
        address: {
          type: 'object',
          nullable: true,
          properties: {
            street: { type: 'string' },
            number: { type: 'string' },
            complement: { type: 'string' },
            neighborhood: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            postalCode: { type: 'string' },
            country: { type: 'string' },
          },
        },
      },
    },
  })
  getMe(@CurrentUser() user: CurrentUserPayload): Promise<UserMeResponse> {
    return this.usersService.findMe(user.id, user.role);
  }
}
