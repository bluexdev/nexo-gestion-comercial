import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginationDto } from '../common/pagination.dto';
import {
  MerchandiseReceiptService,
  ReceiptInput,
} from './merchandise-receipt.service';

class ReceiptLineDto {
  @IsString() purchaseOrderDetailId!: string;
  @Type(() => Number) @IsInt() @Min(1) quantity!: number;
}

class ReceiptDto implements ReceiptInput {
  @IsString() purchaseOrderId!: string;
  @IsString() @IsOptional() notes?: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiptLineDto)
  details!: ReceiptLineDto[];
}

@ApiTags('merchandise-receipts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('merchandise-receipts')
export class MerchandiseReceiptController {
  constructor(private readonly receipts: MerchandiseReceiptService) {}
  @Get() list(@Query() query: PaginationDto) {
    return this.receipts.list(query);
  }
  @Get(':id') findOne(@Param('id') id: string) {
    return this.receipts.findOne(id);
  }
  @Post() create(@Body() dto: ReceiptDto) {
    return this.receipts.create(dto);
  }
}
