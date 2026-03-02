import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiConflictResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

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

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: RegisterDto })
  @ApiOkResponse({
    description: 'User created and JWT access token',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        expires_in: { type: 'string', example: '1d' },
      },
    },
  })
  @ApiConflictResponse({ description: 'Email already registered' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.address);
  }
}
