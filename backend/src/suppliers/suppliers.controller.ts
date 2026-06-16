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
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginationDto } from '../common/pagination.dto';
import { SupplierInput, SuppliersService } from './suppliers.service';

class SupplierDto implements SupplierInput {
  @IsString() ruc!: string;
  @IsString() name!: string;
  @IsString() @IsOptional() contact?: string;
  @IsString() @IsOptional() phone?: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsOptional() address?: string;
  @IsBoolean() @IsOptional() active?: boolean;
}

class UpdateSupplierDto {
  @IsString() @IsOptional() ruc?: string;
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() contact?: string;
  @IsString() @IsOptional() phone?: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsOptional() address?: string;
  @IsBoolean() @IsOptional() active?: boolean;
}

@ApiTags('suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}
  @Get() list(@Query() query: PaginationDto) {
    return this.suppliers.list(query);
  }
  @Get(':id') findOne(@Param('id') id: string) {
    return this.suppliers.findOne(id);
  }
  @Post() create(@Body() dto: SupplierDto) {
    return this.suppliers.create(dto);
  }
  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliers.update(id, dto);
  }
  @Delete(':id') deactivate(@Param('id') id: string) {
    return this.suppliers.deactivate(id);
  }
}
