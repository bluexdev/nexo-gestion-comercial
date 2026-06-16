import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationDto, paginated } from '../common/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';

export type SupplierInput = {
  ruc: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  active?: boolean;
};

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationDto) {
    const where: Prisma.SupplierWhereInput = {
      active: query.active,
      OR: query.search
        ? [
            { ruc: { contains: query.search } },
            { name: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.supplier.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.supplier.count({ where }),
    ]);
    return paginated(data, total, query.page, query.limit);
  }

  async findOne(id: string) {
    const item = await this.prisma.supplier.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Proveedor no encontrado');
    return item;
  }

  create(input: SupplierInput) {
    return this.prisma.supplier.create({
      data: { ...input, name: input.name.toUpperCase() },
    });
  }

  async update(id: string, input: Partial<SupplierInput>) {
    await this.findOne(id);
    return this.prisma.supplier.update({
      where: { id },
      data: { ...input, name: input.name?.toUpperCase() },
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.supplier.update({
      where: { id },
      data: { active: false },
    });
  }
}
