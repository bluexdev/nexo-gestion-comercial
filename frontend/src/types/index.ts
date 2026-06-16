export type Role = 'ADMIN' | 'OPERATOR';
export type User = { id: string; name: string; email: string; role: Role };
export type Product = {
  id: string; code: string; name: string; description?: string; unit: string;
  price: string; stock: number; active: boolean;
};
export type Supplier = { id: string; ruc: string; name: string; active: boolean };
export type Customer = { id: string; docType: 'DNI' | 'RUC' | 'CE'; docNumber: string; name: string; address?: string; active: boolean };
export type PurchaseOrderLine = { id: string; productId: string; product: Product; quantity: number; unitPrice: string; receivedQty: number };
export type PurchaseOrder = { id: string; number: string; status: string; notes?: string; supplierId: string; supplier: Supplier; details: PurchaseOrderLine[]; createdAt: string };
export type InvoiceLine = { id: string; productId: string; product: Product; quantity: number; unitPrice: string; subtotal: string };
export type Invoice = { id: string; number: string; status: string; customerId: string; customer: Customer; issueDate: string; subtotal: string; tax: string; total: string; details: InvoiceLine[] };
export type Dispatch = { id: string; status: string; carrier?: string; trackingCode?: string; address: string; dispatchedAt: string; invoice: Invoice };
export type ApiResponse<T> = { data: T; message: string; statusCode: number };
export type Paginated<T> = { data: T[]; total: number; page: number; limit: number; totalPages: number };
export type PagedResponse<T> = Paginated<T> & { message: string; statusCode: number };
