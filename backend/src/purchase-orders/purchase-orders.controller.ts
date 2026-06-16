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
import {
  PurchaseOrderInput,
  PurchaseOrdersService,
} from './purchase-orders.service';

class PurchaseOrderLineDto {
  @IsString() productId!: string;
  @Type(() => Number) @IsInt() @Min(1) quantity!: number;
  @Type(() => Number) @IsNumber() @Min(0) unitPrice!: number;
}

class PurchaseOrderDto implements PurchaseOrderInput {
  @IsString() supplierId!: string;
  @IsString() @IsOptional() notes?: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderLineDto)
  details!: PurchaseOrderLineDto[];
}

class PurchaseOrderQuery extends PaginationDto {
  @IsString() @IsOptional() status?: string;
}

@ApiTags('purchase-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly orders: PurchaseOrdersService) {}
  @Get() list(@Query() query: PurchaseOrderQuery) {
    return this.orders.list(query);
  }
  @Get(':id') findOne(@Param('id') id: string) {
    return this.orders.findOne(id);
  }
  @Post() create(@Body() dto: PurchaseOrderDto) {
    return this.orders.create(dto);
  }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: PurchaseOrderDto) {
    return this.orders.update(id, dto);
  }
  @Patch(':id/cancel') cancel(@Param('id') id: string) {
    return this.orders.cancel(id);
  }
}
