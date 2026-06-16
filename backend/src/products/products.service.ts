import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationDto, paginated } from '../common/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';

export type ProductInput = {
  code: string;
  name: string;
  description?: string;
  unit: string;
  price: number;
  stock?: number;
  active?: boolean;
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationDto) {
    const direction = query.sortOrder;
    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sortBy === 'code'
        ? { code: direction }
        : query.sortBy === 'name'
          ? { name: direction }
          : query.sortBy === 'unit'
            ? { unit: direction }
            : query.sortBy === 'price'
              ? { price: direction }
              : query.sortBy === 'stock'
                ? { stock: direction }
                : query.sortBy === 'active'
                  ? { active: direction }
                  : { createdAt: direction };
    const where: Prisma.ProductWhereInput = {
      active: query.active,
      OR: query.search
        ? [
            { code: { contains: query.search, mode: 'insensitive' } },
            { name: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    return paginated(data, total, query.page, query.limit);
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  create(input: ProductInput) {
    return this.prisma.product.create({
      data: {
        ...input,
        code: input.code.toUpperCase(),
        name: input.name.toUpperCase(),
        unit: input.unit.toUpperCase(),
      },
    });
  }

  async update(id: string, input: Partial<ProductInput>) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: {
        ...input,
        code: input.code?.toUpperCase(),
        name: input.name?.toUpperCase(),
        unit: input.unit?.toUpperCase(),
      },
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { active: false },
    });
  }
}
