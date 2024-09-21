import { Controller, Get, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ApiTags } from '@nestjs/swagger';
import { isPublic } from 'decorator/auth.decorator';

@ApiTags('payments')
@isPublic()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}
  @isPublic()
  @Get('momo')
  momoPayment() {
    return this.paymentsService.momoPayment();
  }
  @isPublic()
  @Get('momo/success')
  momoPaymentSuccess(@Request() req) {
    console.log(req.body);
    console.log(req.query);
  }

  @Get('momo/fail')
  momoPaymentFail() {
    return this.paymentsService.momoPaymentFail();
  }
}
