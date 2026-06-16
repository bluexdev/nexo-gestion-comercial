import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class PaginationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit = 20;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @Transform(({ value }) => (value === 'asc' ? 'asc' : 'desc'))
  @IsString()
  @IsOptional()
  sortOrder: 'asc' | 'desc' = 'desc';

  @Transform(({ value }) =>
    value === undefined ? undefined : value === true || value === 'true',
  )
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export const paginated = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
) => ({
  data,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});
