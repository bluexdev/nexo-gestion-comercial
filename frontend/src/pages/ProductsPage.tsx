import { zodResolver } from '@hookform/resolvers/zod';
import { Edit3, Power } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { DataTable, type Column, type SortOrder } from '../components/ui/DataTable';
import { FormDrawer } from '../components/ui/FormDrawer';
import { MetricCard } from '../components/ui/MetricCard';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SelectMenu } from '../components/ui/SelectMenu';
import { api, messageFromError } from '../services/api';
import type { PagedResponse, Paginated, Product } from '../types';
import { money } from '../utils/format';

const schema = z.object({
  code: z.string().min(1), name: z.string().min(2), description: z.string().optional(),
  unit: z.string().min(1), price: z.number().min(0), stock: z.number().int().min(0),
});
type Form = z.infer<typeof schema>;

export function ProductsPage() {
  const [result, setResult] = useState<Paginated<Product>>({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [deactivate, setDeactivate] = useState<Product | null>(null);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PagedResponse<Product>>('/products', {
        params: {
          page,
          search,
          active:
            activeFilter === 'all' ? undefined : activeFilter === 'active',
          sortBy,
          sortOrder,
        },
      });
      setResult(data);
    } finally { setLoading(false); }
  }, [activeFilter, page, search, sortBy, sortOrder]);
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);
  const stockSummary = useMemo(() => {
    const activeRows = result.data.filter((product) => product.active);
    const stockUnits = activeRows.reduce((sum, product) => sum + product.stock, 0);
    const inventoryValue = activeRows.reduce((sum, product) => sum + product.stock * Number(product.price), 0);
    return {
      visible: result.data.length,
      noStock: activeRows.filter((product) => product.stock === 0).length,
      lowStock: activeRows.filter((product) => product.stock > 0 && product.stock <= 5).length,
      stockUnits,
      inventoryValue,
    };
  }, [result.data]);
  const openNew = () => { setEditing(null); reset({ code: '', name: '', description: '', unit: 'UND', price: 0, stock: 0 }); setDrawer(true); };
  const openEdit = (product: Product) => { setEditing(product); reset({ ...product, price: Number(product.price) }); setDrawer(true); };
  const submit = async (values: Form) => {
    try {
      if (editing) await api.patch(`/products/${editing.id}`, values); else await api.post('/products', values);
      toast.success(editing ? 'Producto actualizado' : 'Producto creado');
      setDrawer(false); await load();
    } catch (error) { toast.error(messageFromError(error)); }
  };
  const confirmDeactivate = async () => {
    if (!deactivate) return;
    try { await api.delete(`/products/${deactivate.id}`); toast.success('Producto desactivado'); setDeactivate(null); await load(); }
    catch (error) { toast.error(messageFromError(error)); }
  };
  const columns: Column<Product>[] = [
    { key: 'code', label: 'Código', sortKey: 'code', render: (row) => row.code },
    { key: 'name', label: 'Nombre', sortKey: 'name', render: (row) => row.name },
    { key: 'unit', label: 'Unidad', sortKey: 'unit', render: (row) => row.unit },
    { key: 'price', label: 'Precio', sortKey: 'price', render: (row) => money(row.price) },
    { key: 'stock', label: 'Stock', sortKey: 'stock', render: (row) => <span className={`inline-flex rounded-[28px] px-3 py-1 ${row.stock > 0 ? 'bg-accent-soft text-accent' : 'bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] text-danger'}`}>{row.stock}</span> },
    { key: 'status', label: 'Estado', sortKey: 'active', render: (row) => <StatusBadge status={row.active ? 'ACTIVO' : 'INACTIVO'} /> },
    { key: 'actions', label: 'Acciones', render: (row) => <div className="flex gap-2"><button className="btn-secondary !p-2.5" onClick={() => openEdit(row)}><Edit3 size={15} /></button>{row.active && <button className="btn-secondary !p-2.5 text-danger" onClick={() => setDeactivate(row)}><Power size={15} /></button>}</div> },
  ];
  return (
    <section>
      <PageHeader title="PRODUCTOS" accent="maestro" action={<button className="btn-primary" onClick={openNew}>+ Nuevo producto</button>} />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard compact loading={loading} value={result.total} label="Productos filtrados" detail={`${stockSummary.visible} visibles en página`} />
        <MetricCard compact loading={loading} value={stockSummary.stockUnits} label="Unidades visibles" detail="Según filtro actual" />
        <MetricCard compact loading={loading} value={money(stockSummary.inventoryValue)} label="Valor visible" detail="Stock x precio" />
        <MetricCard compact loading={loading} value={stockSummary.noStock} label="Sin stock" detail={`${stockSummary.lowStock} con stock bajo`} />
      </div>
      <DataTable rows={result.data} columns={columns} search={search} onSearch={(value) => { setSearch(value); setPage(1); }} page={page} totalPages={result.totalPages} onPage={setPage} loading={loading} sortBy={sortBy} sortOrder={sortOrder} onSort={(key, order) => { setSortBy(key); setSortOrder(order); setPage(1); }} filters={<div><span className="label">Estado</span><SelectMenu compact ariaLabel="Filtrar productos por estado" value={activeFilter} onChange={(value) => { setActiveFilter(value); setPage(1); }} options={[{ value: 'all', label: 'Todos' }, { value: 'active', label: 'Activos' }, { value: 'inactive', label: 'Inactivos' }]} /></div>} />
      <FormDrawer open={drawer} title={editing ? 'Editar producto' : 'Nuevo producto'} onClose={() => setDrawer(false)}>
        <form className="space-y-5" onSubmit={handleSubmit(submit)}>
          <label className="block"><span className="label">Código</span><input className="field" {...register('code')} /></label>
          <label className="block"><span className="label">Nombre</span><input className="field" {...register('name')} /></label>
          <label className="block"><span className="label">Descripción</span><textarea className="field min-h-24" {...register('description')} /></label>
          <div className="grid grid-cols-2 gap-4"><label><span className="label">Unidad</span><input className="field" {...register('unit')} /></label><label><span className="label">Precio</span><input className="field" type="number" step="0.01" {...register('price', { valueAsNumber: true })} /></label></div>
          <label className="block"><span className="label">Stock inicial</span><input className="field" type="number" {...register('stock', { valueAsNumber: true })} /></label>
          <button className="btn-primary w-full" disabled={isSubmitting}>Guardar producto</button>
        </form>
      </FormDrawer>
      <ConfirmModal open={!!deactivate} title="Desactivar producto" message={`El producto ${deactivate?.name ?? ''} no estará disponible para nuevas operaciones.`} onClose={() => setDeactivate(null)} onConfirm={confirmDeactivate} />
    </section>
  );
}
