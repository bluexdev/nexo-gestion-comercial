import { ProductsService } from './products.service';

describe('ProductsService', () => {
  it('normaliza código, nombre y unidad al crear', async () => {
    const create = jest.fn((input: { data: Record<string, unknown> }) => {
      void input;
      return Promise.resolve({ id: 'p1' });
    });
    const service = new ProductsService({ product: { create } } as never);
    await service.create({
      code: 'prod-9',
      name: 'monitor',
      unit: 'und',
      price: 100,
    });
    expect(create.mock.calls[0][0].data).toMatchObject({
      code: 'PROD-9',
      name: 'MONITOR',
      unit: 'UND',
    });
  });
});
