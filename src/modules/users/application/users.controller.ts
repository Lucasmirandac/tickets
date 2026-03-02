import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/application/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/application/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../auth/application/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth('jwt')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get('me')
  @ApiOkResponse({
    description: 'Current authenticated user',
    schema: { type: 'object', properties: { id: { type: 'string' }, email: { type: 'string' }, role: { type: 'string' } } },
  })
  getMe(@CurrentUser() user: CurrentUserPayload): { id: string; email: string; role: string } {
    return { id: user.id, email: user.email, role: user.role };
  }
}
