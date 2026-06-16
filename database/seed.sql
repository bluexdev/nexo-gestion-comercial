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
