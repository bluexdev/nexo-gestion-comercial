import { Module } from '@nestjs/common';
import { MerchandiseReceiptController } from './merchandise-receipt.controller';
import { MerchandiseReceiptService } from './merchandise-receipt.service';

@Module({
  controllers: [MerchandiseReceiptController],
  providers: [MerchandiseReceiptService],
})
export class MerchandiseReceiptModule {}
