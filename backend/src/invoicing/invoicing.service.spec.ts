import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InvoicingService } from './invoicing.service';

describe('InvoicingService', () => {
  it('impide facturar cuando el stock es insuficiente', async () => {
    const tx = {
      customer: {
        findUnique: jest.fn().mockResolvedValue({ id: 'c1', active: true }),
      },
      product: {
        findMany: jest.fn(() =>
          Promise.resolve([
            {
              id: 'p1',
              code: 'P1',
              name: 'Producto',
              active: true,
              stock: 1,
              price: new Prisma.Decimal(10),
            },
          ]),
        ),
      },
    };
    const prisma = {
      serializable: (operation: (client: typeof tx) => unknown) =>
        operation(tx),
    };
    const service = new InvoicingService(prisma as never);
    await expect(
      service.create({
        customerId: 'c1',
        details: [{ productId: 'p1', quantity: 2 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
