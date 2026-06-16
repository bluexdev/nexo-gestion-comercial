import { Eye, Plus, Trash2, XCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { DataTable, type Column, type SortOrder } from '../components/ui/DataTable';
import { FormDrawer } from '../components/ui/FormDrawer';
import { MetricCard } from '../components/ui/MetricCard';
import { PageHeader } from '../components/ui/PageHeader';
import { SearchSelect } from '../components/ui/SearchSelect';
import { SelectMenu } from '../components/ui/SelectMenu';
import { StatusBadge } from '../components/ui/StatusBadge';
import { api, messageFromError } from '../services/api';
import type { PagedResponse, Paginated, Product, PurchaseOrder, Supplier } from '../types';
import { date, money } from '../utils/format';

type Form = { supplierId: string; notes: string; details: { productId: string; quantity: number; unitPrice: number }[] };

export function PurchaseOrdersPage() {
  const [result, setResult] = useState<Paginated<PurchaseOrder>>({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [drawer, setDrawer] = useState(false);
  const [detail, setDetail] = useState<PurchaseOrder | null>(null);
  const [cancelOrder, setCancelOrder] = useState<PurchaseOrder | null>(null);
  const { register, control, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm<Form>({ defaultValues: { supplierId: '', notes: '', details: [{ productId: '', quantity: 1, unitPrice: 0 }] } });
  const { fields, append, remove } = useFieldArray({ control, name: 'details' });
  const lines = useWatch({ control, name: 'details' }) ?? [];
  const total = useMemo(() => lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0), 0), [lines]);
  const load = useCallback(async () => {
    const { data } = await api.get<PagedResponse<PurchaseOrder>>('/purchase-orders', {
      params: {
        page,
        search,
        status: statusFilter === 'all' ? undefined : statusFilter,
        sortBy,
        sortOrder,
      },
    });
    setResult(data);
  }, [page, search, sortBy, sortOrder, statusFilter]);
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);
  const orderSummary = useMemo(() => {
    const openRows = result.data.filter((order) => ['PENDING', 'PARTIAL'].includes(order.status));
    const pendingUnits = openRows.reduce((sum, order) => sum + order.details.reduce((lineSum, line) => lineSum + Math.max(0, line.quantity - line.receivedQty), 0), 0);
    const openValue = openRows.reduce((sum, order) => sum + order.details.reduce((lineSum, line) => lineSum + Math.max(0, line.quantity - line.receivedQty) * Number(line.unitPrice), 0), 0);
    return {
      openOrders: openRows.length,
      pendingUnits,
      openValue,
      receivedRows: result.data.filter((order) => order.status === 'RECEIVED').length,
    };
  }, [result.data]);
  useEffect(() => {
    Promise.all([
      api.get<PagedResponse<Supplier>>('/suppliers', { params: { active: true, limit: 100 } }),
      api.get<PagedResponse<Product>>('/products', { params: { active: true, limit: 100 } }),
    ]).then(([supplierRes, productRes]) => { setSuppliers(supplierRes.data.data); setProducts(productRes.data.data); });
  }, []);
  const submit = async (values: Form) => {
    try {
      await api.post('/purchase-orders', { ...values, details: values.details.map((line) => ({ ...line, quantity: Number(line.quantity), unitPrice: Number(line.unitPrice) })) });
      toast.success('Orden de compra creada'); setDrawer(false); await load();
    } catch (error) { toast.error(messageFromError(error)); }
  };
  const cancel = async () => {
    if (!cancelOrder) return;
    try { await api.patch(`/purchase-orders/${cancelOrder.id}/cancel`); toast.success('Orden cancelada'); setCancelOrder(null); await load(); }
    catch (error) { toast.error(messageFromError(error)); }
  };
  const columns: Column<PurchaseOrder>[] = [
    { key: 'number', label: 'Número', sortKey: 'number', render: (row) => <strong className="text-accent">{row.number}</strong> },
    { key: 'supplier', label: 'Proveedor', sortKey: 'supplier', render: (row) => row.supplier.name },
    { key: 'date', label: 'Fecha', sortKey: 'createdAt', render: (row) => date(row.createdAt) },
    { key: 'total', label: 'Total', render: (row) => money(row.details.reduce((sum, line) => sum + Number(line.unitPrice) * line.quantity, 0)) },
    { key: 'status', label: 'Estado', sortKey: 'status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'actions', label: 'Acciones', render: (row) => <div className="flex gap-2"><button className="btn-secondary !p-2.5" onClick={() => setDetail(row)}><Eye size={15} /></button>{!['RECEIVED', 'CANCELLED'].includes(row.status) && <button className="btn-secondary !p-2.5 text-danger" onClick={() => setCancelOrder(row)}><XCircle size={15} /></button>}</div> },
  ];
  return (
    <section>
      <PageHeader title="ÓRDENES DE COMPRA" action={<button className="btn-primary" onClick={() => { reset({ supplierId: '', notes: '', details: [{ productId: '', quantity: 1, unitPrice: 0 }] }); setDrawer(true); }}>+ Nueva orden</button>} />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard compact value={result.total} label="Órdenes filtradas" detail={`${result.data.length} visibles`} />
        <MetricCard compact value={orderSummary.openOrders} label="Abiertas visibles" detail="Pendientes o parciales" />
        <MetricCard compact value={orderSummary.pendingUnits} label="Unidades por recibir" detail={money(orderSummary.openValue)} />
        <MetricCard compact value={orderSummary.receivedRows} label="Recibidas visibles" detail="Cerradas por ingreso" />
      </div>
      <DataTable rows={result.data} columns={columns} search={search} onSearch={(value) => { setSearch(value); setPage(1); }} page={page} totalPages={result.totalPages} onPage={setPage} sortBy={sortBy} sortOrder={sortOrder} onSort={(key, order) => { setSortBy(key); setSortOrder(order); setPage(1); }} filters={<div><span className="label">Estado</span><SelectMenu compact ariaLabel="Filtrar órdenes por estado" value={statusFilter} onChange={(value) => { setStatusFilter(value); setPage(1); }} options={[{ value: 'all', label: 'Todos' }, { value: 'PENDING', label: 'Pendiente' }, { value: 'PARTIAL', label: 'Parcial' }, { value: 'RECEIVED', label: 'Recibida' }, { value: 'CANCELLED', label: 'Cancelada' }]} /></div>} />
      <FormDrawer open={drawer} title="Nueva orden de compra" onClose={() => setDrawer(false)}>
        <form className="space-y-6" onSubmit={handleSubmit(submit)}>
          <div><span className="label">Proveedor</span><SearchSelect value={watch('supplierId')} onChange={(value) => setValue('supplierId', value, { shouldDirty: true, shouldValidate: true })} options={suppliers.map((item) => ({ value: item.id, label: item.name, meta: item.ruc }))} /></div>
          <div className="space-y-3">
            <div className="flex items-center justify-between"><span className="label !mb-0">Líneas</span><button type="button" className="btn-secondary !p-2.5" onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}><Plus size={15} /></button></div>
            {fields.map((field, index) => (
              <div key={field.id} className="liquid-glass rounded-[14px] p-4">
                <SearchSelect value={lines[index]?.productId} onChange={(value) => { setValue(`details.${index}.productId`, value, { shouldDirty: true, shouldValidate: true }); const product = products.find((item) => item.id === value); if (product) setValue(`details.${index}.unitPrice`, Number(product.price), { shouldDirty: true, shouldValidate: true }); }} options={products.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}`, meta: `STOCK ${item.stock}` }))} placeholder="Producto" />
                <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2"><input className="field" type="number" min="1" placeholder="Cantidad" {...register(`details.${index}.quantity`, { valueAsNumber: true })} /><input className="field" type="number" min="0" step="0.01" placeholder="Precio" {...register(`details.${index}.unitPrice`, { valueAsNumber: true })} /><button type="button" className="btn-secondary !p-3 text-danger" onClick={() => remove(index)}><Trash2 size={15} /></button></div>
              </div>
            ))}
          </div>
          <label className="block"><span className="label">Notas</span><textarea className="field min-h-20" {...register('notes')} /></label>
          <div className="liquid-glass rounded-[14px] p-5 text-right"><span className="text-[11px] text-muted">Total</span><strong className="ml-4 font-grotesk text-3xl text-accent">{money(total)}</strong></div>
          <button className="btn-primary w-full" disabled={isSubmitting}>Guardar orden</button>
        </form>
      </FormDrawer>
      <FormDrawer open={!!detail} title={`Detalle ${detail?.number ?? ''}`} onClose={() => setDetail(null)}>
        {detail && <div className="space-y-5"><div><span className="label">Proveedor</span><p>{detail.supplier.name}</p></div><StatusBadge status={detail.status} />{detail.details.map((line) => <div key={line.id} className="liquid-glass rounded-[14px] p-4"><strong>{line.product.name}</strong><p className="mt-2 text-xs text-muted">{line.quantity} × {money(line.unitPrice)} · Recibido {line.receivedQty}</p></div>)}</div>}
      </FormDrawer>
      <ConfirmModal open={!!cancelOrder} title="Cancelar orden" message={`Se cancelará ${cancelOrder?.number ?? ''}. La mercadería ya recibida no se revierte.`} onClose={() => setCancelOrder(null)} onConfirm={cancel} />
    </section>
  );
}
