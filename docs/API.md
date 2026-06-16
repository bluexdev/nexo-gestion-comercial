# API

Base local: `http://localhost:3000/api`. Swagger interactivo: `/api/docs`.

## Endpoints

| Módulo | Método y ruta | Descripción |
|---|---|---|
| Auth | `POST /auth/login` | Inicia sesión y crea cookie refresh |
| Auth | `POST /auth/refresh` | Rota refresh y entrega access token |
| Auth | `POST /auth/logout` | Revoca sesión |
| Auth | `GET /auth/me` | Usuario autenticado |
| Productos | `GET/POST /products` | Lista paginada / alta |
| Productos | `GET/PATCH/DELETE /products/:id` | Detalle / edición / baja lógica |
| Proveedores | `GET/POST /suppliers` | Lista / alta |
| Proveedores | `GET/PATCH/DELETE /suppliers/:id` | Detalle / edición / baja lógica |
| Compras | `GET/POST /purchase-orders` | Lista / creación |
| Compras | `GET/PATCH /purchase-orders/:id` | Detalle / edición |
| Compras | `PATCH /purchase-orders/:id/cancel` | Cancelación |
| Recepción | `GET/POST /merchandise-receipts` | Historial / recepción transaccional |
| Clientes | `GET/POST /customers` | Lista / alta |
| Clientes | `GET/PATCH/DELETE /customers/:id` | Detalle / edición / baja lógica |
| Facturas | `GET/POST /invoices` | Lista / emisión transaccional |
| Facturas | `GET /invoices/:id` | Detalle |
| Facturas | `PATCH /invoices/:id/pay` | Marca pagada |
| Facturas | `PATCH /invoices/:id/cancel` | Cancela y restaura stock |
| Despacho | `GET/POST /dispatches` | Lista / creación |
| Despacho | `GET/PATCH /dispatches/:id` | Detalle / actualización |
| Dashboard | `GET /dashboard/metrics` | Métricas agregadas |

## Ejemplos críticos

```http
POST /api/auth/login
Content-Type: application/json

{"email":"admin@nexo.local","password":"Admin123!"}
```

```json
{
  "data": {
    "accessToken": "<jwt>",
    "user": {"id":"...","name":"Administrador Nexo","email":"admin@nexo.local","role":"ADMIN"}
  },
  "message": "Operación exitosa",
  "statusCode": 200
}
```

```http
POST /api/merchandise-receipts
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "purchaseOrderId": "uuid",
  "notes": "Recepción física validada",
  "details": [{"purchaseOrderDetailId":"uuid","quantity":5}]
}
```

```http
POST /api/invoices
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "customerId": "uuid",
  "details": [{"productId":"uuid","quantity":2,"unitPrice":119.90}]
}
```

Listados aceptan `page`, `limit`, `search`, `sortBy` y `sortOrder=asc|desc`. Catálogos aceptan también `active`; órdenes, facturas y despachos aceptan `status` y las órdenes/facturas admiten estados separados por coma. Cada módulo aplica una lista segura de columnas ordenables. Los errores usan `{ "data": null, "message": "...", "statusCode": 400 }`.
