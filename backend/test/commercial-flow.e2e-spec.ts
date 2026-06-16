/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ApiResponseInterceptor } from '../src/common/api-response.interceptor';
import { GlobalExceptionFilter } from '../src/common/http-exception.filter';

describe('Flujo comercial (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshCookie: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ApiResponseInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('autentica, rota sesión y completa producto → OC → recepción → factura → despacho', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@nexo.local',
        password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!',
      })
      .expect(200);

    accessToken = login.body.data.accessToken;
    refreshCookie = login.headers['set-cookie'][0].split(';')[0];
    expect(accessToken).toBeTruthy();
    expect(refreshCookie).toContain('refreshToken=');

    const refresh = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(200);
    accessToken = refresh.body.data.accessToken;
    refreshCookie = refresh.headers['set-cookie'][0].split(';')[0];

    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const auth = { Authorization: `Bearer ${accessToken}` };

    const product = await request(app.getHttpServer())
      .post('/api/products')
      .set(auth)
      .send({
        code: `E2E-${suffix}`,
        name: 'Producto flujo E2E',
        unit: 'UND',
        price: 10,
        stock: 0,
      })
      .expect(201);

    const sortedProducts = await request(app.getHttpServer())
      .get('/api/products?active=true&sortBy=code&sortOrder=asc&limit=100')
      .set(auth)
      .expect(200);
    expect(
      sortedProducts.body.data.every(
        (item: { active: boolean }) => item.active,
      ),
    ).toBe(true);
    expect(
      sortedProducts.body.data.map((item: { code: string }) => item.code),
    ).toEqual(
      [...sortedProducts.body.data]
        .map((item: { code: string }) => item.code)
        .sort((left: string, right: string) => left.localeCompare(right)),
    );

    const supplier = await request(app.getHttpServer())
      .post('/api/suppliers')
      .set(auth)
      .send({
        ruc: suffix.slice(-11).padStart(11, '2'),
        name: `Proveedor E2E ${suffix}`,
      })
      .expect(201);

    const customer = await request(app.getHttpServer())
      .post('/api/customers')
      .set(auth)
      .send({
        docType: 'DNI',
        docNumber: suffix.slice(-8).padStart(8, '7'),
        name: `Cliente E2E ${suffix}`,
        address: 'Lima',
      })
      .expect(201);

    const order = await request(app.getHttpServer())
      .post('/api/purchase-orders')
      .set(auth)
      .send({
        supplierId: supplier.body.data.id,
        details: [
          {
            productId: product.body.data.id,
            quantity: 2,
            unitPrice: 8,
          },
        ],
      })
      .expect(201);
    expect(order.body.data.number).toMatch(/^OC-\d{4,}$/);

    const orderLineId = order.body.data.details[0].id;
    const firstReceipt = await request(app.getHttpServer())
      .post('/api/merchandise-receipts')
      .set(auth)
      .send({
        purchaseOrderId: order.body.data.id,
        details: [{ purchaseOrderDetailId: orderLineId, quantity: 1 }],
      })
      .expect(201);
    expect(firstReceipt.body.data.purchaseOrder.status).toBe('PARTIAL');

    const secondReceipt = await request(app.getHttpServer())
      .post('/api/merchandise-receipts')
      .set(auth)
      .send({
        purchaseOrderId: order.body.data.id,
        details: [{ purchaseOrderDetailId: orderLineId, quantity: 1 }],
      })
      .expect(201);
    expect(secondReceipt.body.data.purchaseOrder.status).toBe('RECEIVED');

    await request(app.getHttpServer())
      .post('/api/merchandise-receipts')
      .set(auth)
      .send({
        purchaseOrderId: order.body.data.id,
        details: [{ purchaseOrderDetailId: orderLineId, quantity: 1 }],
      })
      .expect(400);

    const receivedOrders = await request(app.getHttpServer())
      .get('/api/purchase-orders?status=RECEIVED&sortBy=number&sortOrder=desc')
      .set(auth)
      .expect(200);
    expect(
      receivedOrders.body.data.every(
        (item: { status: string }) => item.status === 'RECEIVED',
      ),
    ).toBe(true);

    const invoice = await request(app.getHttpServer())
      .post('/api/invoices')
      .set(auth)
      .send({
        customerId: customer.body.data.id,
        details: [
          { productId: product.body.data.id, quantity: 1, unitPrice: 10 },
        ],
      })
      .expect(201);
    expect(invoice.body.data.number).toMatch(/^F-\d{4,}$/);
    expect(Number(invoice.body.data.total)).toBe(11.8);

    const availableInvoices = await request(app.getHttpServer())
      .get('/api/invoices?status=ISSUED,PAID&limit=100')
      .set(auth)
      .expect(200);
    expect(
      availableInvoices.body.data.some(
        (item: { id: string }) => item.id === invoice.body.data.id,
      ),
    ).toBe(true);

    const issuedInvoices = await request(app.getHttpServer())
      .get('/api/invoices?status=ISSUED&sortBy=total&sortOrder=asc')
      .set(auth)
      .expect(200);
    expect(
      issuedInvoices.body.data.every(
        (item: { status: string }) => item.status === 'ISSUED',
      ),
    ).toBe(true);

    const dispatch = await request(app.getHttpServer())
      .post('/api/dispatches')
      .set(auth)
      .send({
        invoiceId: invoice.body.data.id,
        carrier: 'E2E Express',
        trackingCode: `TRACK-${suffix}`,
        address: 'Lima',
      })
      .expect(201);

    const searchedDispatch = await request(app.getHttpServer())
      .get(`/api/dispatches?search=TRACK-${suffix}`)
      .set(auth)
      .expect(200);
    expect(searchedDispatch.body.data).toHaveLength(1);
    expect(searchedDispatch.body.data[0].id).toBe(dispatch.body.data.id);

    const pendingDispatches = await request(app.getHttpServer())
      .get('/api/dispatches?status=PENDING&sortBy=trackingCode&sortOrder=asc')
      .set(auth)
      .expect(200);
    expect(
      pendingDispatches.body.data.some(
        (item: { id: string }) => item.id === dispatch.body.data.id,
      ),
    ).toBe(true);

    await request(app.getHttpServer())
      .patch(`/api/dispatches/${dispatch.body.data.id}`)
      .set(auth)
      .send({ status: 'DELIVERED' })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/dispatches/${dispatch.body.data.id}`)
      .set(auth)
      .send({ status: 'IN_TRANSIT' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/dispatches/${dispatch.body.data.id}`)
      .set(auth)
      .send({ status: 'DELIVERED' })
      .expect(200);

    const deliveredDispatches = await request(app.getHttpServer())
      .get('/api/dispatches?status=DELIVERED')
      .set(auth)
      .expect(200);
    expect(
      deliveredDispatches.body.data.some(
        (item: { id: string }) => item.id === dispatch.body.data.id,
      ),
    ).toBe(true);

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', refreshCookie)
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(401);
  });
});
