import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/application/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/application/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../auth/application/decorators/current-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderService } from './order.service';

@ApiTags('orders')
@ApiBearerAuth('jwt')
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiBody({ type: CreateOrderDto })
  @ApiOkResponse({
    description: 'Order created',
    schema: { type: 'object', properties: { orderId: { type: 'string' }, total: { type: 'string' } } },
  })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateOrderDto,
  ): Promise<{ orderId: string; total: string }> {
    return this.orderService.createOrderFromTokens(
      user.id,
      dto.reservationTokens,
    );
  }
}
