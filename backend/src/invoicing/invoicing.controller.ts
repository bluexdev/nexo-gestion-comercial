import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginationDto } from '../common/pagination.dto';
import { InvoiceInput, InvoicingService } from './invoicing.service';

class InvoiceLineDto {
  @IsString() productId!: string;
  @Type(() => Number) @IsInt() @Min(1) quantity!: number;
  @Type(() => Number) @IsNumber() @Min(0) @IsOptional() unitPrice?: number;
}

class InvoiceDto implements InvoiceInput {
  @IsString() customerId!: string;
  @IsString() @IsOptional() notes?: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  details!: InvoiceLineDto[];
}

class InvoiceQuery extends PaginationDto {
  @IsString() @IsOptional() status?: string;
  @IsString() @IsOptional() customerId?: string;
}

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicingController {
  constructor(private readonly invoices: InvoicingService) {}
  @Get() list(@Query() query: InvoiceQuery) {
    return this.invoices.list(query);
  }
  @Get(':id') findOne(@Param('id') id: string) {
    return this.invoices.findOne(id);
  }
  @Post() create(@Body() dto: InvoiceDto) {
    return this.invoices.create(dto);
  }
  @Patch(':id/cancel') cancel(@Param('id') id: string) {
    return this.invoices.cancel(id);
  }
  @Patch(':id/pay') pay(@Param('id') id: string) {
    return this.invoices.pay(id);
  }
}
