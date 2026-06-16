import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { PaginationDto, paginated } from '../common/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';

export type InvoiceInput = {
  customerId: string;
  notes?: string;
  details: { productId: string; quantity: number; unitPrice?: number }[];
};

@Injectable()
export class InvoicingService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationDto & { status?: string; customerId?: string }) {
    const direction = query.sortOrder;
    const orderBy: Prisma.InvoiceOrderByWithRelationInput =
      query.sortBy === 'number'
        ? { number: direction }
        : query.sortBy === 'customer'
          ? { customer: { name: direction } }
          : query.sortBy === 'status'
            ? { status: direction }
            : query.sortBy === 'total'
              ? { total: direction }
              : { issueDate: direction };
    const statuses = query.status
      ?.split(',')
      .filter((value): value is InvoiceStatus =>
        Object.values(InvoiceStatus).includes(value as InvoiceStatus),
      );
    const where: Prisma.InvoiceWhereInput = {
      status: statuses?.length ? { in: statuses } : undefined,
      customerId: query.customerId,
      OR: query.search
        ? [
            { number: { contains: query.search, mode: 'insensitive' } },
            {
              customer: {
                name: { contains: query.search, mode: 'insensitive' },
              },
            },
          ]
        : undefined,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        include: {
          customer: true,
          details: { include: { product: true } },
          dispatch: true,
        },
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return paginated(data, total, query.page, query.limit);
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        details: { include: { product: true } },
        dispatch: true,
      },
    });
    if (!invoice) throw new NotFoundException('Factura no encontrada');
    return invoice;
  }

  create(input: InvoiceInput) {
    return this.prisma.serializable(async (tx) => {
      if (!input.details.length) {
        throw new BadRequestException('La factura requiere al menos una línea');
      }
      const customer = await tx.customer.findUnique({
        where: { id: input.customerId },
      });
      if (!customer?.active)
        throw new BadRequestException('Cliente no disponible');

      const quantities = new Map<string, number>();
      const requestedPrices = new Map<string, number | undefined>();
      for (const line of input.details) {
        quantities.set(
          line.productId,
          (quantities.get(line.productId) ?? 0) + line.quantity,
        );
        requestedPrices.set(line.productId, line.unitPrice);
      }
      const products = await tx.product.findMany({
        where: { id: { in: [...quantities.keys()] }, active: true },
      });
      if (products.length !== quantities.size) {
        throw new BadRequestException(
          'Uno o más productos no están disponibles',
        );
      }

      const detailData = products.map((product) => {
        const quantity = quantities.get(product.id)!;
        if (quantity <= 0 || product.stock < quantity) {
          throw new BadRequestException(
            `Stock insuficiente para ${product.code} - ${product.name}`,
          );
        }
        const unitPrice = new Prisma.Decimal(
          requestedPrices.get(product.id) ?? product.price,
        ).toDecimalPlaces(2);
        return {
          productId: product.id,
          quantity,
          unitPrice,
          subtotal: unitPrice.mul(quantity).toDecimalPlaces(2),
        };
      });
      const subtotal = detailData
        .reduce(
          (total, line) => total.add(line.subtotal),
          new Prisma.Decimal(0),
        )
        .toDecimalPlaces(2);
      const tax = subtotal.mul('0.18').toDecimalPlaces(2);
      const total = subtotal.add(tax).toDecimalPlaces(2);
      const sequence = await tx.sequence.upsert({
        where: { key: 'INVOICE' },
        create: { key: 'INVOICE', value: 1 },
        update: { value: { increment: 1 } },
      });
      for (const line of detailData) {
        await tx.product.update({
          where: { id: line.productId },
          data: { stock: { decrement: line.quantity } },
        });
      }
      return tx.invoice.create({
        data: {
          number: `F-${String(sequence.value).padStart(4, '0')}`,
          customerId: input.customerId,
          notes: input.notes,
          subtotal,
          tax,
          total,
          details: { create: detailData },
        },
        include: { customer: true, details: { include: { product: true } } },
      });
    });
  }

  cancel(id: string) {
    return this.prisma.serializable(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id },
        include: { details: true, dispatch: true },
      });
      if (!invoice) throw new NotFoundException('Factura no encontrada');
      if (
        (invoice.status !== InvoiceStatus.ISSUED &&
          invoice.status !== InvoiceStatus.PAID) ||
        invoice.dispatch
      ) {
        throw new BadRequestException('La factura no puede cancelarse');
      }
      for (const line of invoice.details) {
        await tx.product.update({
          where: { id: line.productId },
          data: { stock: { increment: line.quantity } },
        });
      }
      return tx.invoice.update({
        where: { id },
        data: { status: InvoiceStatus.CANCELLED },
      });
    });
  }

  async pay(id: string) {
    const invoice = await this.findOne(id);
    if (invoice.status !== InvoiceStatus.ISSUED) {
      throw new BadRequestException(
        'Solo una factura emitida puede marcarse pagada',
      );
    }
    return this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.PAID },
    });
  }
}
