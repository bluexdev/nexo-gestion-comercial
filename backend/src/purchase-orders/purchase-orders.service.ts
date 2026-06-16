import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { POStatus, Prisma } from '@prisma/client';
import { PaginationDto, paginated } from '../common/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';

export type PurchaseOrderInput = {
  supplierId: string;
  notes?: string;
  details: { productId: string; quantity: number; unitPrice: number }[];
};

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationDto & { status?: string }) {
    const direction = query.sortOrder;
    const orderBy: Prisma.PurchaseOrderOrderByWithRelationInput =
      query.sortBy === 'number'
        ? { number: direction }
        : query.sortBy === 'supplier'
          ? { supplier: { name: direction } }
          : query.sortBy === 'status'
            ? { status: direction }
            : { createdAt: direction };
    const statuses = query.status
      ?.split(',')
      .filter((value): value is POStatus =>
        Object.values(POStatus).includes(value as POStatus),
      );
    const where: Prisma.PurchaseOrderWhereInput = {
      status: statuses?.length ? { in: statuses } : undefined,
      OR: query.search
        ? [
            { number: { contains: query.search, mode: 'insensitive' } },
            {
              supplier: {
                name: { contains: query.search, mode: 'insensitive' },
              },
            },
          ]
        : undefined,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.purchaseOrder.findMany({
        where,
        include: { supplier: true, details: { include: { product: true } } },
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return paginated(data, total, query.page, query.limit);
  }

  async findOne(id: string) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        details: { include: { product: true } },
        receipts: { include: { details: true } },
      },
    });
    if (!order) throw new NotFoundException('Orden de compra no encontrada');
    return order;
  }

  create(input: PurchaseOrderInput) {
    return this.prisma.serializable(async (tx) => {
      await this.validateInput(tx, input);
      const sequence = await tx.sequence.upsert({
        where: { key: 'PURCHASE_ORDER' },
        create: { key: 'PURCHASE_ORDER', value: 1 },
        update: { value: { increment: 1 } },
      });
      return tx.purchaseOrder.create({
        data: {
          number: `OC-${String(sequence.value).padStart(4, '0')}`,
          supplierId: input.supplierId,
          notes: input.notes,
          details: {
            create: input.details.map((line) => ({
              productId: line.productId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
            })),
          },
        },
        include: { supplier: true, details: { include: { product: true } } },
      });
    });
  }

  async update(id: string, input: PurchaseOrderInput) {
    return this.prisma.serializable(async (tx) => {
      const current = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { receipts: true },
      });
      if (!current)
        throw new NotFoundException('Orden de compra no encontrada');
      if (current.status !== POStatus.PENDING || current.receipts.length) {
        throw new BadRequestException(
          'Solo se editan órdenes pendientes sin recepciones',
        );
      }
      await this.validateInput(tx, input);
      await tx.purchaseOrderDetail.deleteMany({
        where: { purchaseOrderId: id },
      });
      return tx.purchaseOrder.update({
        where: { id },
        data: {
          supplierId: input.supplierId,
          notes: input.notes,
          details: {
            create: input.details.map((line) => ({
              productId: line.productId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
            })),
          },
        },
        include: { supplier: true, details: { include: { product: true } } },
      });
    });
  }

  async cancel(id: string) {
    const order = await this.findOne(id);
    if (
      order.status === POStatus.RECEIVED ||
      order.status === POStatus.CANCELLED
    ) {
      throw new BadRequestException('La orden no puede cancelarse');
    }
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: POStatus.CANCELLED },
    });
  }

  private async validateInput(
    tx: Prisma.TransactionClient,
    input: PurchaseOrderInput,
  ) {
    if (!input.details.length) {
      throw new BadRequestException('La orden requiere al menos una línea');
    }
    const uniqueIds = new Set(input.details.map((line) => line.productId));
    if (uniqueIds.size !== input.details.length) {
      throw new BadRequestException('No se permiten productos duplicados');
    }
    const supplier = await tx.supplier.findUnique({
      where: { id: input.supplierId },
    });
    if (!supplier?.active)
      throw new BadRequestException('Proveedor no disponible');
    const products = await tx.product.count({
      where: { id: { in: [...uniqueIds] }, active: true },
    });
    if (products !== uniqueIds.size) {
      throw new BadRequestException('Uno o más productos no están disponibles');
    }
  }
}
