import { Injectable, NotFoundException } from '@nestjs/common';
import { DocType, Prisma } from '@prisma/client';
import { PaginationDto, paginated } from '../common/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';

export type CustomerInput = {
  docType?: DocType;
  docNumber: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  active?: boolean;
};

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationDto) {
    const where: Prisma.CustomerWhereInput = {
      active: query.active,
      OR: query.search
        ? [
            { docNumber: { contains: query.search } },
            { name: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.customer.count({ where }),
    ]);
    return paginated(data, total, query.page, query.limit);
  }

  async findOne(id: string) {
    const item = await this.prisma.customer.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Cliente no encontrado');
    return item;
  }

  create(input: CustomerInput) {
    return this.prisma.customer.create({
      data: { ...input, name: input.name.toUpperCase() },
    });
  }

  async update(id: string, input: Partial<CustomerInput>) {
    await this.findOne(id);
    return this.prisma.customer.update({
      where: { id },
      data: { ...input, name: input.name?.toUpperCase() },
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.customer.update({
      where: { id },
      data: { active: false },
    });
  }
}
