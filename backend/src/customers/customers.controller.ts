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
import { DocType } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginationDto } from '../common/pagination.dto';
import { CustomerInput, CustomersService } from './customers.service';

class CustomerDto implements CustomerInput {
  @IsEnum(DocType) @IsOptional() docType?: DocType;
  @IsString() docNumber!: string;
  @IsString() name!: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() address?: string;
  @IsBoolean() @IsOptional() active?: boolean;
}

class UpdateCustomerDto {
  @IsEnum(DocType) @IsOptional() docType?: DocType;
  @IsString() @IsOptional() docNumber?: string;
  @IsString() @IsOptional() name?: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() address?: string;
  @IsBoolean() @IsOptional() active?: boolean;
}

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}
  @Get() list(@Query() query: PaginationDto) {
    return this.customers.list(query);
  }
  @Get(':id') findOne(@Param('id') id: string) {
    return this.customers.findOne(id);
  }
  @Post() create(@Body() dto: CustomerDto) {
    return this.customers.create(dto);
  }
  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customers.update(id, dto);
  }
  @Delete(':id') deactivate(@Param('id') id: string) {
    return this.customers.deactivate(id);
  }
}
