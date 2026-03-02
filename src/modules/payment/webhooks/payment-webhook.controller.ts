import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiParam, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { PaymentWebhookService } from '../application/payment-webhook.service';
import { WebhookSignatureGuard } from '../application/webhook-signature.guard';

/** Webhook body: eventType and gatewayId from payment provider. Requires X-Webhook-Signature header. */
class WebhookPayloadDto {
  @ApiPropertyOptional({ example: 'payment.approved' })
  eventType?: string;

  @ApiPropertyOptional({ example: 'pay_xxx' })
  gatewayId?: string;
}

/**
 * Webhook endpoint for payment gateway. No JWT; validation is by signature only.
 * Expects X-Webhook-Signature: sha256=<hmac_hex(body)> and raw JSON body.
 */
@ApiTags('webhooks')
@Controller('webhooks/payments')
export class PaymentWebhookController {
  constructor(private readonly webhookService: PaymentWebhookService) {}

  @Get('test')
  getTest(): { status: string } {
    return { status: 'ok' };
  }

  @Post(':provider')
  @UseGuards(WebhookSignatureGuard)
  @ApiParam({ name: 'provider', description: 'Payment provider (e.g. stripe)' })
  @ApiBody({ type: WebhookPayloadDto })
  @ApiOkResponse({ description: 'Event received', schema: { type: 'object', properties: { received: { type: 'boolean' } } } })
  async handle(
    @Param('provider') provider: string,
    @Body() body: { eventType?: string; gatewayId?: string },
  ): Promise<{ received: boolean }> {
    await this.webhookService.enqueue(provider, {
      eventType: body.eventType ?? '',
      gatewayId: body.gatewayId ?? '',
    });
    return { received: true };
  }
}
