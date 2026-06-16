import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DispatchStatus, InvoiceStatus, POStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('metrics')
  async metrics() {
    const now = new Date();
    const limaDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
    const start = new Date(`${limaDate}T00:00:00-05:00`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const [
      totalProducts,
      lowStockProducts,
      stockoutProducts,
      inventoryProducts,
      pendingOrders,
      openOrderDetails,
      invoicesToday,
      salesToday,
      readyToDispatchInvoices,
      pendingDispatches,
      dispatchesInTransit,
      receiptsToday,
      receiptDetailsToday,
    ] = await this.prisma.$transaction([
        this.prisma.product.count({ where: { active: true } }),
        this.prisma.product.count({ where: { active: true, stock: { gt: 0, lte: 5 } } }),
        this.prisma.product.count({ where: { active: true, stock: 0 } }),
        this.prisma.product.findMany({
          where: { active: true },
          select: { stock: true, price: true },
        }),
        this.prisma.purchaseOrder.count({
          where: { status: { in: [POStatus.PENDING, POStatus.PARTIAL] } },
        }),
        this.prisma.purchaseOrderDetail.findMany({
          where: {
            purchaseOrder: {
              status: { in: [POStatus.PENDING, POStatus.PARTIAL] },
            },
          },
          select: { quantity: true, receivedQty: true, unitPrice: true },
        }),
        this.prisma.invoice.count({
          where: {
            issueDate: { gte: start, lt: end },
            status: { not: InvoiceStatus.CANCELLED },
          },
        }),
        this.prisma.invoice.aggregate({
          where: {
            issueDate: { gte: start, lt: end },
            status: { not: InvoiceStatus.CANCELLED },
          },
          _sum: { total: true, tax: true },
        }),
        this.prisma.invoice.count({
          where: { status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PAID] } },
        }),
        this.prisma.dispatch.count({
          where: { status: DispatchStatus.PENDING },
        }),
        this.prisma.dispatch.count({
          where: { status: DispatchStatus.IN_TRANSIT },
        }),
        this.prisma.merchandiseReceipt.count({
          where: { receivedAt: { gte: start, lt: end } },
        }),
        this.prisma.merchandiseReceiptDetail.findMany({
          where: { receipt: { receivedAt: { gte: start, lt: end } } },
          select: { quantity: true },
        }),
      ]);
    const inventoryUnits = inventoryProducts.reduce(
      (sum, product) => sum + product.stock,
      0,
    );
    const inventoryValue = inventoryProducts.reduce(
      (sum, product) => sum + product.stock * Number(product.price),
      0,
    );
    const pendingPurchaseUnits = openOrderDetails.reduce(
      (sum, line) => sum + Math.max(0, line.quantity - line.receivedQty),
      0,
    );
    const pendingPurchaseValue = openOrderDetails.reduce(
      (sum, line) =>
        sum + Math.max(0, line.quantity - line.receivedQty) * Number(line.unitPrice),
      0,
    );
    const unitsReceivedToday = receiptDetailsToday.reduce(
      (sum, detail) => sum + detail.quantity,
      0,
    );
    return {
      totalProducts,
      lowStockProducts,
      stockoutProducts,
      inventoryUnits,
      inventoryValue: Number(inventoryValue.toFixed(2)),
      pendingOrders,
      pendingPurchaseUnits,
      pendingPurchaseValue: Number(pendingPurchaseValue.toFixed(2)),
      invoicesToday,
      salesToday: Number(Number(salesToday._sum.total ?? 0).toFixed(2)),
      taxToday: Number(Number(salesToday._sum.tax ?? 0).toFixed(2)),
      readyToDispatchInvoices,
      pendingDispatches,
      dispatchesInTransit,
      receiptsToday,
      unitsReceivedToday,
    };
  }
}
