import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { POStatus } from '@prisma/client';
import { PaginationDto, paginated } from '../common/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';

export type ReceiptInput = {
  purchaseOrderId: string;
  notes?: string;
  details: { purchaseOrderDetailId: string; quantity: number }[];
};

@Injectable()
export class MerchandiseReceiptService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationDto) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.merchandiseReceipt.findMany({
        include: {
          purchaseOrder: { include: { supplier: true } },
          details: { include: { product: true } },
        },
        orderBy: { receivedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.merchandiseReceipt.count(),
    ]);
    return paginated(data, total, query.page, query.limit);
  }

  async findOne(id: string) {
    const receipt = await this.prisma.merchandiseReceipt.findUnique({
      where: { id },
      include: {
        purchaseOrder: { include: { supplier: true } },
        details: { include: { product: true, purchaseOrderDetail: true } },
      },
    });
    if (!receipt) throw new NotFoundException('Recepción no encontrada');
    return receipt;
  }

  create(input: ReceiptInput) {
    return this.prisma.serializable(async (tx) => {
      if (!input.details.length) {
        throw new BadRequestException('Debe ingresar al menos una cantidad');
      }
      const order = await tx.purchaseOrder.findUnique({
        where: { id: input.purchaseOrderId },
        include: { details: true },
      });
      if (
        !order ||
        (order.status !== POStatus.PENDING && order.status !== POStatus.PARTIAL)
      ) {
        throw new BadRequestException('Orden no disponible para recepción');
      }
      const lines = new Map(order.details.map((line) => [line.id, line]));
      const unique = new Set(
        input.details.map((line) => line.purchaseOrderDetailId),
      );
      if (unique.size !== input.details.length) {
        throw new BadRequestException('Líneas de recepción duplicadas');
      }
      for (const inputLine of input.details) {
        const line = lines.get(inputLine.purchaseOrderDetailId);
        if (
          !line ||
          inputLine.quantity <= 0 ||
          inputLine.quantity > line.quantity - line.receivedQty
        ) {
          throw new BadRequestException('Cantidad recibida inválida');
        }
      }
      const receipt = await tx.merchandiseReceipt.create({
        data: {
          purchaseOrderId: order.id,
          notes: input.notes,
          details: {
            create: input.details.map((inputLine) => {
              const line = lines.get(inputLine.purchaseOrderDetailId)!;
              return {
                purchaseOrderDetailId: line.id,
                productId: line.productId,
                quantity: inputLine.quantity,
              };
            }),
          },
        },
      });
      for (const inputLine of input.details) {
        const line = lines.get(inputLine.purchaseOrderDetailId)!;
        await tx.purchaseOrderDetail.update({
          where: { id: line.id },
          data: { receivedQty: { increment: inputLine.quantity } },
        });
        await tx.product.update({
          where: { id: line.productId },
          data: { stock: { increment: inputLine.quantity } },
        });
      }
      const refreshed = await tx.purchaseOrderDetail.findMany({
        where: { purchaseOrderId: order.id },
      });
      const receivedAll = refreshed.every(
        (line) => line.receivedQty === line.quantity,
      );
      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: { status: receivedAll ? POStatus.RECEIVED : POStatus.PARTIAL },
      });
      return tx.merchandiseReceipt.findUnique({
        where: { id: receipt.id },
        include: {
          purchaseOrder: true,
          details: { include: { product: true } },
        },
      });
    });
  }
}
