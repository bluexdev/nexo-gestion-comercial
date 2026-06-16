import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { DataTable, type Column, type SortOrder } from '../components/ui/DataTable';
import { FormDrawer } from '../components/ui/FormDrawer';
import { MetricCard } from '../components/ui/MetricCard';
import { PageHeader } from '../components/ui/PageHeader';
import { SearchSelect } from '../components/ui/SearchSelect';
import { SelectMenu } from '../components/ui/SelectMenu';
import { StatusBadge } from '../components/ui/StatusBadge';
import { api, messageFromError } from '../services/api';
import type { Dispatch, Invoice, PagedResponse, Paginated } from '../types';
import { date } from '../utils/format';

type Form = { invoiceId: string; carrier: string; trackingCode: string; address: string; notes: string };

export function DispatchPage() {
  const [result, setResult] = useState<Paginated<Dispatch>>({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dispatchedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm<Form>();
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PagedResponse<Dispatch>>('/dispatches', {
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
  const loadInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const [issued, paid] = await Promise.all([
        api.get<PagedResponse<Invoice>>('/invoices', { params: { status: 'ISSUED', limit: 100 } }),
        api.get<PagedResponse<Invoice>>('/invoices', { params: { status: 'PAID', limit: 100 } }),
      ]);
      setInvoices([...issued.data.data, ...paid.data.data]);
    } finally { setInvoicesLoading(false); }
  };
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);
  useEffect(() => { void loadInvoices(); }, []);
  const submit = async (values: Form) => {
    try { await api.post('/dispatches', values); toast.success('Despacho creado'); setDrawer(false); await Promise.all([load(), loadInvoices()]); }
    catch (error) { toast.error(messageFromError(error)); }
  };
  const updateStatus = async (dispatch: Dispatch, status: string) => {
    try { await api.patch(`/dispatches/${dispatch.id}`, { status }); toast.success('Estado actualizado'); await load(); }
    catch (error) { toast.error(messageFromError(error)); }
  };
  const dispatchSummary = useMemo(() => ({
    pending: result.data.filter((dispatch) => dispatch.status === 'PENDING').length,
    inTransit: result.data.filter((dispatch) => dispatch.status === 'IN_TRANSIT').length,
    closed: result.data.filter((dispatch) => ['DELIVERED', 'RETURNED'].includes(dispatch.status)).length,
    availableInvoices: invoices.length,
  }), [invoices.length, result.data]);
  const columns: Column<Dispatch>[] = [
    { key: 'invoice', label: 'Factura', sortKey: 'invoice', render: (row) => <strong className="text-accent">{row.invoice.number}</strong> },
    { key: 'customer', label: 'Cliente', render: (row) => row.invoice.customer.name },
    { key: 'carrier', label: 'Transportista', sortKey: 'carrier', render: (row) => row.carrier || '—' },
    { key: 'tracking', label: 'Tracking', sortKey: 'trackingCode', render: (row) => row.trackingCode || '—' },
    { key: 'date', label: 'Fecha', sortKey: 'dispatchedAt', render: (row) => date(row.dispatchedAt) },
    { key: 'status', label: 'Estado', sortKey: 'status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'action', label: 'Acción rápida', render: (row) => <SelectMenu compact ariaLabel={`Actualizar estado de ${row.invoice.number}`} value={row.status} onChange={(value) => updateStatus(row, value)} disabled={['DELIVERED', 'RETURNED'].includes(row.status)} options={[{ value: 'PENDING', label: 'Pendiente', disabled: row.status !== 'PENDING' }, { value: 'IN_TRANSIT', label: row.status === 'PENDING' ? '→ En tránsito' : 'En tránsito', disabled: !['PENDING', 'IN_TRANSIT'].includes(row.status) }, { value: 'DELIVERED', label: 'Entregado', disabled: row.status !== 'IN_TRANSIT' }, { value: 'RETURNED', label: 'Retornado', disabled: row.status !== 'IN_TRANSIT' }]} /> },
  ];
  return (
    <section>
      <PageHeader title="DESPACHO" action={<button className="btn-primary" onClick={() => { reset({ invoiceId: '', carrier: '', trackingCode: '', address: '', notes: '' }); setDrawer(true); }}>+ Nuevo despacho</button>} />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard compact loading={loading} value={result.total} label="Despachos filtrados" detail={`${result.data.length} visibles`} />
        <MetricCard compact loading={loading} value={dispatchSummary.pending} label="Pendientes visibles" detail="Requieren salida" />
        <MetricCard compact loading={loading} value={dispatchSummary.inTransit} label="En tránsito visibles" detail="Seguimiento activo" />
        <MetricCard compact loading={loading || invoicesLoading} value={dispatchSummary.availableInvoices} label="Facturas disponibles" detail={`${dispatchSummary.closed} cerrados visibles`} />
      </div>
      <DataTable rows={result.data} columns={columns} search={search} onSearch={(value) => { setSearch(value); setPage(1); }} page={page} totalPages={result.totalPages} onPage={setPage} loading={loading} sortBy={sortBy} sortOrder={sortOrder} onSort={(key, order) => { setSortBy(key); setSortOrder(order); setPage(1); }} filters={<div><span className="label">Estado</span><SelectMenu compact ariaLabel="Filtrar despachos por estado" value={statusFilter} onChange={(value) => { setStatusFilter(value); setPage(1); }} options={[{ value: 'all', label: 'Todos' }, { value: 'PENDING', label: 'Pendiente' }, { value: 'IN_TRANSIT', label: 'En tránsito' }, { value: 'DELIVERED', label: 'Entregado' }, { value: 'RETURNED', label: 'Retornado' }]} /></div>} />
      <FormDrawer open={drawer} title="Nuevo despacho" onClose={() => setDrawer(false)}>
        <form className="space-y-5" onSubmit={handleSubmit(submit)}>
          <div><span className="label">Factura disponible</span><SearchSelect value={watch('invoiceId')} onChange={(value) => { setValue('invoiceId', value); const invoice = invoices.find((item) => item.id === value); if (invoice?.customer.address) setValue('address', invoice.customer.address); }} options={invoices.map((invoice) => ({ value: invoice.id, label: `${invoice.number} · ${invoice.customer.name}`, meta: invoice.status }))} /></div>
          <label className="block"><span className="label">Transportista</span><input className="field" {...register('carrier')} /></label>
          <label className="block"><span className="label">Código tracking</span><input className="field" {...register('trackingCode')} /></label>
          <label className="block"><span className="label">Dirección</span><textarea className="field min-h-24" {...register('address', { required: true })} /></label>
          <label className="block"><span className="label">Notas</span><textarea className="field min-h-20" {...register('notes')} /></label>
          <button className="btn-primary w-full" disabled={isSubmitting}>Crear despacho</button>
        </form>
      </FormDrawer>
    </section>
  );
}
