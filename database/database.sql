-- NEXO. script completo de base de datos PostgreSQL
-- Incluye schema inicial y seed idempotente.

CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERATOR');
CREATE TYPE "POStatus" AS ENUM ('PENDING', 'PARTIAL', 'RECEIVED', 'CANCELLED');
CREATE TYPE "DocType" AS ENUM ('DNI', 'RUC', 'CE');
CREATE TYPE "InvoiceStatus" AS ENUM ('ISSUED', 'PAID', 'CANCELLED', 'DISPATCHED');
CREATE TYPE "DispatchStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'DELIVERED', 'RETURNED');

CREATE TABLE "User" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT NOT NULL, "password" TEXT NOT NULL, "role" "Role" NOT NULL DEFAULT 'OPERATOR', "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "User_pkey" PRIMARY KEY ("id"));
CREATE TABLE "RefreshToken" ("id" TEXT NOT NULL, "tokenHash" TEXT NOT NULL, "userId" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "revokedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Product" ("id" TEXT NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "unit" TEXT NOT NULL, "price" DECIMAL(10,2) NOT NULL, "stock" INTEGER NOT NULL DEFAULT 0, "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Product_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Supplier" ("id" TEXT NOT NULL, "ruc" TEXT NOT NULL, "name" TEXT NOT NULL, "contact" TEXT, "phone" TEXT, "email" TEXT, "address" TEXT, "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id"));
CREATE TABLE "PurchaseOrder" ("id" TEXT NOT NULL, "number" TEXT NOT NULL, "supplierId" TEXT NOT NULL, "status" "POStatus" NOT NULL DEFAULT 'PENDING', "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id"));
CREATE TABLE "PurchaseOrderDetail" ("id" TEXT NOT NULL, "purchaseOrderId" TEXT NOT NULL, "productId" TEXT NOT NULL, "quantity" INTEGER NOT NULL, "unitPrice" DECIMAL(10,2) NOT NULL, "receivedQty" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "PurchaseOrderDetail_pkey" PRIMARY KEY ("id"));
CREATE TABLE "MerchandiseReceipt" ("id" TEXT NOT NULL, "purchaseOrderId" TEXT NOT NULL, "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "MerchandiseReceipt_pkey" PRIMARY KEY ("id"));
CREATE TABLE "MerchandiseReceiptDetail" ("id" TEXT NOT NULL, "receiptId" TEXT NOT NULL, "purchaseOrderDetailId" TEXT NOT NULL, "productId" TEXT NOT NULL, "quantity" INTEGER NOT NULL, CONSTRAINT "MerchandiseReceiptDetail_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Customer" ("id" TEXT NOT NULL, "docType" "DocType" NOT NULL DEFAULT 'DNI', "docNumber" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT, "phone" TEXT, "address" TEXT, "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Customer_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Invoice" ("id" TEXT NOT NULL, "number" TEXT NOT NULL, "customerId" TEXT NOT NULL, "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "subtotal" DECIMAL(10,2) NOT NULL, "tax" DECIMAL(10,2) NOT NULL, "total" DECIMAL(10,2) NOT NULL, "status" "InvoiceStatus" NOT NULL DEFAULT 'ISSUED', "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id"));
CREATE TABLE "InvoiceDetail" ("id" TEXT NOT NULL, "invoiceId" TEXT NOT NULL, "productId" TEXT NOT NULL, "quantity" INTEGER NOT NULL, "unitPrice" DECIMAL(10,2) NOT NULL, "subtotal" DECIMAL(10,2) NOT NULL, CONSTRAINT "InvoiceDetail_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Dispatch" ("id" TEXT NOT NULL, "invoiceId" TEXT NOT NULL, "dispatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "carrier" TEXT, "trackingCode" TEXT, "address" TEXT NOT NULL, "status" "DispatchStatus" NOT NULL DEFAULT 'PENDING', "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Dispatch_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Sequence" ("key" TEXT NOT NULL, "value" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "Sequence_pkey" PRIMARY KEY ("key"));

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");
CREATE UNIQUE INDEX "Supplier_ruc_key" ON "Supplier"("ruc");
CREATE UNIQUE INDEX "PurchaseOrder_number_key" ON "PurchaseOrder"("number");
CREATE INDEX "PurchaseOrder_supplierId_idx" ON "PurchaseOrder"("supplierId");
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");
CREATE UNIQUE INDEX "PurchaseOrderDetail_purchaseOrderId_productId_key" ON "PurchaseOrderDetail"("purchaseOrderId", "productId");
CREATE INDEX "MerchandiseReceipt_purchaseOrderId_idx" ON "MerchandiseReceipt"("purchaseOrderId");
CREATE UNIQUE INDEX "Customer_docNumber_key" ON "Customer"("docNumber");
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");
CREATE UNIQUE INDEX "Dispatch_invoiceId_key" ON "Dispatch"("invoiceId");

ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrderDetail" ADD CONSTRAINT "PurchaseOrderDetail_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrderDetail" ADD CONSTRAINT "PurchaseOrderDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MerchandiseReceipt" ADD CONSTRAINT "MerchandiseReceipt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MerchandiseReceiptDetail" ADD CONSTRAINT "MerchandiseReceiptDetail_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "MerchandiseReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MerchandiseReceiptDetail" ADD CONSTRAINT "MerchandiseReceiptDetail_purchaseOrderDetailId_fkey" FOREIGN KEY ("purchaseOrderDetailId") REFERENCES "PurchaseOrderDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MerchandiseReceiptDetail" ADD CONSTRAINT "MerchandiseReceiptDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InvoiceDetail" ADD CONSTRAINT "InvoiceDetail_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvoiceDetail" ADD CONSTRAINT "InvoiceDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Datos iniciales
-- NEXO. datos iniciales SQL idempotentes para PostgreSQL.
-- Ejecutar después de database/schema.sql.
-- Credenciales:
--   admin@nexo.local / Admin123!
--   operador@nexo.local / Operator123!

INSERT INTO "User" ("id", "name", "email", "password", "role", "active", "createdAt", "updatedAt")
VALUES
  ('seed-admin-user', 'Administrador Nexo', 'admin@nexo.local', '$2b$12$3EnBE0/wlHvv9iC0CelSAeqVHBF4fVmBaPHaaw5R685Gd7smZZK4O', 'ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-operator-user', 'Operador Comercial', 'operador@nexo.local', '$2b$12$jorDfGJxpwE.LiuWPp3T/OCPVB3a04U6w6lkFDqJgJWv53xV5z/I6', 'OPERATOR', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("email") DO UPDATE SET
  "password" = EXCLUDED."password",
  "active" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Product" ("id", "code", "name", "description", "unit", "price", "stock", "active", "createdAt", "updatedAt")
VALUES
  ('seed-product-001', 'PROD-001', 'Laptop empresarial', 'Equipo de trabajo para operaciones comerciales', 'UND', 2899.90, 18, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-product-002', 'PROD-002', 'Monitor 27 pulgadas', 'Monitor para estación administrativa', 'UND', 899.90, 26, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-product-003', 'PROD-003', 'Teclado mecánico', 'Periférico de oficina', 'UND', 249.90, 35, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-product-004', 'PROD-004', 'Mouse inalámbrico', 'Periférico inalámbrico', 'UND', 119.90, 42, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-product-005', 'PROD-005', 'Dock USB-C', 'Concentrador para laptop', 'UND', 329.90, 12, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "unit" = EXCLUDED."unit",
  "price" = EXCLUDED."price",
  "active" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Supplier" ("id", "ruc", "name", "contact", "phone", "email", "address", "active", "createdAt", "updatedAt")
VALUES
  ('seed-supplier-001', '20123456789', 'Tecnología Andina SAC', 'Lucía Pérez', '999111222', 'ventas@andina.test', 'Av. Industrial 150, Lima', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-supplier-002', '20987654321', 'Distribuciones Pacífico EIRL', 'Mario Ruiz', '988777666', 'pedidos@pacifico.test', 'Jr. Comercio 820, Callao', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("ruc") DO UPDATE SET
  "name" = EXCLUDED."name",
  "contact" = EXCLUDED."contact",
  "phone" = EXCLUDED."phone",
  "email" = EXCLUDED."email",
  "address" = EXCLUDED."address",
  "active" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Customer" ("id", "docType", "docNumber", "name", "email", "phone", "address", "active", "createdAt", "updatedAt")
VALUES
  ('seed-customer-001', 'RUC', '10456789012', 'Estudio Horizonte SAC', 'compras@horizonte.test', '955333222', 'Av. Arequipa 2200, Lince', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-customer-002', 'DNI', '72345678', 'Valeria Mendoza', 'valeria@example.test', '966444111', 'Calle Los Olivos 420, Surco', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("docNumber") DO UPDATE SET
  "docType" = EXCLUDED."docType",
  "name" = EXCLUDED."name",
  "email" = EXCLUDED."email",
  "phone" = EXCLUDED."phone",
  "address" = EXCLUDED."address",
  "active" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Sequence" ("key", "value")
VALUES
  ('PURCHASE_ORDER', 0),
  ('INVOICE', 0)
ON CONFLICT ("key") DO NOTHING;

