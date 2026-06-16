import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DispatchStatus, InvoiceStatus, Prisma } from '@prisma/client';
import { PaginationDto, paginated } from '../common/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';

export type DispatchInput = {
  invoiceId: string;
  carrier?: string;
  trackingCode?: string;
  address: string;
  notes?: string;
};

const transitions: Record<DispatchStatus, DispatchStatus[]> = {
  PENDING: [DispatchStatus.IN_TRANSIT],
  IN_TRANSIT: [DispatchStatus.DELIVERED, DispatchStatus.RETURNED],
  DELIVERED: [],
  RETURNED: [],
};

@Injectable()
export class DispatchService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationDto & { status?: DispatchStatus }) {
    const direction = query.sortOrder;
    const orderBy: Prisma.DispatchOrderByWithRelationInput =
      query.sortBy === 'invoice'
        ? { invoice: { number: direction } }
        : query.sortBy === 'carrier'
          ? { carrier: direction }
          : query.sortBy === 'trackingCode'
            ? { trackingCode: direction }
            : query.sortBy === 'status'
              ? { status: direction }
              : { dispatchedAt: direction };
    const where: Prisma.DispatchWhereInput = {
      status: query.status,
      OR: query.search
        ? [
            {
              trackingCode: {
                contains: query.search,
                mode: 'insensitive',
              },
            },
            {
              carrier: { contains: query.search, mode: 'insensitive' },
            },
            {
              invoice: {
                number: { contains: query.search, mode: 'insensitive' },
              },
            },
            {
              invoice: {
                customer: {
                  name: { contains: query.search, mode: 'insensitive' },
                },
              },
            },
          ]
        : undefined,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.dispatch.findMany({
        where,
        include: { invoice: { include: { customer: true } } },
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.dispatch.count({ where }),
    ]);
    return paginated(data, total, query.page, query.limit);
  }

  async findOne(id: string) {
    const dispatch = await this.prisma.dispatch.findUnique({
      where: { id },
      include: { invoice: { include: { customer: true, details: true } } },
    });
    if (!dispatch) throw new NotFoundException('Despacho no encontrado');
    return dispatch;
  }

  create(input: DispatchInput) {
    return this.prisma.serializable(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: input.invoiceId },
        include: { dispatch: true },
      });
      if (
        !invoice ||
        invoice.dispatch ||
        (invoice.status !== InvoiceStatus.ISSUED &&
          invoice.status !== InvoiceStatus.PAID)
      ) {
        throw new BadRequestException('Factura no disponible para despacho');
      }
      const dispatch = await tx.dispatch.create({ data: input });
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: InvoiceStatus.DISPATCHED },
      });
      return dispatch;
    });
  }

  async update(
    id: string,
    input: Partial<Omit<DispatchInput, 'invoiceId'>> & {
      status?: DispatchStatus;
    },
  ) {
    const dispatch = await this.findOne(id);
    if (
      input.status &&
      input.status !== dispatch.status &&
      !transitions[dispatch.status].includes(input.status)
    ) {
      throw new BadRequestException('Transición de despacho inválida');
    }
    return this.prisma.dispatch.update({ where: { id }, data: input });
  }
}
