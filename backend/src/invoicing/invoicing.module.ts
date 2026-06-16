import { Module } from '@nestjs/common';
import { InvoicingController } from './invoicing.controller';
import { InvoicingService } from './invoicing.service';

@Module({
  controllers: [InvoicingController],
  providers: [InvoicingService],
})
export class InvoicingModule {}
