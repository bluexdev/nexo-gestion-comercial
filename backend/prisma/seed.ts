import { DispatchStatus, DocType, InvoiceStatus, POStatus, PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!', 12);
  const operatorPassword = await bcrypt.hash(process.env.SEED_OPERATOR_PASSWORD ?? 'Operator123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@nexo.local' },
    update: { password: adminPassword, active: true },
    create: { name: 'Administrador Nexo', email: 'admin@nexo.local', password: adminPassword, role: Role.ADMIN },
  });
  await prisma.user.upsert({
    where: { email: 'operador@nexo.local' },
    update: { password: operatorPassword, active: true },
    create: { name: 'Operador Comercial', email: 'operador@nexo.local', password: operatorPassword, role: Role.OPERATOR },
  });

  const productData = [
    { code: 'PROD-001', name: 'Laptop empresarial', unit: 'UND', price: 2899.9, stock: 18 },
    { code: 'PROD-002', name: 'Monitor 27 pulgadas', unit: 'UND', price: 899.9, stock: 26 },
    { code: 'PROD-003', name: 'Teclado mecánico', unit: 'UND', price: 249.9, stock: 35 },
    { code: 'PROD-004', name: 'Mouse inalámbrico', unit: 'UND', price: 119.9, stock: 42 },
    { code: 'PROD-005', name: 'Dock USB-C', unit: 'UND', price: 329.9, stock: 12 },
  ];
  const products = [];
  for (const item of productData) {
    products.push(await prisma.product.upsert({ where: { code: item.code }, update: {}, create: item }));
  }
  const supplier1 = await prisma.supplier.upsert({
    where: { ruc: '20123456789' }, update: {},
    create: { ruc: '20123456789', name: 'Tecnología Andina SAC', contact: 'Lucía Pérez', phone: '999111222', email: 'ventas@andina.test', address: 'Av. Industrial 150, Lima' },
  });
  await prisma.supplier.upsert({
    where: { ruc: '20987654321' }, update: {},
    create: { ruc: '20987654321', name: 'Distribuciones Pacífico EIRL', contact: 'Mario Ruiz', phone: '988777666', email: 'pedidos@pacifico.test', address: 'Jr. Comercio 820, Callao' },
  });
  const customer1 = await prisma.customer.upsert({
    where: { docNumber: '10456789012' }, update: {},
    create: { docType: DocType.RUC, docNumber: '10456789012', name: 'Estudio Horizonte SAC', email: 'compras@horizonte.test', phone: '955333222', address: 'Av. Arequipa 2200, Lince' },
  });
  await prisma.customer.upsert({
    where: { docNumber: '72345678' }, update: {},
    create: { docType: DocType.DNI, docNumber: '72345678', name: 'Valeria Mendoza', email: 'valeria@example.test', phone: '966444111', address: 'Calle Los Olivos 420, Surco' },
  });

  const order = await prisma.purchaseOrder.upsert({
    where: { number: 'OC-0001' },
    update: {},
    create: {
      number: 'OC-0001', supplierId: supplier1.id, status: POStatus.PARTIAL, notes: 'Orden de demostración',
      details: { create: [
        { productId: products[0].id, quantity: 10, receivedQty: 5, unitPrice: 2500 },
        { productId: products[1].id, quantity: 20, receivedQty: 0, unitPrice: 750 },
      ] },
    },
    include: { details: true },
  });
  if (!(await prisma.merchandiseReceipt.findFirst({ where: { purchaseOrderId: order.id } }))) {
    const line = order.details[0];
    await prisma.merchandiseReceipt.create({
      data: { purchaseOrderId: order.id, notes: 'Recepción parcial de demostración', details: { create: [{ purchaseOrderDetailId: line.id, productId: line.productId, quantity: 5 }] } },
    });
  }
  await prisma.purchaseOrder.upsert({
    where: { number: 'OC-0002' }, update: {},
    create: { number: 'OC-0002', supplierId: supplier1.id, status: POStatus.PENDING, details: { create: [{ productId: products[2].id, quantity: 15, unitPrice: 190 }] } },
  });
  const invoice = await prisma.invoice.upsert({
    where: { number: 'F-0001' }, update: {},
    create: {
      number: 'F-0001', customerId: customer1.id, status: InvoiceStatus.DISPATCHED,
      subtotal: 899.9, tax: 161.98, total: 1061.88,
      details: { create: [{ productId: products[1].id, quantity: 1, unitPrice: 899.9, subtotal: 899.9 }] },
    },
  });
  await prisma.dispatch.upsert({
    where: { invoiceId: invoice.id }, update: {},
    create: { invoiceId: invoice.id, carrier: 'Nexo Express', trackingCode: 'NX-2026-001', address: customer1.address!, status: DispatchStatus.IN_TRANSIT },
  });
  await prisma.sequence.upsert({
    where: { key: 'PURCHASE_ORDER' },
    update: {},
    create: { key: 'PURCHASE_ORDER', value: 2 },
  });
  await prisma.sequence.updateMany({
    where: { key: 'PURCHASE_ORDER', value: { lt: 2 } },
    data: { value: 2 },
  });
  await prisma.sequence.upsert({
    where: { key: 'INVOICE' },
    update: {},
    create: { key: 'INVOICE', value: 1 },
  });
  await prisma.sequence.updateMany({
    where: { key: 'INVOICE', value: { lt: 1 } },
    data: { value: 1 },
  });
}

main().finally(() => prisma.$disconnect());
