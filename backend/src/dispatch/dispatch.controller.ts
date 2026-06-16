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
import { DispatchStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginationDto } from '../common/pagination.dto';
import { DispatchInput, DispatchService } from './dispatch.service';

class DispatchDto implements DispatchInput {
  @IsString() invoiceId!: string;
  @IsString() @IsOptional() carrier?: string;
  @IsString() @IsOptional() trackingCode?: string;
  @IsString() address!: string;
  @IsString() @IsOptional() notes?: string;
}

class UpdateDispatchDto {
  @IsString() @IsOptional() carrier?: string;
  @IsString() @IsOptional() trackingCode?: string;
  @IsString() @IsOptional() address?: string;
  @IsString() @IsOptional() notes?: string;
  @IsEnum(DispatchStatus) @IsOptional() status?: DispatchStatus;
}

class DispatchQuery extends PaginationDto {
  @IsEnum(DispatchStatus) @IsOptional() status?: DispatchStatus;
}

@ApiTags('dispatches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dispatches')
export class DispatchController {
  constructor(private readonly dispatches: DispatchService) {}
  @Get() list(@Query() query: DispatchQuery) {
    return this.dispatches.list(query);
  }
  @Get(':id') findOne(@Param('id') id: string) {
    return this.dispatches.findOne(id);
  }
  @Post() create(@Body() dto: DispatchDto) {
    return this.dispatches.create(dto);
  }
  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateDispatchDto,
  ) {
    return this.dispatches.update(id, dto);
  }
}
