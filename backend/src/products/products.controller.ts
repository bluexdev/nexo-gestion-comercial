import {
  Body,
  Controller,
  Delete,
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
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginationDto } from '../common/pagination.dto';
import { ProductInput, ProductsService } from './products.service';

class ProductDto implements ProductInput {
  @IsString() code!: string;
  @IsString() name!: string;
  @IsString() @IsOptional() description?: string;
  @IsString() unit!: string;
  @Type(() => Number) @IsNumber() @Min(0) price!: number;
  @Type(() => Number) @IsInt() @Min(0) @IsOptional() stock?: number;
  @IsBoolean() @IsOptional() active?: boolean;
}

class UpdateProductDto {
  @IsString() @IsOptional() code?: string;
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() unit?: string;
  @Type(() => Number) @IsNumber() @Min(0) @IsOptional() price?: number;
  @Type(() => Number) @IsInt() @Min(0) @IsOptional() stock?: number;
  @IsBoolean() @IsOptional() active?: boolean;
}

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query() query: PaginationDto) {
    return this.products.list(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.products.findOne(id);
  }

  @Post()
  create(@Body() dto: ProductDto) {
    return this.products.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.products.deactivate(id);
  }
}
