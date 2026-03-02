import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'JWT access token',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        expires_in: { type: 'string', example: '1d' },
      },
    },
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.loginWithCredentials(dto.email, dto.password);
  }
}
