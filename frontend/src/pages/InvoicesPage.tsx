import { Eye, Plus, Trash2, UserPlus, XCircle } from 'lucide-react';
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
import type { ApiResponse, Customer, Invoice, PagedResponse, Paginated, Product } from '../types';
import { date, money } from '../utils/format';

type InvoiceForm = { customerId: string; notes: string; details: { productId: string; quantity: number; unitPrice: number }[] };

export function InvoicesPage() {
  const [result, setResult] = useState<Paginated<Invoice>>({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('issueDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [detail, setDetail] = useState<Invoice | null>(null);
  const [cancelInvoice, setCancelInvoice] = useState<Invoice | null>(null);
  const [newCustomer, setNewCustomer] = useState(false);
  const [customerDraft, setCustomerDraft] = useState({ docType: 'DNI', docNumber: '', name: '', address: '' });
  const { register, control, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm<InvoiceForm>({ defaultValues: { customerId: '', notes: '', details: [{ productId: '', quantity: 1, unitPrice: 0 }] } });
  const { fields, append, remove } = useFieldArray({ control, name: 'details' });
  const lines = useWatch({ control, name: 'details' }) ?? [];
  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0), 0), [lines]);
  const tax = Math.round(subtotal * 18) / 100;
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PagedResponse<Invoice>>('/invoices', {
        params: {
          page,
          search,
          status: statusFilter === 'all' ? undefined : statusFilter,
          sortBy,
          sortOrder,
        },
      });
      setResult(data);
    } finally { setLoading(false); }
  }, [page, search, sortBy, sortOrder, statusFilter]);
  const loadCatalogs = async () => {
    const [customerRes, productRes] = await Promise.all([
      api.get<PagedResponse<Customer>>('/customers', { params: { active: true, limit: 100 } }),
      api.get<PagedResponse<Product>>('/products', { params: { active: true, limit: 100 } }),
    ]);
    setCustomers(customerRes.data.data); setProducts(productRes.data.data);
  };
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);
  useEffect(() => { void loadCatalogs(); }, []);
  const submit = async (values: InvoiceForm) => {
    try {
      await api.post('/invoices', { ...values, details: values.details.map((line) => ({ ...line, quantity: Number(line.quantity), unitPrice: Number(line.unitPrice) })) });
      toast.success('Factura emitida'); setDrawer(false); await load();
    } catch (error) { toast.error(messageFromError(error)); }
  };
  const createCustomer = async () => {
    try {
      const { data } = await api.post<ApiResponse<Customer>>('/customers', customerDraft);
      await loadCatalogs(); setValue('customerId', data.data.id, { shouldDirty: true, shouldValidate: true }); setNewCustomer(false); toast.success('Cliente creado');
    } catch (error) { toast.error(messageFromError(error)); }
  };
  const cancel = async () => {
    if (!cancelInvoice) return;
    try { await api.patch(`/invoices/${cancelInvoice.id}/cancel`); toast.success('Factura cancelada y stock restaurado'); setCancelInvoice(null); await load(); }
    catch (error) { toast.error(messageFromError(error)); }
  };
  const invoiceSummary = useMemo(() => {
    const activeRows = result.data.filter((invoice) => invoice.status !== 'CANCELLED');
    return {
      visibleSales: activeRows.reduce((sum, invoice) => sum + Number(invoice.total), 0),
      readyToDispatch: result.data.filter((invoice) => ['ISSUED', 'PAID'].includes(invoice.status)).length,
      dispatched: result.data.filter((invoice) => invoice.status === 'DISPATCHED').length,
      cancelled: result.data.filter((invoice) => invoice.status === 'CANCELLED').length,
    };
  }, [result.data]);
  const columns: Column<Invoice>[] = [
    { key: 'number', label: 'Número', sortKey: 'number', render: (row) => <strong className="text-accent">{row.number}</strong> },
    { key: 'customer', label: 'Cliente', sortKey: 'customer', render: (row) => row.customer.name },
    { key: 'date', label: 'Emisión', sortKey: 'issueDate', render: (row) => date(row.issueDate) },
    { key: 'total', label: 'Total', sortKey: 'total', render: (row) => money(row.total) },
    { key: 'status', label: 'Estado', sortKey: 'status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'actions', label: 'Acciones', render: (row) => <div className="flex gap-2"><button className="btn-secondary !p-2.5" onClick={() => setDetail(row)}><Eye size={15} /></button>{['ISSUED', 'PAID'].includes(row.status) && <button className="btn-secondary !p-2.5 text-danger" onClick={() => setCancelInvoice(row)}><XCircle size={15} /></button>}</div> },
  ];
  return (
    <section>
      <PageHeader title="FACTURACIÓN" action={<button className="btn-primary" onClick={() => { reset({ customerId: '', notes: '', details: [{ productId: '', quantity: 1, unitPrice: 0 }] }); setDrawer(true); }}>+ Nueva factura</button>} />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard compact loading={loading} value={result.total} label="Facturas filtradas" detail={`${result.data.length} visibles`} />
        <MetricCard compact loading={loading} value={money(invoiceSummary.visibleSales)} label="Venta visible" detail="Sin canceladas" />
        <MetricCard compact loading={loading} value={invoiceSummary.readyToDispatch} label="Listas para despacho" detail="Emitidas o pagadas" />
        <MetricCard compact loading={loading} value={invoiceSummary.dispatched} label="Despachadas visibles" detail={`${invoiceSummary.cancelled} canceladas`} />
      </div>
      <DataTable rows={result.data} columns={columns} search={search} onSearch={(value) => { setSearch(value); setPage(1); }} page={page} totalPages={result.totalPages} onPage={setPage} loading={loading} sortBy={sortBy} sortOrder={sortOrder} onSort={(key, order) => { setSortBy(key); setSortOrder(order); setPage(1); }} filters={<div><span className="label">Estado</span><SelectMenu compact ariaLabel="Filtrar facturas por estado" value={statusFilter} onChange={(value) => { setStatusFilter(value); setPage(1); }} options={[{ value: 'all', label: 'Todos' }, { value: 'ISSUED', label: 'Emitida' }, { value: 'PAID', label: 'Pagada' }, { value: 'DISPATCHED', label: 'Despachada' }, { value: 'CANCELLED', label: 'Cancelada' }]} /></div>} />
      <FormDrawer open={drawer} title="Nueva factura" onClose={() => setDrawer(false)}>
        <form className="space-y-6" onSubmit={handleSubmit(submit)}>
          <div><div className="mb-2 flex items-center justify-between"><span className="label !mb-0">Cliente</span><button type="button" className="text-[11px] text-accent" onClick={() => setNewCustomer(!newCustomer)}><UserPlus className="mr-1 inline" size={14} /> Crear inline</button></div><SearchSelect value={watch('customerId')} onChange={(value) => setValue('customerId', value, { shouldDirty: true, shouldValidate: true })} options={customers.map((item) => ({ value: item.id, label: item.name, meta: item.docNumber }))} /></div>
          {newCustomer && <div className="liquid-glass space-y-3 rounded-[14px] p-4"><SelectMenu ariaLabel="Tipo de documento" value={customerDraft.docType} onChange={(value) => setCustomerDraft({ ...customerDraft, docType: value })} options={[{ value: 'DNI', label: 'DNI' }, { value: 'RUC', label: 'RUC' }, { value: 'CE', label: 'CE' }]} /><input className="field" placeholder="Número documento" value={customerDraft.docNumber} onChange={(event) => setCustomerDraft({ ...customerDraft, docNumber: event.target.value })} /><input className="field" placeholder="Nombre" value={customerDraft.name} onChange={(event) => setCustomerDraft({ ...customerDraft, name: event.target.value })} /><input className="field" placeholder="Dirección" value={customerDraft.address} onChange={(event) => setCustomerDraft({ ...customerDraft, address: event.target.value })} /><button type="button" className="btn-secondary w-full" onClick={createCustomer}>Guardar cliente</button></div>}
          <div className="space-y-3"><div className="flex items-center justify-between"><span className="label !mb-0">Líneas</span><button type="button" className="btn-secondary !p-2.5" onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}><Plus size={15} /></button></div>{fields.map((field, index) => <div key={field.id} className="liquid-glass rounded-[14px] p-4"><SearchSelect value={lines[index]?.productId} onChange={(value) => { setValue(`details.${index}.productId`, value, { shouldDirty: true, shouldValidate: true }); const product = products.find((item) => item.id === value); if (product) setValue(`details.${index}.unitPrice`, Number(product.price), { shouldDirty: true, shouldValidate: true }); }} options={products.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}`, meta: `STOCK ${item.stock}` }))} placeholder="Producto" /><div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2"><input className="field" type="number" min="1" {...register(`details.${index}.quantity`, { valueAsNumber: true })} /><input className="field" type="number" min="0" step="0.01" {...register(`details.${index}.unitPrice`, { valueAsNumber: true })} /><button type="button" className="btn-secondary !p-3 text-danger" onClick={() => remove(index)}><Trash2 size={15} /></button></div></div>)}</div>
          <label className="block"><span className="label">Notas</span><textarea className="field min-h-20" {...register('notes')} /></label>
          <div className="liquid-glass rounded-[14px] p-5 text-right text-xs"><p className="text-muted">Subtotal {money(subtotal)}</p><p className="my-2 text-muted">IGV 18% {money(tax)}</p><strong className="font-grotesk text-3xl text-accent">{money(subtotal + tax)}</strong></div>
          <button className="btn-primary w-full" disabled={isSubmitting}>Emitir factura</button>
        </form>
      </FormDrawer>
      <FormDrawer open={!!detail} title={`Factura ${detail?.number ?? ''}`} onClose={() => setDetail(null)}>{detail && <div className="space-y-5"><strong className="block font-grotesk text-5xl text-accent">{detail.number}</strong><p>{detail.customer.name}</p><StatusBadge status={detail.status} />{detail.details.map((line) => <div key={line.id} className="liquid-glass rounded-[14px] p-4"><strong>{line.product.name}</strong><p className="mt-2 text-xs text-muted">{line.quantity} × {money(line.unitPrice)} = {money(line.subtotal)}</p></div>)}<div className="border-t border-border pt-5 text-right"><p className="text-muted">Subtotal {money(detail.subtotal)}</p><p className="text-muted">IGV {money(detail.tax)}</p><strong className="font-grotesk text-3xl text-accent">{money(detail.total)}</strong></div></div>}</FormDrawer>
      <ConfirmModal open={!!cancelInvoice} title="Cancelar factura" message={`Se cancelará ${cancelInvoice?.number ?? ''} y se restaurará el stock de todas sus líneas.`} onClose={() => setCancelInvoice(null)} onConfirm={cancel} />
    </section>
  );
}
